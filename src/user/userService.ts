import { StatusCodes } from 'http-status-codes';

import { User, UserQuery, UserUpdateQuery, UserWithAge } from './userModel';
import { ServiceResponse } from '../shared/serviceResponse';
import { esClient, USERS_INDEX } from '../infra/elasticsearch';
import { logger } from '../app';
import { Client } from '@elastic/elasticsearch';
import users from '../data/users.json';
import { Contact } from '../hubspot/hupspotContactModel';

export class UserService {
  private esClient;

  public constructor(esClient: Client) {
    this.esClient = esClient;
  }
  async findUsers(params: UserQuery): Promise<ServiceResponse<User[] | null>> {
    const query = UserService.createQuery(params);
    const { hits } = await esClient.search<User>({
      index: USERS_INDEX,
      query,
    });
    const users = hits.hits.map((hit) => hit._source);
    if (!users || users.length === 0) {
      return ServiceResponse.failure(
        'No Users found',
        null,
        StatusCodes.NOT_FOUND,
      );
    }
    return ServiceResponse.success<User[]>('Users found', users as any);
  }

  async findByExactAge(
    age: string,
  ): Promise<ServiceResponse<UserWithAge[] | null>> {
    const { hits } = await esClient.search<User>({
      index: USERS_INDEX,
      runtime_mappings: {
        age: {
          type: 'long',
          script: {
            source:
              "def birthDate = doc['dateOfBirth'].value;\n" +
              '            if (birthDate == null) {\n' +
              '                emit(0);\n' +
              '                return;\n' +
              '            }\n' +
              '\n' +
              '            Instant Currentdate = Instant.ofEpochMilli(new Date().getTime());\n' +
              "            Instant Startdate = Instant.ofEpochMilli(doc['dateOfBirth'].value.getMillis());\n" +
              '            def result = ChronoUnit.DAYS.between(Startdate, Currentdate);\n' +
              '\n' +
              '            def nowMilliseconds = new Date().getTime();\n' +
              '            def nowZonedDateTime = Instant.ofEpochMilli(nowMilliseconds).atZone(ZoneId.of("UTC")); // Or your timezone\n' +
              '\n' +
              '            def birthZonedDateTime = birthDate.toInstant().atZone(ZoneId.of("UTC"));\n' +
              '            def age = nowZonedDateTime.getYear() - birthZonedDateTime.getYear();\n' +
              '            if (nowZonedDateTime.getMonthValue() < birthZonedDateTime.getMonthValue() ||\n' +
              '                (nowZonedDateTime.getMonthValue() == birthZonedDateTime.getMonthValue() && nowZonedDateTime.getDayOfMonth() < birthZonedDateTime.getDayOfMonth())) {\n' +
              '                age--;\n' +
              '            }\n' +
              '            emit(age)',
          },
        },
      },
      query: {
        match: {
          age,
        },
      },
      fields: ['age'],
    });

    const users = hits.hits.map((hit) => ({
      fName: hit._source?.fName!,
      lName: hit._source?.lName,
      countOfOwnedCars: hit._source?.countOfOwnedCars,
      dateOfBirth: hit._source?.dateOfBirth,
      age: hit.fields?.age,
    }));
    if (!users || users.length === 0) {
      return ServiceResponse.failure(
        'No Users found',
        null,
        StatusCodes.NOT_FOUND,
      );
    }
    return ServiceResponse.success<UserWithAge[]>('Users found', users);
  }

  async updateCountOfOwnedCarsAndFindUsersByExactAge(
    params: UserUpdateQuery,
  ): Promise<ServiceResponse<UserWithAge[] | null>> {
    try {
      const { id, countOfOwnedCars, age } = params;
      logger.info('update ' + id);
      await esClient.update({
        index: USERS_INDEX,
        id,
        doc: {
          countOfOwnedCars,
        },
      });

      return this.findByExactAge(age);
    } catch (ex) {
      const errorMessage = `Error finding user with id ${params.id}:, ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'An error occurred while finding user.',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private generateContactsBulk = (contacts: Contact[]) => {
    const bulk = [];
    let i = 1;
    for (const contact of contacts) {
      const contactDetails = {
        fName: contact.properties.firstname,
        lName: contact.properties.lastname,
      };
      bulk.push(
        {
          update: {
            _index: USERS_INDEX,
            _id: contact.id,
          },
        },
        {
          doc: {
            ...contactDetails,
          },
          upsert: {
            ...contactDetails,
          },
        },
      );
    }

    return bulk;
  };

  async createOrUpdateUsers(contacts: Contact[]): Promise<void> {
    const contactsBulk = this.generateContactsBulk(contacts);
    try {
      await esClient.bulk({
        index: USERS_INDEX,
        operations: contactsBulk,
      });

      logger.info('Contacts created successfully');
    } catch (e) {
      logger.error('An error occured while creating or updating contacts', e);
      throw new Error('An error occured while creating or updating contacts');
    }
  }

  static createQuery = (params: UserQuery) => {
    const { fName, lName, countOfOwnedCars } = params;
    if (!fName && !lName && !countOfOwnedCars) {
      return {
        match_all: {},
      };
    }

    if (fName) {
      return { match: { fName } };
    }

    if (lName) {
      return { match: { lName } };
    }

    if (countOfOwnedCars) {
      return {
        range: {
          countOfOwnedCars: {
            gt: countOfOwnedCars,
          },
        },
      };
    }
  };
}

export const userService = new UserService(esClient);
