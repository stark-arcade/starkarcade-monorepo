import { config } from 'dotenv';

config();
config({ path: '../../.env' });

export default () => ({
  db_path: String(process.env.DB_PATH),
  onchain_worker_port: Number(process.env.ONCHAIN_WORKER_PORT) || 3001,
  onchain_queue_port: Number(process.env.ONCHAIN_QUEUE_PORT) || 3002,
  api_port: Number(process.env.API_PORT) || 5001,
  game_ports: {
    game_2048: Number(process.env.PORT_2048) || 5002,
    game_tetris: Number(process.env.PORT_TETRIS) || 5003,
    stark_flip: Number(process.env.PORT_STARKFLIP) || 5004,
    stark_sweep: Number(process.env.PORT_STARKSWEEP) || 5005,
    brew_master: Number(process.env.PORT_BREWMASTER) || 5006,
  },
  beginBlock: Number(process.env.BEGIN_BLOCK) || 0,
  jwt: {
    secret: String(process.env.JWT_SECRET),
    expire: String(process.env.JWT_EXPIRE) || '1d',
  },
  admin_wallet: {
    account_path: String(process.env.ADMIN_ACCOUNT_ADDRESS_PATH),
    keystore_path: String(process.env.ADMIN_KEYSTORE_PATH),
    keystore_password: String(process.env.ADMIN_KEYSTORE_PASSWORD),
  },
  signer_wallet: {
    address: String(process.env.SIGNER_ADDRESS),
    private_key: String(process.env.SIGNER_PRIVATE_KEY),
  },
  dealer_wallet: {
    address: String(process.env.DEALER_ADDRESS),
    private_key: String(process.env.DEALER_PRIVATE_KEY),
  },
});
