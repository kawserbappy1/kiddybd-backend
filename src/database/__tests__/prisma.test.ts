import { prisma } from '../prisma.service';

describe('PrismaService', () => {
  beforeAll(async () => {
    // In a real environment, this connects to a test DB
    // For this test, we just want to ensure it instantiates correctly
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(prisma).toBeDefined();
  });

  it('should have basic models defined', () => {
    expect(prisma.user).toBeDefined();
    expect(prisma.order).toBeDefined();
    expect(prisma.product).toBeDefined();
  });
});
