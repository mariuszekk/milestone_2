import { cleanEnv, host, port, str, testOnly } from 'envalid';
import dotenv from 'dotenv';

dotenv.config();

export const env = cleanEnv(process.env, {
  NODE_ENV: str({
    devDefault: testOnly('test'),
    choices: ['development', 'production', 'test'],
  }),
  HOST: host({ devDefault: testOnly('localhost') }),
  PORT: port({ devDefault: testOnly(3000) }),
  ELASTIC: str({ devDefault: 'http://localhost:9002' }),
  HUBSPOT_API: str({ devDefault: 'https://api.hubapi.com/crm/v3/objects/' }),
  HUBSPOT_TOKEN: str({ devDefault: '***' }),
  HUBSPOT_CONTACTS_PAGE_LIMIT: str({ devDefault: '10' }),
});
