import { getSchnorrAccount } from '@aztec/accounts/schnorr';
import { type AztecNodeConfig, type AztecNodeService } from '@aztec/aztec-node';
import {
  CompleteAddress,
  type DebugLogger,
  type DeployL1Contracts,
  EthCheatCodes,
  Fr,
  GrumpkinScalar,
  type SentTx,
  TxStatus,
  sleep,
} from '@aztec/aztec.js';
import { ETHEREUM_SLOT_DURATION, EthAddress } from '@aztec/circuits.js';
import { RollupAbi } from '@aztec/l1-artifacts';
import { type BootstrapNode } from '@aztec/p2p';
import { type PXEService, createPXEService, getPXEServiceConfig as getRpcConfig } from '@aztec/pxe';

import { jest } from '@jest/globals';
import fs from 'fs';
import { getContract } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

import {
  type NodeContext,
  createBootstrapNode,
  createNode,
  createNodes,
  generatePeerIdPrivateKeys,
} from './fixtures/setup_p2p_test.js';
import { getPrivateKeyFromIndex, setup } from './fixtures/utils.js';

// Don't set this to a higher value than 9 because each node will use a different L1 publisher account and anvil seeds
const NUM_NODES = 4;
const NUM_TXS_PER_BLOCK = 4;
const NUM_TXS_PER_NODE = 2;
const BOOT_NODE_UDP_PORT = 40400;

const PEER_ID_PRIVATE_KEYS = generatePeerIdPrivateKeys(NUM_NODES);

