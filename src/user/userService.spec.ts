import { Client } from '@elastic/elasticsearch';
import { UserService } from './userService';
import { Contact } from '../hubspot/hupspotContactModel';
import pino from 'pino';
jest.mock('../app', () => ({
  services: jest.fn(), // mock
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

//Mock the Elasticsearch Client
jest.mock('@elastic/elasticsearch', () => {
  const mockClient = {
    search: jest.fn(), // Example: Mock search
    bulk: jest.fn(),
  };
  return {
    Client: jest.fn(() => mockClient), // Return a function that returns the mock client
  };
});

jest.mock('pino', () => {
  const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };
  return jest.fn(() => mockLogger); // Return a function that returns the mock logger
});

describe('userService', () => {
  it.each([
    {
      params: {},
      expected: {
        match_all: {},
      },
    },
    {
      params: { fName: 'Adam' },
      expected: {
        match: {
          fName: 'Adam',
        },
      },
    },
    {
      params: { lName: 'Kowalski' },
      expected: {
        match: {
          lName: 'Kowalski',
        },
      },
    },
    {
      params: { lName: 'Kowalski', fName: 'Adam' },
      expected: {
        match: {
          fName: 'Adam',
        },
      },
    },
    {
      params: { countOfOwnedCars: 2 },
      expected: {
        range: {
          countOfOwnedCars: {
            gt: 2,
          },
        },
      },
    },
  ])('create query for $params params', ({ params, expected }) => {
    //when
    const result = UserService.createQuery(params);

    //then
    expect(result).toEqual(expected);
  });

  describe('findUsers', () => {
    let userService: UserService;
    let mockEsClient: jest.Mocked<Client>;

    beforeEach(() => {
      // Create a new mock client for each test
      mockEsClient = new Client({}) as jest.Mocked<Client>;
      userService = new UserService(mockEsClient);
    });

    it('should return all users when no criteria are provided', async () => {
      //given
      const mockSearchResponse = {
        hits: {
          hits: [
            { _source: { fName: 'George Patrick Clooney', lName: 'Patrick' } },
          ],
        },
      };
      (mockEsClient.search as jest.Mock).mockResolvedValue(mockSearchResponse);

      //when
      const result = await userService.findUsers({});

      //then
      expect(mockEsClient.search).toHaveBeenCalledWith({
        index: 'users',
        query: {
          match_all: {},
        },
      });
      expect(result).toEqual({
        message: 'Users found',
        responseObject: [
          {
            fName: 'George Patrick Clooney',
            lName: 'Patrick',
          },
        ],
        statusCode: 200,
        success: true,
      });
    });

    it('should return users when fName field criteria is provided', async () => {
      //given
      const mockSearchResponse = {
        hits: {
          hits: [
            { _source: { fName: 'George Patrick Clooney', lName: 'Patrick' } },
          ],
        },
      };
      (mockEsClient.search as jest.Mock).mockResolvedValue(mockSearchResponse);

      //when
      const result = await userService.findUsers({ fName: 'Adam' });

      //then
      expect(mockEsClient.search).toHaveBeenCalledWith({
        index: 'users',
        query: {
          match: {
            fName: 'Adam',
          },
        },
      });
      expect(result.statusCode).toBe(200);
    });

    it('should return users when lName field criteria is provided', async () => {
      //given
      const mockSearchResponse = {
        hits: {
          hits: [
            { _source: { fName: 'George Patrick Clooney', lName: 'Patrick' } },
          ],
        },
      };
      (mockEsClient.search as jest.Mock).mockResolvedValue(mockSearchResponse);

      //when
      const result = await userService.findUsers({ lName: 'Patrick' });

      //then
      expect(mockEsClient.search).toHaveBeenCalledWith({
        index: 'users',
        query: {
          match: {
            lName: 'Patrick',
          },
        },
      });
      expect(result.statusCode).toBe(200);
    });

    it('should return users when countOfOwnedCars field criteria is provided', async () => {
      //given
      const mockSearchResponse = {
        hits: {
          hits: [
            { _source: { fName: 'George Patrick Clooney', lName: 'Patrick' } },
          ],
        },
      };
      (mockEsClient.search as jest.Mock).mockResolvedValue(mockSearchResponse);

      //when
      const result = await userService.findUsers({ countOfOwnedCars: 1 });

      //then
      expect(mockEsClient.search).toHaveBeenCalledWith({
        index: 'users',
        query: {
          range: {
            countOfOwnedCars: {
              gt: 1,
            },
          },
        },
      });
      expect(result.statusCode).toBe(200);
    });

    it('should filter users by fName when parameters for search contain fName and other fields', async () => {
      //given
      const mockSearchResponse = {
        hits: {
          hits: [
            { _source: { fName: 'George Patrick Clooney', lName: 'Patrick' } },
          ],
        },
      };
      (mockEsClient.search as jest.Mock).mockResolvedValue(mockSearchResponse);

      //when
      const result = await userService.findUsers({
        fName: 'Adam',
        lName: 'Patrick',
      });

      //then
      expect(mockEsClient.search).toHaveBeenCalledWith({
        index: 'users',
        query: {
          match: {
            fName: 'Adam',
          },
        },
      });
      expect(result.statusCode).toBe(200);
    });
  });

  describe('createOrUpdateUsers', () => {
    let userService: UserService;
    let mockEsClient: jest.Mocked<Client>;

    beforeEach(() => {
      // Create a new mock client for each test
      mockEsClient = new Client({}) as jest.Mocked<Client>;
      userService = new UserService(mockEsClient);
    });

    it('should create valid bulk operations for contacts', async () => {
      //given
      const mockContacts: Contact[] = [
        {
          properties: {
            lastname: 'Patrick',
            firstname: 'John',
          },
          id: '1',
        },
      ];

      //when
      await userService.createOrUpdateUsers(mockContacts);

      //then
      expect(mockEsClient.bulk).toHaveBeenCalledWith({
        index: 'users',
        operations: [
          {
            update: {
              _id: '1',
              _index: 'users',
            },
          },
          {
            doc: {
              fName: 'John',
              lName: 'Patrick',
            },
            upsert: {
              fName: 'John',
              lName: 'Patrick',
            },
          },
        ],
      });
    });
  });
});
