import { Client } from '@elastic/elasticsearch';

import { sleep } from '../shared/helpers/sleep';
import users from '../data/users.json';
import { env } from './config';
import { logger } from '../app';

export const esClient = new Client({
  node: env.ELASTIC,
});

export const USERS_INDEX = 'users';

export const configure = async () => {
  const index = USERS_INDEX;

  await waitToConnect(esClient);

  // Create stocks index
  const indexAlreadyExists = await esClient.indices.exists({ index });
  if (!indexAlreadyExists) {
    await esClient.indices.create({
      index,
      settings: {
        max_ngram_diff: 6,
        analysis: {
          analyzer: {
            ngram_analyzer: {
              type: 'custom',
              tokenizer: 'standard',
              filter: ['lowercase', 'my_ngram_filter'],
            },
          },
          filter: {
            my_ngram_filter: {
              type: 'ngram',
              min_gram: 3, // Minimum ngram length
              max_gram: 5, // Maximum ngram length (optional, can be the same as min_gram)
              // "token_chars": [ "letter", "digit" ]  // Optional: Character types to include (e.g., letters and digits)
            },
          },
        },
      },

      mappings: {
        properties: {
          fName: {
            type: 'text',
            analyzer: 'ngram_analyzer',
          },
          lName: {
            type: 'text',
            analyzer: 'ngram_analyzer',
          },
          dateOfBirth: {
            type: 'date',
          },
          countOfOwnedCars: {
            type: 'integer',
          },
        },
      },
    });
  }

  // Finally, seed the index
  const bulk = generateBulk();
  // await esClient.bulk({
  //   index,
  //   operations: bulk,
  // });
};

// Simple to trick to wait until Elasticsearch is ready
const waitToConnect = async (client: Client) => {
  while (true) {
    try {
      await client.ping({});
      break;
    } catch (error) {
      logger.error(error);
      await sleep(1000);
    }
  }
};

// Generate the bulk used to seed Elasticsearch
const generateBulk = () => {
  const bulk = [];
  let i = 1;
  for (const user of users) {
    bulk.push(
      {
        index: {
          _index: USERS_INDEX,
          _id: i++,
        },
      },
      user,
    );
  }

  return bulk;
};
