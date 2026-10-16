import { z } from 'zod';

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must not exceed 50 characters').optional(),
    email: z.string().email('Invalid email address').optional(),
    phone: z.string().optional(),
    password: z.string().min(6, 'Password must be at least 6 characters').optional(),
    avatarUrl: z.string().url('Invalid image URL').nullable().optional(),
  }),
});

export const createAddressSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    phone: z.string().regex(/^01\d{9}$/, 'Invalid BD phone number format'),
    division: z.string().min(2),
    district: z.string().min(2),
    upazila: z.string().min(2),
    area: z.string().min(2),
    addressLine: z.string().min(5),
    landmark: z.string().optional(),
    postalCode: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    isDefault: z.boolean().optional(),
  }),
});

export const updateAddressSchema = z.object({
  body: createAddressSchema.shape.body.partial(),
});
