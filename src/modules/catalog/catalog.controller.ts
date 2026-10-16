import { Request, Response } from 'express';
import { catalogService } from './catalog.service';
import { uploadToCloudinary } from '../../integrations/cloudinary.service';
import { AppError } from '../../common/errors';

export const uploadImage = async (req: Request, res: Response) => {
  if (!req.file) {
    throw new AppError('No image file uploaded', 400, 'FILE_MISSING');
  }

  const folder = (req.query.folder as 'products' | 'avatars') || 'products';
  const result = await uploadToCloudinary(req.file.buffer, folder, req.file.mimetype);

  res.status(200).json({
    status: 'success',
    success: true,
    message: 'Image uploaded successfully',
    data: {
      url: result.url,
      publicId: result.publicId,
    },
  });
};

export const listProducts = async (req: Request, res: Response) => {
  const {
    page,
    limit,
    status,
    categoryId,
    brandId,
    ageGroupId,
    ageGroup,
    skillId,
    skill,
    isFeatured,
    isBestSeller,
    search,
  } = req.query;
  
  const result = await catalogService.listProducts(
    {
      status,
      categoryId,
      brandId,
      ageGroupId,
      ageGroup,
      skillId,
      skill,
      isFeatured,
      isBestSeller,
      search,
    },
    { page, limit }
  );
  
  res.status(200).json({ status: 'success', success: true, data: result });
};

export const getProductById = async (req: Request, res: Response) => {
  const product = await catalogService.getProductById(req.params.id as string);
  if (!product) {
    return res.status(404).json({ status: 'error', success: false, message: 'Product not found' });
  }
  res.status(200).json({ status: 'success', success: true, data: { product } });
};

export const getProductBySlug = async (req: Request, res: Response) => {
  const product = await catalogService.getProductBySlug(req.params.slug as string);
  if (!product) {
    return res.status(404).json({ status: 'error', success: false, message: 'Product not found' });
  }
  res.status(200).json({ status: 'success', success: true, data: { product } });
};

export const createProduct = async (req: Request, res: Response) => {
  const product = await catalogService.createProduct(req.body);
  res.status(201).json({ status: 'success', success: true, message: 'Product created successfully', data: { product } });
};

export const updateProduct = async (req: Request, res: Response) => {
  const product = await catalogService.updateProduct(req.params.id as string, req.body);
  res.status(200).json({ status: 'success', success: true, message: 'Product updated successfully', data: { product } });
};

export const deleteProduct = async (req: Request, res: Response) => {
  const result = await catalogService.deleteProduct(req.params.id as string);
  const message = result.archived
    ? 'Product has associated orders and was moved to ARCHIVED status instead of deleting'
    : 'Product deleted successfully';
  res.status(200).json({ status: 'success', success: true, message, data: result });
};

export const archiveProduct = async (req: Request, res: Response) => {
  const product = await catalogService.archiveProduct(req.params.id as string);
  res.status(200).json({ status: 'success', success: true, message: 'Product archived successfully', data: { product } });
};

export const addVariant = async (req: Request, res: Response) => {
  const variant = await catalogService.addVariant(req.params.id as string, req.body);
  res.status(201).json({ status: 'success', success: true, data: { variant } });
};

export const updateVariant = async (req: Request, res: Response) => {
  const variant = await catalogService.updateVariant(req.params.variantId as string, req.body);
  res.status(200).json({ status: 'success', success: true, data: { variant } });
};

export const getCategories = async (req: Request, res: Response) => {
  const categories = await catalogService.getCategories();
  res.status(200).json({ status: 'success', success: true, data: { categories } });
};

export const createCategory = async (req: Request, res: Response) => {
  const category = await catalogService.createCategory(req.body);
  res.status(201).json({ status: 'success', success: true, message: 'Category created successfully', data: { category } });
};

export const updateCategory = async (req: Request, res: Response) => {
  const category = await catalogService.updateCategory(req.params.id as string, req.body);
  res.status(200).json({ status: 'success', success: true, message: 'Category updated successfully', data: { category } });
};

export const deleteCategory = async (req: Request, res: Response) => {
  await catalogService.deleteCategory(req.params.id as string);
  res.status(200).json({ status: 'success', success: true, message: 'Category deleted successfully' });
};

export const getBrands = async (req: Request, res: Response) => {
  const brands = await catalogService.getBrands();
  res.status(200).json({ status: 'success', success: true, data: { brands } });
};

export const createBrand = async (req: Request, res: Response) => {
  const brand = await catalogService.createBrand(req.body);
  res.status(201).json({ status: 'success', success: true, message: 'Brand created successfully', data: { brand } });
};

export const updateBrand = async (req: Request, res: Response) => {
  const brand = await catalogService.updateBrand(req.params.id as string, req.body);
  res.status(200).json({ status: 'success', success: true, message: 'Brand updated successfully', data: { brand } });
};

export const deleteBrand = async (req: Request, res: Response) => {
  await catalogService.deleteBrand(req.params.id as string);
  res.status(200).json({ status: 'success', success: true, message: 'Brand deleted successfully' });
};

export const getAgeGroups = async (req: Request, res: Response) => {
  const ageGroups = await catalogService.getAgeGroups();
  res.status(200).json({ status: 'success', success: true, data: { ageGroups } });
};

export const createAgeGroup = async (req: Request, res: Response) => {
  const { rangeLabel } = req.body;
  const ageGroup = await catalogService.createAgeGroup(rangeLabel);
  res.status(201).json({ status: 'success', success: true, message: 'Age group created successfully', data: { ageGroup } });
};

export const getSkills = async (req: Request, res: Response) => {
  const skills = await catalogService.getSkills();
  res.status(200).json({ status: 'success', success: true, data: { skills } });
};

export const createSkill = async (req: Request, res: Response) => {
  const { name } = req.body;
  const skill = await catalogService.createSkill(name);
  res.status(201).json({ status: 'success', success: true, message: 'Skill created successfully', data: { skill } });
};

// Articles Controller
export const getArticles = async (req: Request, res: Response) => {
  const publishedOnly = req.query.all !== 'true';
  const articles = await catalogService.getArticles(publishedOnly);
  res.status(200).json({ status: 'success', success: true, data: { articles } });
};

export const getArticleBySlug = async (req: Request, res: Response) => {
  const article = await catalogService.getArticleBySlug(req.params.slug as string);
  if (!article) {
    return res.status(404).json({ status: 'fail', success: false, message: 'Article not found' });
  }
  res.status(200).json({ status: 'success', success: true, data: { article } });
};

export const createArticle = async (req: Request, res: Response) => {
  const article = await catalogService.createArticle(req.body);
  res.status(201).json({ status: 'success', success: true, message: 'Article created successfully', data: { article } });
};

export const updateArticle = async (req: Request, res: Response) => {
  const article = await catalogService.updateArticle(req.params.id as string, req.body);
  res.status(200).json({ status: 'success', success: true, message: 'Article updated successfully', data: { article } });
};

export const deleteArticle = async (req: Request, res: Response) => {
  await catalogService.deleteArticle(req.params.id as string);
  res.status(200).json({ status: 'success', success: true, message: 'Article deleted successfully' });
};

