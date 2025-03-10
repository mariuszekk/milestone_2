import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

import { userRouter } from './user/userRouter';
import { configure } from './infra/elasticsearch';
import { pino } from 'pino';
import requestLogger from './shared/requestLogger';
import { hubspotRouter } from './hubspot/hubspotRouter';

const logger = pino({ name: 'server start' });

class App {
  public express: express.Application;

  constructor() {
    this.express = express();

    this.middleware();
    this.services();
    this.routes();
  }

  middleware() {
    this.express.use(morgan(process.env.MORGAN || 'dev'));
    this.express.use(cors());
    this.express.use(express.json());
    // Request logging
    this.express.use(requestLogger);
  }

  services() {
    configure();
  }

  routes() {
    this.express.use(userRouter);
    this.express.use(hubspotRouter);
  }
}

const app = new App().express;
export { app, logger };
