import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { env } from '../../config/env';

export interface EmailProvider {
  sendOTP(email: string, otp: string): Promise<void>;
}

export class MockEmailProvider implements EmailProvider {
  async sendOTP(email: string, otp: string): Promise<void> {
    console.log(`[Mock Email] Sending OTP ${otp} to ${email}`);
  }
}

export class NodemailerEmailProvider implements EmailProvider {
  private transporter: Transporter | null = null;

  private getTransporter(): Transporter | null {
    if (this.transporter) return this.transporter;

    const user = env.SMTP_USER;
    const pass = env.SMTP_PASS;

    if (!user || !pass) {
      return null;
    }

    const port = Number(env.SMTP_PORT || '465');
    this.transporter = nodemailer.createTransport({
      host: env.SMTP_HOST || 'smtp.gmail.com',
      port,
      secure: port === 465, // true for 465, false for 587
      auth: {
        user,
        pass,
      },
    });

    return this.transporter;
  }

  async sendOTP(email: string, otp: string): Promise<void> {
    const transporter = this.getTransporter();

    if (!transporter) {
      console.warn(`[Nodemailer] SMTP_USER or SMTP_PASS not set. Falling back to console log: OTP for ${email} is ${otp}`);
      return;
    }

    const htmlContent = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e5e7eb; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        <div style="background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); padding: 32px 24px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">🧸 KiddyBD</h1>
          <p style="color: rgba(255, 255, 255, 0.9); margin: 6px 0 0; font-size: 14px;">Your Trusted Baby & Kids Store</p>
        </div>
        
        <div style="padding: 32px 28px; text-align: center;">
          <h2 style="color: #1f2937; margin: 0 0 12px; font-size: 20px; font-weight: 700;">Account Verification</h2>
          <p style="color: #4b5563; margin: 0 0 24px; font-size: 14px; line-height: 1.5;">
            Use the following One-Time Password (OTP) to securely sign in or complete your registration.
          </p>

          <div style="background: #fdf2f8; border: 2px dashed #f472b6; border-radius: 12px; padding: 18px 24px; display: inline-block; margin-bottom: 24px;">
            <span style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #db2777; font-family: monospace;">${otp}</span>
          </div>

          <p style="color: #6b7280; font-size: 12px; margin: 0 0 8px;">
            This OTP will expire in <strong>5 minutes</strong>. Never share this code with anyone.
          </p>
        </div>

        <div style="background: #f9fafb; padding: 16px 24px; text-align: center; border-top: 1px solid #f3f4f6;">
          <p style="color: #9ca3af; font-size: 11px; margin: 0;">
            © ${new Date().getFullYear()} KiddyBD. All rights reserved. If you didn't request this code, you can safely ignore this email.
          </p>
        </div>
      </div>
    `;

    try {
      const info = await transporter.sendMail({
        from: env.SMTP_FROM || `KiddyBD <${env.SMTP_USER}>`,
        to: email,
        subject: `Your KiddyBD Verification OTP: ${otp}`,
        text: `Your KiddyBD verification OTP is ${otp}. It will expire in 5 minutes.`,
        html: htmlContent,
      });

      console.log(`[Nodemailer] OTP successfully sent to ${email}. Message ID: ${info.messageId}`);
    } catch (error: any) {
      console.error(`[Nodemailer Error] Failed to send email to ${email}:`, error?.message || error);
      throw new Error(`Failed to send email OTP: ${error?.message || 'SMTP Error'}`);
    }
  }
}
