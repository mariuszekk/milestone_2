import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { commonValidations } from '../shared/commonValidation';
import { UserSchema } from '../user/userModel';

extendZodWithOpenApi(z);

const ContactPropertiesSchema = z.object({
  firstname: z.string(),
  lastname: z.string(),
});
export const ContactSchema = z.object({
  properties: ContactPropertiesSchema,
  id: z.string(),
});

export type Contact = z.infer<typeof ContactSchema>;
