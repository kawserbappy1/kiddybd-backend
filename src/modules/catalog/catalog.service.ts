import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export const catalogService = {
  listProducts: async (filters: any, pagination: any) => {
    const { page = 1, limit = 50 } = pagination;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {};

    if (filters.status) {
      if (filters.status !== 'ALL') {
        where.status = filters.status;
      }
    } else {
      where.status = { not: 'ARCHIVED' };
    }

    if (filters.categoryId) where.categoryId = filters.categoryId;
    if (filters.brandId) where.brandId = filters.brandId;
    if (filters.ageGroupId) {
      where.ageGroups = {
        some: { ageGroupId: filters.ageGroupId },
      };
    } else if (filters.ageGroup) {
      where.ageGroups = {
        some: {
          ageGroup: {
            rangeLabel: { contains: filters.ageGroup, mode: 'insensitive' },
          },
        },
      };
    }

    if (filters.skillId) {
      where.skills = {
        some: { skillId: filters.skillId },
      };
    } else if (filters.skill) {
      where.skills = {
        some: {
          skill: {
            name: { contains: filters.skill, mode: 'insensitive' },
          },
        },
      };
    }

    if (filters.isFeatured !== undefined) {
      where.isFeatured = filters.isFeatured === 'true' || filters.isFeatured === true;
    }
    if (filters.isBestSeller !== undefined) {
      where.isBestSeller = filters.isBestSeller === 'true' || filters.isBestSeller === true;
    }
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          category: true,
          brand: true,
          ageGroups: { include: { ageGroup: true } },
          skills: { include: { skill: true } },
          variants: {
            include: {
              inventory: true,
            },
          },
          media: {
            orderBy: { sortOrder: 'asc' },
          },
          reviews: {
            where: { status: 'APPROVED' },
            select: { rating: true },
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    return { products, total, page: Number(page), limit: Number(limit) };
  },

  getProductById: async (id: string) => {
    return prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        brand: true,
        ageGroups: { include: { ageGroup: true } },
        skills: { include: { skill: true } },
        variants: {
          include: {
            inventory: true,
          },
        },
        media: true,
      },
    });
  },

  getProductBySlug: async (slug: string) => {
    return prisma.product.findUnique({
      where: { slug },
      include: {
        variants: {
          include: {
            inventory: true,
          },
        },
        media: true,
        ageGroups: { include: { ageGroup: true } },
        skills: { include: { skill: true } },
        category: true,
        brand: true,
        reviews: {
          where: { status: 'APPROVED' },
          include: {
            media: true,
            customer: { select: { name: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  },

  createProduct: async (data: any) => {
    const {
      name,
      slug,
      description,
      shortDescription,
      categoryId,
      brandId,
      status = 'ACTIVE',
      material = 'Plastic / Wood',
      origin = 'Bangladesh',
      recommendedAge = '3+ Years',
      smallPartsWarning = false,
      chokingHazard = false,
      supervisionRequired = false,
      materialSafety = '100% Non-Toxic certified',
      safetyInstructions,
      isFeatured = false,
      isBestSeller = false,
      ageGroupIds,
      skillIds,
      // Variant & Media inputs
      price = 0,
      discountPrice,
      sku,
      quantity = 10,
      imageUrl,
      images,
      videoUrl,
    } = data;

    // Collect all media items to insert
    const mediaItems: { url: string; type: 'IMAGE' | 'VIDEO'; isPrimary: boolean; sortOrder: number }[] = [];
    
    // Process image list
    const allImages: string[] = Array.isArray(images) && images.length > 0 
      ? images.filter(Boolean)
      : (imageUrl ? [imageUrl] : []);

    allImages.forEach((imgUrl, idx) => {
      mediaItems.push({
        url: imgUrl,
        type: 'IMAGE',
        isPrimary: idx === 0,
        sortOrder: idx,
      });
    });

    // Process videoUrl if provided
    if (videoUrl && typeof videoUrl === 'string' && videoUrl.trim()) {
      mediaItems.push({
        url: videoUrl.trim(),
        type: 'VIDEO',
        isPrimary: false,
        sortOrder: mediaItems.length,
      });
    }

    // Generate unique slug if not provided
    const productSlug =
      slug ||
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '') + `-${Date.now().toString().slice(-4)}`;

    const generatedSku =
      sku ||
      `SKU-${name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase()}-${Math.floor(
        1000 + Math.random() * 9000
      )}`;

    // Create Product with primary variant, inventory & media atomically
    return prisma.product.create({
      data: {
        name,
        slug: productSlug,
        description: description || name,
        shortDescription: shortDescription || description || name,
        categoryId,
        brandId: brandId || null,
        status,
        material,
        origin,
        recommendedAge,
        isFeatured: Boolean(isFeatured),
        isBestSeller: Boolean(isBestSeller),
        smallPartsWarning: Boolean(smallPartsWarning),
        chokingHazard: Boolean(chokingHazard),
        supervisionRequired: Boolean(supervisionRequired),
        materialSafety,
        safetyInstructions,
        ageGroups: Array.isArray(ageGroupIds) && ageGroupIds.length > 0
          ? {
              create: ageGroupIds.map((agId: string) => ({
                ageGroup: { connect: { id: agId } },
              })),
            }
          : undefined,
        skills: Array.isArray(skillIds) && skillIds.length > 0
          ? {
              create: skillIds.map((sId: string) => ({
                skill: { connect: { id: sId } },
              })),
            }
          : undefined,
        variants: {
          create: {
            sku: generatedSku,
            title: 'Default Variant',
            price: Number(price),
            discountPrice: discountPrice ? Number(discountPrice) : null,
            weight: 0.5,
            isActive: true,
            inventory: {
              create: {
                quantity: Number(quantity),
                reservedQuantity: 0,
                lowStockThreshold: 5,
              },
            },
          },
        },
        media: mediaItems.length > 0
          ? {
              createMany: {
                data: mediaItems,
              },
            }
          : undefined,
      },
      include: {
        category: true,
        brand: true,
        ageGroups: { include: { ageGroup: true } },
        skills: { include: { skill: true } },
        variants: {
          include: {
            inventory: true,
          },
        },
        media: true,
      },
    });
  },

  updateProduct: async (id: string, data: any) => {
    const {
      name,
      slug,
      description,
      shortDescription,
      categoryId,
      brandId,
      status,
      material,
      origin,
      recommendedAge,
      isFeatured,
      isBestSeller,
      ageGroupIds,
      skillIds,
      price,
      discountPrice,
      quantity,
      imageUrl,
      images,
      videoUrl,
    } = data;

    // Update basic product details
    const product = await prisma.product.update({
      where: { id },
      data: {
        name: name !== undefined ? name : undefined,
        slug: slug !== undefined ? slug : undefined,
        description: description !== undefined ? description : undefined,
        shortDescription: shortDescription !== undefined ? shortDescription : undefined,
        categoryId: categoryId !== undefined ? categoryId : undefined,
        brandId: brandId !== undefined ? brandId : undefined,
        status: status !== undefined ? status : undefined,
        material: material !== undefined ? material : undefined,
        origin: origin !== undefined ? origin : undefined,
        recommendedAge: recommendedAge !== undefined ? recommendedAge : undefined,
        isFeatured: isFeatured !== undefined ? Boolean(isFeatured) : undefined,
        isBestSeller: isBestSeller !== undefined ? Boolean(isBestSeller) : undefined,
      },
      include: {
        variants: {
          include: {
            inventory: true,
          },
        },
        media: true,
      },
    });

    // Sync age groups if provided
    if (ageGroupIds !== undefined) {
      await prisma.productAgeGroup.deleteMany({ where: { productId: id } });
      if (Array.isArray(ageGroupIds) && ageGroupIds.length > 0) {
        await prisma.productAgeGroup.createMany({
          data: ageGroupIds.map((agId: string) => ({
            productId: id,
            ageGroupId: agId,
          })),
        });
      }
    }

    // Sync developmental skills if provided
    if (skillIds !== undefined) {
      await prisma.productSkill.deleteMany({ where: { productId: id } });
      if (Array.isArray(skillIds) && skillIds.length > 0) {
        await prisma.productSkill.createMany({
          data: skillIds.map((sId: string) => ({
            productId: id,
            skillId: sId,
          })),
        });
      }
    }

    // Update variant price / inventory if passed
    if (product.variants.length > 0 && (price !== undefined || quantity !== undefined)) {
      const primaryVariant = product.variants[0];
      await prisma.productVariant.update({
        where: { id: primaryVariant.id },
        data: {
          price: price !== undefined ? Number(price) : undefined,
          discountPrice: discountPrice !== undefined ? (discountPrice ? Number(discountPrice) : null) : undefined,
        },
      });

      if (quantity !== undefined) {
        await prisma.inventory.upsert({
          where: { variantId: primaryVariant.id },
          create: {
            variantId: primaryVariant.id,
            quantity: Number(quantity),
          },
          update: {
            quantity: Number(quantity),
          },
        });
      }
    }

    // Update media if images or videoUrl or imageUrl provided
    if (images !== undefined || videoUrl !== undefined || imageUrl !== undefined) {
      const mediaItems: { url: string; type: 'IMAGE' | 'VIDEO'; isPrimary: boolean; sortOrder: number }[] = [];
      const imageList: string[] = Array.isArray(images)
        ? images.filter(Boolean)
        : (imageUrl ? [imageUrl] : (product.media.filter(m => m.type === 'IMAGE').map(m => m.url)));

      imageList.forEach((imgUrl, idx) => {
        mediaItems.push({
          url: imgUrl,
          type: 'IMAGE',
          isPrimary: idx === 0,
          sortOrder: idx,
        });
      });

      const videoLink = videoUrl !== undefined 
        ? (videoUrl && typeof videoUrl === 'string' && videoUrl.trim() ? videoUrl.trim() : null)
        : product.media.find(m => m.type === 'VIDEO')?.url;

      if (videoLink) {
        mediaItems.push({
          url: videoLink,
          type: 'VIDEO',
          isPrimary: false,
          sortOrder: mediaItems.length,
        });
      }

      // Re-sync media
      await prisma.productMedia.deleteMany({
        where: { productId: id },
      });

      if (mediaItems.length > 0) {
        await prisma.productMedia.createMany({
          data: mediaItems.map(m => ({
            ...m,
            productId: id,
          })),
        });
      }
    }

    return prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        brand: true,
        ageGroups: { include: { ageGroup: true } },
        skills: { include: { skill: true } },
        variants: {
          include: {
            inventory: true,
          },
        },
        media: true,
      },
    });
  },

  deleteProduct: async (id: string) => {
    // Check if this product is part of existing customer orders
    const orderItemCount = await prisma.orderItem.count({
      where: { productId: id },
    });

    if (orderItemCount > 0) {
      // Products with existing order history cannot be hard deleted due to financial and audit integrity; archive it instead
      await prisma.product.update({
        where: { id },
        data: { status: 'ARCHIVED' },
      });
      return { archived: true };
    }

    // Clean up dependent relations that don't have cascade delete
    await prisma.$transaction([
      prisma.cartItem.deleteMany({ where: { productId: id } }),
      prisma.review.deleteMany({ where: { productId: id } }),
      prisma.product.delete({ where: { id } }),
    ]);

    return { deleted: true };
  },

  archiveProduct: async (id: string) => {
    return prisma.product.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    });
  },

  addVariant: async (productId: string, data: any) => {
    return prisma.productVariant.create({
      data: {
        ...data,
        productId,
      },
    });
  },

  updateVariant: async (variantId: string, data: any) => {
    return prisma.productVariant.update({
      where: { id: variantId },
      data,
    });
  },

  // Category CRUD
  getCategories: async () =>
    prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { products: true },
        },
      },
    }),

  createCategory: async (data: { name: string; slug?: string; parentId?: string | null }) => {
    const categorySlug =
      data.slug ||
      data.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');

    return prisma.category.create({
      data: {
        name: data.name,
        slug: categorySlug,
        parentId: data.parentId || null,
      },
    });
  },

  updateCategory: async (id: string, data: { name?: string; slug?: string }) => {
    return prisma.category.update({
      where: { id },
      data: {
        name: data.name,
        slug: data.slug,
      },
    });
  },

  deleteCategory: async (id: string) => {
    return prisma.category.delete({
      where: { id },
    });
  },

  getBrands: async () =>
    prisma.brand.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { products: true },
        },
      },
    }),

  createBrand: async (data: { name: string; slug?: string }) => {
    const slug =
      data.slug ||
      data.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');

    return prisma.brand.create({
      data: {
        name: data.name,
        slug,
      },
    });
  },

  updateBrand: async (id: string, data: { name?: string; slug?: string }) => {
    return prisma.brand.update({
      where: { id },
      data: {
        name: data.name,
        slug: data.slug,
      },
    });
  },

  deleteBrand: async (id: string) => {
    return prisma.brand.delete({
      where: { id },
    });
  },

  getAgeGroups: async () => prisma.ageGroup.findMany({ orderBy: { rangeLabel: 'asc' } }),
  createAgeGroup: async (rangeLabel: string) => prisma.ageGroup.create({ data: { rangeLabel } }),
  getSkills: async () => prisma.skill.findMany({ orderBy: { name: 'asc' } }),
  createSkill: async (name: string) => prisma.skill.create({ data: { name } }),

  // Articles & Blog
  getArticles: async (publishedOnly: boolean = false) => {
    return prisma.article.findMany({
      where: publishedOnly ? { isPublished: true } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  },

  getArticleBySlug: async (slug: string) => {
    return prisma.article.findUnique({
      where: { slug },
    });
  },

  getArticleById: async (id: string) => {
    return prisma.article.findUnique({
      where: { id },
    });
  },

  createArticle: async (data: {
    title: string;
    slug?: string;
    summary?: string;
    content?: string;
    image?: string;
    category?: string;
    readTime?: string;
    isPublished?: boolean;
    author?: string;
  }) => {
    const slug =
      data.slug ||
      data.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '') + `-${Date.now().toString().slice(-4)}`;

    return prisma.article.create({
      data: {
        title: data.title,
        slug,
        summary: data.summary,
        content: data.content,
        image: data.image,
        category: data.category || 'Parenting Guide',
        readTime: data.readTime || '4 min read',
        isPublished: data.isPublished !== undefined ? data.isPublished : true,
        author: data.author || 'KiddyBD Team',
      },
    });
  },

  updateArticle: async (
    id: string,
    data: {
      title?: string;
      slug?: string;
      summary?: string;
      content?: string;
      image?: string;
      category?: string;
      readTime?: string;
      isPublished?: boolean;
      author?: string;
    }
  ) => {
    return prisma.article.update({
      where: { id },
      data,
    });
  },

  deleteArticle: async (id: string) => {
    return prisma.article.delete({
      where: { id },
    });
  },
};

