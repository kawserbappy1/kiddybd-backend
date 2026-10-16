import { catalogService } from './src/modules/catalog/catalog.service';
import { prisma } from './src/database/prisma.service';

async function seedProductsPerCategory() {
  console.log('--- Starting Products Seeding for Each Category ---');

  const categories = await prisma.category.findMany();
  const brands = await prisma.brand.findMany();
  const ageGroups = await prisma.ageGroup.findMany();
  const skills = await prisma.skill.findMany();

  console.log(`Found ${categories.length} categories.`);

  const brandKodomo = brands.find(b => b.name.toLowerCase() === 'kodomo')?.id || brands[0]?.id;
  const brandZayan = brands.find(b => b.name.toLowerCase() === 'zayan')?.id || brands[0]?.id;
  const brandArong = brands.find(b => b.name.toLowerCase() === 'arong')?.id || brands[0]?.id;
  const brandIqra = brands.find(b => b.name.toLowerCase() === 'iqra')?.id || brands[0]?.id;

  const sampleProductsData = [
    {
      categorySlug: 'brain-development',
      name: 'Montessori Wooden Geometric Puzzle & Shape Sorter',
      slug: 'montessori-wooden-geometric-puzzle-sorter',
      price: 1250,
      discountPrice: 990,
      quantity: 35,
      brandId: brandIqra,
      material: 'Eco-friendly Beechwood with Non-Toxic Water Paint',
      origin: 'Bangladesh',
      recommendedAge: '2-5 Years',
      description: 'Handcrafted premium Montessori wooden shape sorting and geometry puzzle. Helps developing fine motor skills, hand-eye coordination, color recognition, and cognitive brain logic in early childhood.',
      shortDescription: 'Educational wooden geometry sorting puzzle for cognitive toddlers.',
      images: [
        'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1560859251-d563a49c5e4a?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=800&auto=format&fit=crop&q=80'
      ],
      ageGroupIds: ageGroups.slice(0, 2).map(a => a.id),
      skillIds: skills.slice(0, 3).map(s => s.id),
      isFeatured: true,
      isBestSeller: true
    },
    {
      categorySlug: 'baby-toy',
      name: 'Interactive Musical Crawling Crab with Smart Obstacle Sensor',
      slug: 'interactive-musical-crawling-crab-smart-sensor',
      price: 1450,
      discountPrice: 1190,
      quantity: 40,
      brandId: brandZayan,
      material: 'BPA-free Smooth ABS Safe Plastic',
      origin: 'Imported',
      recommendedAge: '6-24 Months',
      description: 'Fun musical escape crab toy with smart infrared obstacle sensors. Plays joyful melodies with soft LED lighting effects to stimulate sensory development and encourage infant crawling exploration.',
      shortDescription: 'Sensor-driven musical crawling toy to encourage active baby crawling.',
      images: [
        'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1508873696983-2df5293cb325?w=800&auto=format&fit=crop&q=80'
      ],
      ageGroupIds: ageGroups.slice(0, 2).map(a => a.id),
      skillIds: skills.slice(1, 3).map(s => s.id),
      isFeatured: true,
      isBestSeller: true
    },
    {
      categorySlug: 'baby-cloth',
      name: 'Organic Cotton Newborn Unisex Onesies & Romper Set (Pack of 3)',
      slug: 'organic-cotton-newborn-romper-set-3pack',
      price: 1350,
      discountPrice: 1050,
      quantity: 50,
      brandId: brandArong,
      material: '100% GOTS Certified Breathable Organic Cotton',
      origin: 'Bangladesh',
      recommendedAge: '0-12 Months',
      description: 'Ultra-soft, hypoallergenic 100% organic combed cotton rompers with nickel-free snaps for effortless diaper changes. Features scratch-free tags and expandable neckline for baby safety.',
      shortDescription: 'Gentle organic cotton newborn romper 3-pack for sensitive baby skin.',
      images: [
        'https://images.unsplash.com/photo-1522771930-78848d9293e8?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=800&auto=format&fit=crop&q=80'
      ],
      ageGroupIds: [ageGroups[0]?.id].filter(Boolean) as string[],
      skillIds: [],
      isFeatured: false,
      isBestSeller: true
    },
    {
      categorySlug: 'baby-shoe',
      name: 'Soft Sole Anti-Slip Breathable Toddler First Walker Shoes',
      slug: 'soft-sole-anti-slip-toddler-first-walker-shoes',
      price: 890,
      discountPrice: 690,
      quantity: 30,
      brandId: brandZayan,
      material: 'Breathable Cotton Canvas & Flexible Non-Skid Silicone Sole',
      origin: 'Bangladesh',
      recommendedAge: '6-18 Months',
      description: 'Ergonomically engineered first walker shoes crafted to support natural foot bone alignment. Features non-skid flexible rubber dotted grips to safeguard baby from slipping on smooth tiles.',
      shortDescription: 'Featherlight anti-slip soft sole shoes for babies learning to walk.',
      images: [
        'https://images.unsplash.com/photo-1514989940723-e8e51635b782?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=800&auto=format&fit=crop&q=80'
      ],
      ageGroupIds: ageGroups.slice(0, 2).map(a => a.id),
      skillIds: skills.slice(1, 2).map(s => s.id),
      isFeatured: false,
      isBestSeller: false
    },
    {
      categorySlug: 'baby-food',
      name: 'Organic Multigrain Baby Cereal with Banana & Strawberry (250g)',
      slug: 'organic-multigrain-baby-cereal-banana-strawberry',
      price: 750,
      discountPrice: 590,
      quantity: 60,
      brandId: brandKodomo,
      material: '100% Organic Oat, Rice, Freeze-Dried Fruit Powder & Iron',
      origin: 'Imported',
      recommendedAge: '6+ Months',
      description: 'Nutritious fortified organic multigrain cereal for weaning babies. Fortified with essential vitamins, calcium, and iron. Zero preservatives, no artificial flavors, and completely sugar-free.',
      shortDescription: 'Gentle iron-fortified multigrain weaning cereal for infants 6+ months.',
      images: [
        'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1550989460-0adf9ea622e2?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=800&auto=format&fit=crop&q=80'
      ],
      ageGroupIds: ageGroups.slice(0, 2).map(a => a.id),
      skillIds: [],
      isFeatured: true,
      isBestSeller: true
    },
    {
      categorySlug: 'baby-care',
      name: 'Gentle Organic Hypoallergenic Baby Head-to-Toe Wash & Shampoo (400ml)',
      slug: 'gentle-organic-hypoallergenic-baby-wash-shampoo-400ml',
      price: 850,
      discountPrice: 680,
      quantity: 45,
      brandId: brandKodomo,
      material: 'Chamomile Extract, Aloe Vera, Vitamin E (Tear-Free Formula)',
      origin: 'Thailand',
      recommendedAge: 'Newborn to 5 Years',
      description: 'Pediatrician-tested tear-free head-to-toe gentle cleanser. Formulated with organic soothing chamomile and aloe vera extract to maintain natural skin moisture barrier. Paraben and sulfate-free.',
      shortDescription: 'Tear-free soothing organic baby wash & shampoo with natural chamomile.',
      images: [
        'https://images.unsplash.com/photo-1608248597359-2e06f231e342?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop&q=80'
      ],
      ageGroupIds: ageGroups.slice(0, 3).map(a => a.id),
      skillIds: [],
      isFeatured: false,
      isBestSeller: true
    }
  ];

  for (const item of sampleProductsData) {
    const category = categories.find(c => c.slug === item.categorySlug);
    if (!category) {
      console.warn(`Category slug "${item.categorySlug}" not found, skipping.`);
      continue;
    }

    // Check if product with slug already exists
    const existing = await prisma.product.findUnique({
      where: { slug: item.slug }
    });

    if (existing) {
      console.log(`Product "${item.name}" already exists. Updating media with multiple images...`);
      await catalogService.updateProduct(existing.id, {
        categoryId: category.id,
        brandId: item.brandId,
        price: item.price,
        discountPrice: item.discountPrice,
        quantity: item.quantity,
        status: 'ACTIVE',
        images: item.images,
        imageUrl: item.images[0],
        material: item.material,
        origin: item.origin,
        recommendedAge: item.recommendedAge,
        description: item.description,
        shortDescription: item.shortDescription,
        ageGroupIds: item.ageGroupIds,
        skillIds: item.skillIds,
        isFeatured: item.isFeatured,
        isBestSeller: item.isBestSeller
      });
      console.log(`Updated "${item.name}" with ${item.images.length} images.`);
    } else {
      const created = await catalogService.createProduct({
        name: item.name,
        slug: item.slug,
        categoryId: category.id,
        brandId: item.brandId,
        price: item.price,
        discountPrice: item.discountPrice,
        quantity: item.quantity,
        status: 'ACTIVE',
        images: item.images,
        imageUrl: item.images[0],
        material: item.material,
        origin: item.origin,
        recommendedAge: item.recommendedAge,
        description: item.description,
        shortDescription: item.shortDescription,
        ageGroupIds: item.ageGroupIds,
        skillIds: item.skillIds,
        isFeatured: item.isFeatured,
        isBestSeller: item.isBestSeller
      });
      console.log(`Created product: "${created.name}" for category "${category.name}" with ${item.images.length} images.`);
    }
  }

  console.log('--- Completed seeding products for all categories! ---');
}

seedProductsPerCategory()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
