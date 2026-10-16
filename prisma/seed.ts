import { PrismaClient, Role, UserStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  const defaultPassword = 'Admin@12345';
  const passwordHash = await bcrypt.hash(defaultPassword, 10);

  // 1. Seed Admin Users
  const adminUsers = [
    {
      email: 'admin@kiddojoy.com',
      name: 'Shafiqur Rahman (Super Admin)',
      phone: '+8801700000001',
      role: Role.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
    },
    {
      email: 'orders@kiddojoy.com',
      name: 'Operations Lead (Orders)',
      phone: '+8801700000002',
      role: Role.ORDER_MANAGER,
      status: UserStatus.ACTIVE,
    },
    {
      email: 'inventory@kiddojoy.com',
      name: 'Inventory Manager',
      phone: '+8801700000003',
      role: Role.INVENTORY_MANAGER,
      status: UserStatus.ACTIVE,
    },
  ];

  for (const admin of adminUsers) {
    const user = await prisma.user.upsert({
      where: { email: admin.email },
      update: {
        name: admin.name,
        role: admin.role,
        status: admin.status,
        passwordHash,
        emailVerifiedAt: new Date(),
      },
      create: {
        email: admin.email,
        name: admin.name,
        phone: admin.phone,
        role: admin.role,
        status: admin.status,
        passwordHash,
        emailVerifiedAt: new Date(),
      },
    });
    console.log(`✅ Seeded admin: ${user.name} (${user.email}) -> Role: ${user.role}`);
  }

  // 2. Seed Default Categories
  const categories = [
    { name: 'Toys & Games', slug: 'toys-games' },
    { name: 'Baby Essentials', slug: 'baby-essentials' },
    { name: 'Learning & Books', slug: 'learning-books' },
    { name: 'Montessori Sets', slug: 'montessori-sets' },
    { name: 'Kids Fashion', slug: 'kids-fashion' },
    { name: 'STEM & Robotics', slug: 'stem-robotics' },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name },
      create: { name: cat.name, slug: cat.slug },
    });
  }
  console.log(`✅ Seeded ${categories.length} categories.`);

  // 3. Seed Default Brands
  const brands = [
    { name: 'KiddoJoy', slug: 'kiddojoy' },
    { name: 'Lego Education', slug: 'lego-education' },
    { name: 'Fisher-Price', slug: 'fisher-price' },
    { name: 'Hape Wooden', slug: 'hape-wooden' },
  ];

  for (const b of brands) {
    await prisma.brand.upsert({
      where: { slug: b.slug },
      update: { name: b.name },
      create: { name: b.name, slug: b.slug },
    });
  }
  console.log(`✅ Seeded ${brands.length} brands.`);

  // 4. Seed Default Age Groups
  const ageGroupsData = [
    { rangeLabel: '0-12 Months' },
    { rangeLabel: '1-3 Years' },
    { rangeLabel: '3-5 Years' },
    { rangeLabel: '5-8 Years' },
    { rangeLabel: '8+ Years' },
  ];

  const createdAgeGroups: { id: string; rangeLabel: string }[] = [];
  for (const ag of ageGroupsData) {
    let existing = await prisma.ageGroup.findFirst({
      where: { rangeLabel: ag.rangeLabel },
    });
    if (!existing) {
      existing = await prisma.ageGroup.create({
        data: { rangeLabel: ag.rangeLabel },
      });
    }
    createdAgeGroups.push(existing);
  }
  console.log(`✅ Seeded ${createdAgeGroups.length} age groups.`);

  // 5. Seed Default Developmental Skills
  const skillsData = [
    { name: 'Cognitive & Problem Solving' },
    { name: 'Motor Skills & Coordination' },
    { name: 'STEM & Science' },
    { name: 'Language & Speech' },
    { name: 'Creativity & Art' },
    { name: 'Social & Emotional' },
  ];

  const createdSkills: { id: string; name: string }[] = [];
  for (const sk of skillsData) {
    let existing = await prisma.skill.findFirst({
      where: { name: sk.name },
    });
    if (!existing) {
      existing = await prisma.skill.create({
        data: { name: sk.name },
      });
    }
    createdSkills.push(existing);
  }
  console.log(`✅ Seeded ${createdSkills.length} developmental skills.`);

  // 6. Connect existing products to AgeGroups & Skills if not already connected
  const allProducts = await prisma.product.findMany({
    include: { ageGroups: true, skills: true },
  });

  const age3to5 = createdAgeGroups.find((ag) => ag.rangeLabel.includes('3-5')) || createdAgeGroups[2];
  const age5to8 = createdAgeGroups.find((ag) => ag.rangeLabel.includes('5-8')) || createdAgeGroups[3];
  const cognitiveSkill = createdSkills.find((s) => s.name.includes('Cognitive')) || createdSkills[0];
  const motorSkill = createdSkills.find((s) => s.name.includes('Motor')) || createdSkills[1];
  const stemSkill = createdSkills.find((s) => s.name.includes('STEM')) || createdSkills[2];

  for (const prod of allProducts) {
    if (prod.ageGroups.length === 0 && age3to5) {
      const targetAge = prod.recommendedAge.includes('5+') ? age5to8 : age3to5;
      await prisma.productAgeGroup.create({
        data: {
          productId: prod.id,
          ageGroupId: targetAge.id,
        },
      }).catch(() => {});
    }

    if (prod.skills.length === 0 && cognitiveSkill && motorSkill) {
      await prisma.productSkill.createMany({
        data: [
          { productId: prod.id, skillId: cognitiveSkill.id },
          { productId: prod.id, skillId: prod.name.toLowerCase().includes('gear') || prod.name.toLowerCase().includes('car') ? motorSkill.id : (stemSkill?.id || cognitiveSkill.id) },
        ],
        skipDuplicates: true,
      }).catch(() => {});
    }
  }
  console.log(`✅ Associated ${allProducts.length} existing products to age groups and skills.`);

  console.log('✨ Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
