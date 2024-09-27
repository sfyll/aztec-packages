import { type Archiver, createArchiver } from '@aztec/archiver';
import { type AztecNode } from '@aztec/circuit-types';
import { type DebugLogger, createDebugLogger } from '@aztec/foundation/log';
import { createProverClient } from '@aztec/prover-client';
import { L1Publisher } from '@aztec/sequencer-client';
import { createSimulationProvider } from '@aztec/simulator';
import { type TelemetryClient } from '@aztec/telemetry-client';
import { NoopTelemetryClient } from '@aztec/telemetry-client/noop';
import { createWorldStateSynchronizer } from '@aztec/world-state';

import { type ProverNodeConfig } from './config.js';
import { AztecNodeProverCoordination } from './prover-coordination/aztec-node-prover-coordination.js';
import { createProverCoordination } from './prover-coordination/factory.js';
import { ProverNode } from './prover-node.js';

/** Creates a new prover node given a config. */
export async function createProverNode(
  config: ProverNodeConfig,
  deps: {
    telemetry?: TelemetryClient;
    log?: DebugLogger;
    aztecNodeTxProvider?: AztecNode;
    archiver?: Archiver;
  } = {},
) {
  const telemetry = deps.telemetry ?? new NoopTelemetryClient();
  const log = deps.log ?? createDebugLogger('aztec:prover');
  const archiver = deps.archiver ?? (await createArchiver(config, telemetry, { blockUntilSync: true }));
  log.verbose(`Created archiver and synced to block ${await archiver.getBlockNumber()}`);

  const worldStateConfig = { ...config, worldStateProvenBlocksOnly: true };
  const worldStateSynchronizer = await createWorldStateSynchronizer(worldStateConfig, archiver, telemetry);
  await worldStateSynchronizer.start();

  const simulationProvider = await createSimulationProvider(config, log);

  const prover = await createProverClient(config, telemetry);

  // REFACTOR: Move publisher out of sequencer package and into an L1-related package
  const publisher = new L1Publisher(config, telemetry);

  const txProvider = deps.aztecNodeTxProvider
    ? new AztecNodeProverCoordination(deps.aztecNodeTxProvider)
    : createProverCoordination(config);

  return new ProverNode(
    prover!,
    publisher,
    archiver,
    archiver,
    archiver,
    worldStateSynchronizer,
    txProvider,
    simulationProvider,
    telemetry,
    {
      disableAutomaticProving: config.proverNodeDisableAutomaticProving,
      maxPendingJobs: config.proverNodeMaxPendingJobs,
      epochSize: config.proverNodeEpochSize,
    },
  );
}
