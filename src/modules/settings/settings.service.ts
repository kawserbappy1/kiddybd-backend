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

  // CMS Footer Help & About Pages Content
  pageAbout?: string;
  pageSustainability?: string;
  pageSafety?: string;
  pageCareers?: string;
  pageReturns?: string;
  pageShipping?: string;
  pageFaq?: string;
  pagePrivacy?: string;
  pageTerms?: string;
  pageSizeGuide?: string;
  // Navigation Menus & Footer Sections
  headerMenuItems?: string;
  footerSection2Title?: string;
  footerSection2Links?: string;
  footerSection3Title?: string;
  footerSection3Links?: string;
  footerSection4Title?: string;
  footerSection4Links?: string;
  customPagesJson?: string;

  // Delivery Offer & Free Shipping Configuration
  deliveryOfferEnabled?: string; // 'true' | 'false'
  deliveryOfferThreshold?: string; // e.g. '1500'
  deliveryOfferTitle?: string; // e.g. 'Free shipping on orders over ৳1,500'
  deliveryFeeInsideDhaka?: string; // e.g. '60'
  deliveryFeeOutsideDhaka?: string; // e.g. '120'
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

  pageAbout: '',
  pageSustainability: '',
  pageSafety: '',
  pageCareers: '',
  pageReturns: '',
  pageShipping: '',
  pageFaq: '',
  pagePrivacy: '',
  pageTerms: '',
  pageSizeGuide: '',

  headerMenuItems: JSON.stringify([
    { label: 'Home', href: '/' },
    { label: 'Shop', href: '/products' },
    { label: 'New Arrivals', href: '/products?sort=newest' },
    { label: 'Best Sellers', href: '/products?sort=rating_desc' },
    { label: 'Special Offers', href: '/products?deals=true' },
  ]),
  footerSection2Title: 'Shop',
  footerSection2Links: JSON.stringify([
    { label: 'All Products', href: '/products' },
    { label: 'New Arrivals', href: '/products?sort=newest' },
    { label: 'Best Sellers', href: '/products?sort=rating_desc' },
    { label: 'Special Offers', href: '/products?deals=true' },
    { label: 'Learning & Games', href: '/products?category=Toys%20%26%20Games' },
  ]),
  footerSection3Title: 'Help',
  footerSection3Links: JSON.stringify([
    { label: 'Track Order', href: '/track-order' },
    { label: 'Returns & Refunds', href: '/returns' },
    { label: 'Shipping Info', href: '/shipping' },
    { label: 'Size Guide', href: '/size-guide' },
    { label: 'FAQs', href: '/faq' },
  ]),
  footerSection4Title: 'About',
  footerSection4Links: JSON.stringify([
    { label: 'Our Story', href: '/about' },
    { label: 'Sustainability', href: '/sustainability' },
    { label: 'Safety Standards', href: '/safety' },
    { label: 'Careers', href: '/careers' },
    { label: 'Contact Us', href: '/contact' },
  ]),
  customPagesJson: JSON.stringify([]),
  deliveryOfferEnabled: 'true',
  deliveryOfferThreshold: '1500',
  deliveryOfferTitle: 'Free shipping on orders over ৳1,500',
  deliveryFeeInsideDhaka: '60',
  deliveryFeeOutsideDhaka: '120',
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
