import { validateRequest } from './httpHandlers';
import { GetUserExactAgeSchema } from '../user/userModel';
import express, { Express } from 'express';
import { StatusCodes } from 'http-status-codes';
import supertest from 'supertest';
import { ZodSchema } from 'zod';
jest.mock('../app');

describe('validateRequest Middleware', () => {
  let app: Express;

  const createApp = (schema: ZodSchema) => {
    app = express();
    // app.use("*", (req, res, next) => {
    //   req.query = query
    //   next()
    // })
    // app.use(validateRequest(UserSchema));
    app.get('/params', validateRequest(schema), (_req, _res, next) => {
      const error = new Error('Error passed to next()');
      next(error);
    });

    return supertest(app);
  };

  it('returns 400 when request does not contain any parameters', async () => {
    const response = await createApp(GetUserExactAgeSchema).get('/params');
    expect(response.status).toBe(StatusCodes.BAD_REQUEST);
    expect(response.body).toEqual(
      expect.objectContaining({
        message: 'Invalid input: Required',
      }),
    );
  });

  it('returns 400 when request contains negative age search parameter ', async () => {
    const response = await createApp(GetUserExactAgeSchema).get(
      '/params?age=-1',
    );
    expect(response.status).toBe(StatusCodes.BAD_REQUEST);
    expect(response.body).toEqual(
      expect.objectContaining({
        message: 'Invalid input: AGE must be a positive number',
      }),
    );
  });
});
