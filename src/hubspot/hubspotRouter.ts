import express, { type Router } from 'express';
import { hubspotController } from './hubspotController';

export const hubspotRouter: Router = express.Router();

hubspotRouter.get('/hubspot/contacts/sync', hubspotController.contactSync);
