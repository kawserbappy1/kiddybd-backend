import { registry } from './registry';
import { sendPhoneOTPSchema, verifyPhoneOTPSchema } from '../modules/auth/auth.validation';
import { z } from 'zod';

// Register Schemas
registry.register('SendPhoneOTPRequest', sendPhoneOTPSchema.shape.body);
registry.register('VerifyPhoneOTPRequest', verifyPhoneOTPSchema.shape.body);

registry.registerPath({
  method: 'post',
  path: '/auth/send-phone-otp',
  summary: 'Send Phone OTP',
  tags: ['Auth'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: sendPhoneOTPSchema.shape.body,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'OTP sent successfully',
      content: {
        'application/json': {
          schema: z.object({ message: z.string() }),
        },
      },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/auth/verify-phone-otp',
  summary: 'Verify Phone OTP',
  tags: ['Auth'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: verifyPhoneOTPSchema.shape.body,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Login successful',
      content: {
        'application/json': {
          schema: z.object({
            user: z.any(),
            accessToken: z.string(),
            refreshToken: z.string(),
          }),
        },
      },
    },
  },
});
