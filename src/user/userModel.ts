import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { commonValidations } from '../shared/commonValidation';

extendZodWithOpenApi(z);

export const UserSchema = z.object({
  fName: z.string(),
  lName: z.string(),
  dateOfBirth: z.date(),
  countOfOwnedCars: z.number().positive(),
});

export const UserQuerySchema = z.object({
  body: z.object({
    fName: z.string().optional(),
    lName: z.string().optional(),
    countOfOwnedCars: z.number().positive().optional(),
  }),
});

export type User = z.infer<typeof UserSchema>;
export type UserWithAge = Partial<User & { age: number }>;
export type UserQuery = Partial<Omit<User, 'dateOfBirth'> & { age: string }>;
export type UserUpdateQuery = Required<
  Omit<UserQuery, 'fName' | 'lName'> & { id: string }
>;

// Input Validation for 'GET users/:id' endpoint
export const GetUserSchema = z.object({
  params: z.object({ id: commonValidations.id }),
  body: z.object({ age: commonValidations.age }),
});

export const GetUserExactAgeSchema = z.object({
  query: z.object({ age: commonValidations.age }),
});
