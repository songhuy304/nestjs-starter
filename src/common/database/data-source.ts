import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl:
    process.env.APP_ENV === 'local' ? false : { rejectUnauthorized: false },
  entities: ['src/**/*.entity.ts'],
  migrations: [`${__dirname}/migrations/*{.ts,.js}`],
  logging: true,
});