describe('e2e_p2p_network', () => {
  let config: AztecNodeConfig;
  let logger: DebugLogger;
  let teardown: () => Promise<void>;
  let bootstrapNode: BootstrapNode;
  let bootstrapNodeEnr: string;
  let deployL1ContractsValues: DeployL1Contracts;

  beforeEach(async () => {
    // If we want to test with interval mining, we can use the local host and start `anvil --block-time 12`
    const useLocalHost = false;
    if (useLocalHost) {
      jest.setTimeout(300_000);
    }
    const options = useLocalHost ? { l1RpcUrl: 'http://127.0.0.1:8545' } : {};

    // We need the very first node to be the sequencer for this is the one doing everything throughout the setup.
    // Without it we will wait forever.
    const account = privateKeyToAccount(`0x${getPrivateKeyFromIndex(0)!.toString('hex')}`);

    const initialValidators = [EthAddress.fromString(account.address)];

    ({ teardown, config, logger, deployL1ContractsValues } = await setup(0, {
      initialValidators,
      l1BlockTime: ETHEREUM_SLOT_DURATION,
      salt: 420,
      ...options,
    }));

    bootstrapNode = await createBootstrapNode(BOOT_NODE_UDP_PORT);
    bootstrapNodeEnr = bootstrapNode.getENR().encodeTxt();

    config.minTxsPerBlock = NUM_TXS_PER_BLOCK;
    config.maxTxsPerBlock = NUM_TXS_PER_BLOCK;

    const rollup = getContract({
      address: deployL1ContractsValues.l1ContractAddresses.rollupAddress.toString(),
      abi: RollupAbi,
      client: deployL1ContractsValues.walletClient,
    });

    for (let i = 0; i < NUM_NODES; i++) {
      const account = privateKeyToAccount(`0x${getPrivateKeyFromIndex(i + 1)!.toString('hex')}`);
      await rollup.write.addValidator([account.address]);
      logger.debug(`Adding ${account.address} as validator`);
    }

    // Remove the initial sequencer from the set! This was the sequencer we used for perform the setup.
    logger.debug(`Removing ${account.address} as validator`);
    const txHash = await rollup.write.removeValidator([account.address]);

    await deployL1ContractsValues.publicClient.waitForTransactionReceipt({ hash: txHash });

    //@note   Now we jump ahead to the next epoch such that the validator committee is picked
    //        INTERVAL MINING: If we are using anvil interval mining this will NOT progress the time!
    //        Which means that the validator set will still be empty! So anyone can propose.
    const slotsInEpoch = await rollup.read.EPOCH_DURATION();
    const timestamp = await rollup.read.getTimestampForSlot([slotsInEpoch]);
    const cheatCodes = new EthCheatCodes(config.l1RpcUrl);
    try {
      await cheatCodes.warp(Number(timestamp));
    } catch (err) {
      logger.debug('Warp failed, time already satisfied');
    }

    // Send and await a tx to make sure we mine a block for the warp to correctly progress.
    await deployL1ContractsValues.publicClient.waitForTransactionReceipt({
      hash: await deployL1ContractsValues.walletClient.sendTransaction({ to: account.address, value: 1n, account }),
    });
  });

  const stopNodes = async (bootstrap: BootstrapNode, nodes: AztecNodeService[]) => {
    for (const node of nodes) {
      await node.stop();
    }
    await bootstrap.stop();
  };

  afterEach(() => teardown());

  afterAll(() => {
    for (let i = 0; i < NUM_NODES; i++) {
      fs.rmSync(`./data-${i}`, { recursive: true, force: true });
    }
  });

  it('should rollup txs from all peers', async () => {
    // create the bootstrap node for the network
    if (!bootstrapNodeEnr) {
      throw new Error('Bootstrap node ENR is not available');
    }
    // create our network of nodes and submit txs into each of them
    // the number of txs per node and the number of txs per rollup
    // should be set so that the only way for rollups to be built
    // is if the txs are successfully gossiped around the nodes.
    const contexts: NodeContext[] = [];
    const nodes: AztecNodeService[] = await createNodes(
      config,
      PEER_ID_PRIVATE_KEYS,
      bootstrapNodeEnr,
      NUM_NODES,
      BOOT_NODE_UDP_PORT,
    );

    // wait a bit for peers to discover each other
    await sleep(4000);

    for (const node of nodes) {
      const context = await createPXEServiceAndSubmitTransactions(node, NUM_TXS_PER_NODE);
      contexts.push(context);
    }

    // now ensure that all txs were successfully mined
    await Promise.all(
      contexts.flatMap((context, i) =>
        context.txs.map(async (tx, j) => {
          logger.info(`Waiting for tx ${i}-${j}: ${await tx.getTxHash()} to be mined`);
          return tx.wait();
        }),
      ),
    );

    // shutdown all nodes.
    await stopNodes(bootstrapNode, nodes);
  });

  // NOTE: If this test fails in a PR where the shuffling algorithm is changed, then it is failing as the node with
  // the mocked p2p layer is being picked as the sequencer, and it does not have any transactions in it's mempool.
  // If this is the case, then we should update the test to switch off the mempool of a different node.
  // adjust `nodeToTurnOffTxGossip` in the test below.
  it('should produce an attestation by requesting tx data over the p2p network', async () => {
    /**
     * Birds eye overview of the test
     * 1. We spin up x nodes
     * 2. We turn off receiving a tx via gossip from two of the nodes
     * 3. We send a transactions and gossip it to other nodes
     * 4. The disabled nodes will receive an attestation that it does not have the data for
     * 5. They will request this data over the p2p layer
     * 6. We receive all of the attestations that we need and we produce the block
     *
     * Note: we do not attempt to let this node produce a block, as it will not have received any transactions
     *       from the other pxes.
     */

    if (!bootstrapNodeEnr) {
      throw new Error('Bootstrap node ENR is not available');
    }
    const contexts: NodeContext[] = [];
    const nodes: AztecNodeService[] = await createNodes(
      config,
      PEER_ID_PRIVATE_KEYS,
      bootstrapNodeEnr,
      NUM_NODES,
      BOOT_NODE_UDP_PORT,
    );

    // wait a bit for peers to discover each other
    await sleep(4000);

    // Replace the p2p node implementation of some of the nodes with a spy such that it does not store transactions that are gossiped to it
    // Original implementation of `processTxFromPeer` will store received transactions in the tx pool.
    // We have chosen nodes 0,3 as they do not get chosen to be the sequencer in this test.
    const nodeToTurnOffTxGossip = [0, 3];
    for (const nodeIndex of nodeToTurnOffTxGossip) {
      jest
        .spyOn((nodes[nodeIndex] as any).p2pClient.p2pService, 'processTxFromPeer')
        .mockImplementation((): Promise<void> => {
          return Promise.resolve();
        });
    }

    // Only submit transactions to the first two nodes, so that we avoid our sequencer with a mocked p2p layer being picked to produce a block.
    // If the shuffling algorithm changes, then this will need to be updated.
    for (let i = 0; i < 2; i++) {
      const context = await createPXEServiceAndSubmitTransactions(nodes[i], NUM_TXS_PER_NODE);
      contexts.push(context);
    }

    await Promise.all(
      contexts.flatMap((context, i) =>
        context.txs.map(async (tx, j) => {
          logger.info(`Waiting for tx ${i}-${j}: ${await tx.getTxHash()} to be mined`);
          await tx.wait();
          logger.info(`Tx ${i}-${j}: ${await tx.getTxHash()} has been mined`);
          return await tx.getTxHash();
        }),
      ),
    );

    await stopNodes(bootstrapNode, nodes);
  });

  it('should re-discover stored peers without bootstrap node', async () => {
    const contexts: NodeContext[] = [];
    const nodes: AztecNodeService[] = await createNodes(
      config,
      PEER_ID_PRIVATE_KEYS,
      bootstrapNodeEnr,
      NUM_NODES,
      BOOT_NODE_UDP_PORT,
    );

    // wait a bit for peers to discover each other
    await sleep(3000);

    // stop bootstrap node
    await bootstrapNode.stop();

    // create new nodes from datadir
    const newNodes: AztecNodeService[] = [];

    // stop all nodes
    for (let i = 0; i < NUM_NODES; i++) {
      const node = nodes[i];
      await node.stop();
      logger.info(`Node ${i} stopped`);
      await sleep(1200);
      // TODO: make a restart nodes function
      const newNode = await createNode(
        config,
        PEER_ID_PRIVATE_KEYS[i],
        i + 1 + BOOT_NODE_UDP_PORT,
        undefined,
        i,
        `./data-${i}`,
      );
      logger.info(`Node ${i} restarted`);
      newNodes.push(newNode);
    }

    // wait a bit for peers to discover each other
    await sleep(2000);

    for (const node of newNodes) {
      const context = await createPXEServiceAndSubmitTransactions(node, NUM_TXS_PER_NODE);
      contexts.push(context);
    }

    // now ensure that all txs were successfully mined
    await Promise.all(
      contexts.flatMap((context, i) =>
        context.txs.map(async (tx, j) => {
          logger.info(`Waiting for tx ${i}-${j}: ${await tx.getTxHash()} to be mined`);
          return tx.wait();
        }),
      ),
    );

    // shutdown all nodes.
    await stopNodes(bootstrapNode, newNodes);
  });

  // creates an instance of the PXE and submit a given number of transactions to it.
  const createPXEServiceAndSubmitTransactions = async (
    node: AztecNodeService,
    numTxs: number,
  ): Promise<NodeContext> => {
    const rpcConfig = getRpcConfig();
    const pxeService = await createPXEService(node, rpcConfig, true);

    const secretKey = Fr.random();
    const completeAddress = CompleteAddress.fromSecretKeyAndPartialAddress(secretKey, Fr.random());
    await pxeService.registerAccount(secretKey, completeAddress.partialAddress);

    const txs = await submitTxsTo(pxeService, numTxs);
    return {
      txs,
      account: completeAddress.address,
      pxeService,
      node,
    };
  };

  // submits a set of transactions to the provided Private eXecution Environment (PXE)
  const submitTxsTo = async (pxe: PXEService, numTxs: number) => {
    const txs: SentTx[] = [];
    for (let i = 0; i < numTxs; i++) {
      // const tx = getSchnorrAccount(pxe, Fr.random(), GrumpkinScalar.random(), Fr.random()).deploy();
      const accountManager = getSchnorrAccount(pxe, Fr.random(), GrumpkinScalar.random(), Fr.random());
      const deployMethod = await accountManager.getDeployMethod();
      await deployMethod.create({
        contractAddressSalt: accountManager.salt,
        skipClassRegistration: true,
        skipPublicDeployment: true,
        universalDeploy: true,
      });
      await deployMethod.prove({});
      const tx = deployMethod.send();

      const txHash = await tx.getTxHash();

      logger.info(`Tx sent with hash ${txHash}`);
      const receipt = await tx.getReceipt();
      expect(receipt).toEqual(
        expect.objectContaining({
          status: TxStatus.PENDING,
          error: '',
        }),
      );
      logger.info(`Receipt received for ${txHash}`);
      txs.push(tx);
    }
    return txs;
  };
});
