import axios from 'axios';
import { env } from '../infra/config';
import { logger } from '../app';
import { ServiceResponse } from '../shared/serviceResponse';
import { StatusCodes } from 'http-status-codes';
import { userService } from '../user/userService';
import { sleep } from '../shared/helpers/sleep';
import { Contact } from './hupspotContactModel';

export class HubspotService {
  async retrieveContacts() {
    const { HUBSPOT_API, HUBSPOT_CONTACTS_PAGE_LIMIT } = env;
    try {
      await this.getAllItemsAndProcessPages<Contact>(
        `${HUBSPOT_API}/contacts`,
        { limit: HUBSPOT_CONTACTS_PAGE_LIMIT },
        this.processPage,
      );
      logger.info('All pages processed successfully.');
      return ServiceResponse.success(
        'Contacts synchronization was finished with successfully',
        StatusCodes.OK,
      );
    } catch (error) {
      logger.error('An error occurred:', error);
      return ServiceResponse.failure(
        'Contacts synchronization was finished with error',
        null,
        StatusCodes.BAD_REQUEST,
      );
    }
  }

  private async processPage(items: Contact[]): Promise<void> {
    logger.info('Processing page of items: ' + items.length);
    await userService.createOrUpdateUsers(items);
  }

  private async getAllItemsAndProcessPages<T>(
    baseUrl: string,
    params: Record<string, any> = {},
    processPage: (items: T[]) => Promise<void>,
  ): Promise<void> {
    let nextToken;
    const { HUBSPOT_TOKEN } = env;

    try {
      do {
        const currentParams = { ...params };
        if (nextToken) {
          currentParams.after = nextToken;
        }

        const response = await axios.get(baseUrl, {
          params: currentParams,
          headers: {
            Authorization: `Bearer ${HUBSPOT_TOKEN}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.status < 200 || response.status >= 300) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = response.data;
        const currentItems: T[] = data.results ?? []; // Provide a default empty array

        if (!Array.isArray(currentItems)) {
          throw new Error(
            'Expected an array of items, but received something else.',
          );
        }
        await processPage(currentItems);

        nextToken = data.paging?.next?.after ?? null;
        if (nextToken === undefined || nextToken === null || nextToken === '') {
          nextToken = null;
        }

        if (nextToken) {
          await sleep(500);
        }
      } while (nextToken !== null);
    } catch (error) {
      console.error('Error fetching or processing data:', error);
      throw error;
    }
  }
}

export const hubspotService = new HubspotService();
