import { prisma } from '../../database/prisma.service';

export interface SystemSettingsPayload {
  siteName?: string;
  logoUrl?: string;
  faviconUrl?: string;
  footerLogoUrl?: string;
  footerContent?: string;
  contactPhone?: string;
  contactPhoneSecondary?: string;
  contactEmail?: string;
  contactAddress?: string;
  socialFacebook?: string;
  socialInstagram?: string;
  socialYoutube?: string;
  socialTiktok?: string;
  socialLinkedin?: string;
  socialX?: string;
}

const DEFAULT_SETTINGS: SystemSettingsPayload = {
  siteName: 'KiddyBD',
  logoUrl: '/logo-bd.png',
  faviconUrl: '/favicon.ico',
  footerLogoUrl: '/logo-bd.png',
  footerContent:
    'Quality products for every stage of childhood. Because happy kids build a brighter tomorrow.',
  contactPhone: '+880 1893-590140',
  contactPhoneSecondary: '+880 1729-993873',
  contactEmail: 'kiddybd1@gmail.com',
  contactAddress: 'House 12, Road 4, Block-C, Banasree, Dhaka - 1219, Bangladesh',
  socialFacebook: 'https://www.facebook.com/kiddybd1',
  socialInstagram: 'https://www.instagram.com/kiddybd1/',
  socialYoutube: '',
  socialTiktok: '',
  socialLinkedin: '',
  socialX: '',
};

export class SettingsService {
  async getSettings(): Promise<SystemSettingsPayload> {
    const rows = await prisma.systemSetting.findMany();
    const result: any = { ...DEFAULT_SETTINGS };

    for (const row of rows) {
      result[row.key] = row.value;
    }

    return result;
  }

  async updateSettings(data: SystemSettingsPayload): Promise<SystemSettingsPayload> {
    const entries = Object.entries(data);

    for (const [key, value] of entries) {
      if (value !== undefined) {
        await prisma.systemSetting.upsert({
          where: { key },
          update: { value: String(value) },
          create: {
            key,
            value: String(value),
            category: key.startsWith('social') ? 'social' : 'general',
          },
        });
      }
    }

    return this.getSettings();
  }
}

export const settingsService = new SettingsService();
