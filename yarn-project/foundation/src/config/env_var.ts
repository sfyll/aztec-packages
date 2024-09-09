export type EnvVar =
  | 'AZTEC_PORT'
  | 'ASSUME_PROVEN_UNTIL_BLOCK_NUMBER'
  | 'TEST_ACCOUNTS'
  | 'ENABLE_GAS'
  | 'API_PREFIX'
  | 'ETHEREUM_HOST'
  | 'L1_CHAIN_ID'
  | 'MNEMONIC'
  | 'ROLLUP_CONTRACT_ADDRESS'
  | 'REGISTRY_CONTRACT_ADDRESS'
  | 'INBOX_CONTRACT_ADDRESS'
  | 'OUTBOX_CONTRACT_ADDRESS'
  | 'AVAILABILITY_ORACLE_CONTRACT_ADDRESS'
  | 'FEE_JUICE_CONTRACT_ADDRESS'
  | 'FEE_JUICE_PORTAL_CONTRACT_ADDRESS'
  | 'ARCHIVER_URL'
  | 'DEPLOY_AZTEC_CONTRACTS'
  | 'DEPLOY_AZTEC_CONTRACTS_SALT'
  | 'L1_PRIVATE_KEY'
  | 'L2_QUEUE_SIZE'
  | 'WS_BLOCK_CHECK_INTERVAL_MS'
  | 'P2P_ENABLED'
  | 'P2P_BLOCK_CHECK_INTERVAL_MS'
  | 'P2P_PEER_CHECK_INTERVAL_MS'
  | 'P2P_L2_QUEUE_SIZE'
  | 'TCP_LISTEN_ADDR'
  | 'UDP_LISTEN_ADDR'
  | 'P2P_TCP_ANNOUNCE_ADDR'
  | 'P2P_UDP_ANNOUNCE_ADDR'
  | 'PEER_ID_PRIVATE_KEY'
  | 'BOOTSTRAP_NODES'
  | 'P2P_TX_PROTOCOL'
  | 'P2P_MIN_PEERS'
  | 'P2P_MAX_PEERS'
  | 'DATA_DIRECTORY'
  | 'TX_GOSSIP_VERSION'
  | 'P2P_QUERY_FOR_IP'
  | 'P2P_TX_POOL_KEEP_PROVEN_FOR'
  | 'TELEMETRY'
  | 'OTEL_SERVICE_NAME'
  | 'OTEL_EXPORTER_OTLP_METRICS_ENDPOINT'
  | 'OTEL_EXPORTER_OTLP_TRACES_ENDPOINT'
  | 'NETWORK_NAME'
  | 'NETWORK'
  | 'API_KEY'
  | 'AZTEC_NODE_URL'
  | 'ARCHIVER_POLLING_INTERVAL_MS'
  | 'ARCHIVER_VIEM_POLLING_INTERVAL_MS'
  | 'ARCHIVER_MAX_LOGS'
  | 'ARCHIVER_L1_START_BLOCK'
  | 'SEQ_TX_POLLING_INTERVAL_MS'
  | 'SEQ_MAX_TX_PER_BLOCK'
  | 'SEQ_MIN_TX_PER_BLOCK'
  | 'SEQ_MIN_SECONDS_BETWEEN_BLOCKS'
  | 'SEQ_MAX_SECONDS_BETWEEN_BLOCKS'
  | 'COINBASE'
  | 'FEE_RECIPIENT'
  | 'ACVM_WORKING_DIRECTORY'
  | 'ACVM_BINARY_PATH'
  | 'SEQ_ALLOWED_SETUP_FN'
  | 'SEQ_ALLOWED_TEARDOWN_FN'
  | 'SEQ_MAX_BLOCK_SIZE_IN_BYTES'
  | 'ENFORCE_FEES'
  | 'SEQ_PUBLISHER_PRIVATE_KEY'
  | 'SEQ_REQUIRED_CONFIRMATIONS'
  | 'SEQ_PUBLISH_RETRY_INTERVAL_MS'
  | 'VERSION'
  | 'SEQ_DISABLED'
  | 'PROVER_DISABLED'
  | 'PROVER_REAL_PROOFS'
  | 'PROVER_AGENT_ENABLED'
  | 'PROVER_AGENT_POLL_INTERVAL_MS'
  | 'PROVER_AGENT_CONCURRENCY'
  | 'PROVER_JOB_TIMEOUT_MS'
  | 'PROVER_JOB_POLL_INTERVAL_MS'
  | 'PROVER_ID'
  | 'WS_L2_BLOCK_QUEUE_SIZE'
  | 'WS_PROVEN_BLOCKS_ONLY'
  | 'PROVER_PUBLISH_RETRY_INTERVAL_MS'
  | 'PROVER_PUBLISHER_PRIVATE_KEY'
  | 'PROVER_REQUIRED_CONFIRMATIONS'
  | 'PROVER_TEST_DELAY_MS'
  | 'TX_PROVIDER_NODE_URL'
  | 'TXE_PORT'
  | 'LOG_JSON'
  | 'BOT_PXE_URL'
  | 'BOT_PRIVATE_KEY'
  | 'BOT_RECIPIENT_ENCRYPTION_SECRET'
  | 'BOT_TOKEN_SALT'
  | 'BOT_TX_INTERVAL_SECONDS'
  | 'BOT_PRIVATE_TRANSFERS_PER_TX'
  | 'BOT_PUBLIC_TRANSFERS_PER_TX'
  | 'BOT_FEE_PAYMENT_METHOD'
  | 'BOT_NO_START'
  | 'BOT_TX_MINED_WAIT_SECONDS'
  | 'BOT_NO_WAIT_FOR_TRANSFERS'
  | 'BOT_MAX_PENDING_TXS'
  | 'BOT_SKIP_PUBLIC_SIMULATION'
  | 'BOT_L2_GAS_LIMIT'
  | 'BOT_DA_GAS_LIMIT'
  | 'PXE_BLOCK_POLLING_INTERVAL_MS'
  | 'PXE_L2_STARTING_BLOCK'
  | 'PXE_DATA_DIRECTORY'
  | 'BB_BINARY_PATH'
  | 'BB_WORKING_DIRECTORY'
  | 'BB_SKIP_CLEANUP'
  | 'PXE_PROVER_ENABLED'
  | 'BOT_FOLLOW_CHAIN'
  | 'BOT_FLUSH_SETUP_TRANSACTIONS'
  | 'VALIDATOR_PRIVATE_KEY'
  | 'VALIDATOR_DISABLED'
  | 'PROVER_NODE_DISABLE_AUTOMATIC_PROVING'
  | 'PROVER_NODE_MAX_PENDING_JOBS'
  | 'PROOF_VERIFIER_POLL_INTERVAL_MS'
  | 'PROOF_VERIFIER_L1_START_BLOCK'
  | 'LOG_LEVEL'
  | 'DEBUG';
