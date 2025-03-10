import type { Request, Response } from 'express';
import { handleServiceResponse } from '../shared/httpHandlers';
import { hubspotService } from './hubspotService';
import { logger } from '../app';
import { ServiceResponse } from '../shared/serviceResponse';
import { StatusCodes } from 'http-status-codes';

class HubspotController {
  public contactSync = async (req: Request, res: Response) => {
    const serviceResponse = await hubspotService.retrieveContacts();
    return handleServiceResponse(serviceResponse, res);
  };
}

export const hubspotController = new HubspotController();
