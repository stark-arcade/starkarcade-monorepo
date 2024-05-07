import { config } from 'dotenv';

config();
config({ path: '../../.env' });

export default () => ({
  db_path: String(process.env.DB_PATH),
  onchain_worker_port: Number(process.env.ONCHAIN_WORKER_PORT) || 3001,
  api_port: Number(process.env.API_PORT) || 5001,
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
});
