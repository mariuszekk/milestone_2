import { z } from 'zod';

export const commonValidations = {
  id: z
    .string()
    .refine((data) => !Number.isNaN(Number(data)), 'ID must be a numeric value')
    .transform(Number)
    .refine((num) => num > 0, 'ID must be a positive number'),
  age: z
    .string()
    .refine(
      (data) => !Number.isNaN(Number(data)),
      'AGE must be a numeric value',
    )
    .transform(Number)
    .refine((num) => num > 0, 'AGE must be a positive number'),
};
