"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.settingsService = exports.SettingsService = void 0;
const prisma_service_1 = require("../../database/prisma.service");
const DEFAULT_SETTINGS = {
    siteName: 'KiddyBD',
    logoUrl: '/logo-bd.png',
    faviconUrl: '/favicon.ico',
    footerLogoUrl: '/logo-bd.png',
    footerContent: 'Quality products for every stage of childhood. Because happy kids build a brighter tomorrow.',
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
class SettingsService {
    async getSettings() {
        const rows = await prisma_service_1.prisma.systemSetting.findMany();
        const result = { ...DEFAULT_SETTINGS };
        for (const row of rows) {
            result[row.key] = row.value;
        }
        return result;
    }
    async updateSettings(data) {
        const entries = Object.entries(data);
        for (const [key, value] of entries) {
            if (value !== undefined) {
                await prisma_service_1.prisma.systemSetting.upsert({
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
exports.SettingsService = SettingsService;
exports.settingsService = new SettingsService();
