import express, { type Router } from 'express';

import {
  GetUserExactAgeSchema,
  GetUserSchema,
  UserQuerySchema,
} from './userModel';
import { validateRequest } from '../shared/httpHandlers';
import { userController } from './userController';

export const userRouter: Router = express.Router();

userRouter.post(
  '/users',
  validateRequest(UserQuerySchema),
  userController.findUsers,
);
userRouter.post(
  '/users/:id',
  validateRequest(GetUserSchema),
  userController.updateCountOfOwnedCarsAndFindUserByExactAge,
);
userRouter.get(
  '/users',
  validateRequest(GetUserExactAgeSchema),
  userController.findUsersByExactAge,
);

userRouter.post('/users/sync', userController.findUsersByExactAge);
