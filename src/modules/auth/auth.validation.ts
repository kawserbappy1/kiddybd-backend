import { z } from 'zod';

export const sendPhoneOTPSchema = z.object({
  body: z.object({
    phone: z.string().regex(/^01[3-9]\d{8}$/, 'Invalid BD phone number'),
  }),
});

export const verifyPhoneOTPSchema = z.object({
  body: z.object({
    phone: z.string().regex(/^01[3-9]\d{8}$/, 'Invalid BD phone number'),
    otp: z.string().length(6, 'OTP must be 6 digits'),
  }),
});

export const sendEmailOTPSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
  }),
});

export const verifyEmailOTPSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    otp: z.string().length(6, 'OTP must be 6 digits'),
  }),
});

export const adminLoginSchema = z.object({
  body: z.object({
    email: z.string().min(1, 'Email or User ID is required'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const firebasePhoneLoginSchema = z.object({
  body: z.object({
    idToken: z.string().min(1, 'Firebase ID token is required'),
    phone: z.string().regex(/^01[3-9]\d{8}$/, 'Invalid BD phone number'),
  }),
});


