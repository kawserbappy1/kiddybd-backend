"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteArticle = exports.updateArticle = exports.createArticle = exports.getArticleBySlug = exports.getArticles = exports.createSkill = exports.getSkills = exports.createAgeGroup = exports.getAgeGroups = exports.deleteBrand = exports.updateBrand = exports.createBrand = exports.getBrands = exports.deleteCategory = exports.updateCategory = exports.createCategory = exports.getCategories = exports.updateVariant = exports.addVariant = exports.archiveProduct = exports.deleteProduct = exports.updateProduct = exports.createProduct = exports.getProductBySlug = exports.getProductById = exports.listProducts = exports.uploadImage = void 0;
const catalog_service_1 = require("./catalog.service");
const cloudinary_service_1 = require("../../integrations/cloudinary.service");
const errors_1 = require("../../common/errors");
const uploadImage = async (req, res) => {
    if (!req.file) {
        throw new errors_1.AppError('No image file uploaded', 400, 'FILE_MISSING');
    }
    const folder = req.query.folder || 'products';
    const result = await (0, cloudinary_service_1.uploadToCloudinary)(req.file.buffer, folder, req.file.mimetype);
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
exports.uploadImage = uploadImage;
const listProducts = async (req, res) => {
    const { page, limit, status, categoryId, brandId, ageGroupId, ageGroup, skillId, skill, isFeatured, isBestSeller, search, } = req.query;
    const result = await catalog_service_1.catalogService.listProducts({
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
    }, { page, limit });
    res.status(200).json({ status: 'success', success: true, data: result });
};
exports.listProducts = listProducts;
const getProductById = async (req, res) => {
    const product = await catalog_service_1.catalogService.getProductById(req.params.id);
    if (!product) {
        return res.status(404).json({ status: 'error', success: false, message: 'Product not found' });
    }
    res.status(200).json({ status: 'success', success: true, data: { product } });
};
exports.getProductById = getProductById;
const getProductBySlug = async (req, res) => {
    const product = await catalog_service_1.catalogService.getProductBySlug(req.params.slug);
    if (!product) {
        return res.status(404).json({ status: 'error', success: false, message: 'Product not found' });
    }
    res.status(200).json({ status: 'success', success: true, data: { product } });
};
exports.getProductBySlug = getProductBySlug;
const createProduct = async (req, res) => {
    const product = await catalog_service_1.catalogService.createProduct(req.body);
    res.status(201).json({ status: 'success', success: true, message: 'Product created successfully', data: { product } });
};
exports.createProduct = createProduct;
const updateProduct = async (req, res) => {
    const product = await catalog_service_1.catalogService.updateProduct(req.params.id, req.body);
    res.status(200).json({ status: 'success', success: true, message: 'Product updated successfully', data: { product } });
};
exports.updateProduct = updateProduct;
const deleteProduct = async (req, res) => {
    const result = await catalog_service_1.catalogService.deleteProduct(req.params.id);
    const message = result.archived
        ? 'Product has associated orders and was moved to ARCHIVED status instead of deleting'
        : 'Product deleted successfully';
    res.status(200).json({ status: 'success', success: true, message, data: result });
};
exports.deleteProduct = deleteProduct;
const archiveProduct = async (req, res) => {
    const product = await catalog_service_1.catalogService.archiveProduct(req.params.id);
    res.status(200).json({ status: 'success', success: true, message: 'Product archived successfully', data: { product } });
};
exports.archiveProduct = archiveProduct;
const addVariant = async (req, res) => {
    const variant = await catalog_service_1.catalogService.addVariant(req.params.id, req.body);
    res.status(201).json({ status: 'success', success: true, data: { variant } });
};
exports.addVariant = addVariant;
const updateVariant = async (req, res) => {
    const variant = await catalog_service_1.catalogService.updateVariant(req.params.variantId, req.body);
    res.status(200).json({ status: 'success', success: true, data: { variant } });
};
exports.updateVariant = updateVariant;
const getCategories = async (req, res) => {
    const categories = await catalog_service_1.catalogService.getCategories();
    res.status(200).json({ status: 'success', success: true, data: { categories } });
};
exports.getCategories = getCategories;
const createCategory = async (req, res) => {
    const category = await catalog_service_1.catalogService.createCategory(req.body);
    res.status(201).json({ status: 'success', success: true, message: 'Category created successfully', data: { category } });
};
exports.createCategory = createCategory;
const updateCategory = async (req, res) => {
    const category = await catalog_service_1.catalogService.updateCategory(req.params.id, req.body);
    res.status(200).json({ status: 'success', success: true, message: 'Category updated successfully', data: { category } });
};
exports.updateCategory = updateCategory;
const deleteCategory = async (req, res) => {
    await catalog_service_1.catalogService.deleteCategory(req.params.id);
    res.status(200).json({ status: 'success', success: true, message: 'Category deleted successfully' });
};
exports.deleteCategory = deleteCategory;
const getBrands = async (req, res) => {
    const brands = await catalog_service_1.catalogService.getBrands();
    res.status(200).json({ status: 'success', success: true, data: { brands } });
};
exports.getBrands = getBrands;
const createBrand = async (req, res) => {
    const brand = await catalog_service_1.catalogService.createBrand(req.body);
    res.status(201).json({ status: 'success', success: true, message: 'Brand created successfully', data: { brand } });
};
exports.createBrand = createBrand;
const updateBrand = async (req, res) => {
    const brand = await catalog_service_1.catalogService.updateBrand(req.params.id, req.body);
    res.status(200).json({ status: 'success', success: true, message: 'Brand updated successfully', data: { brand } });
};
exports.updateBrand = updateBrand;
const deleteBrand = async (req, res) => {
    await catalog_service_1.catalogService.deleteBrand(req.params.id);
    res.status(200).json({ status: 'success', success: true, message: 'Brand deleted successfully' });
};
exports.deleteBrand = deleteBrand;
const getAgeGroups = async (req, res) => {
    const ageGroups = await catalog_service_1.catalogService.getAgeGroups();
    res.status(200).json({ status: 'success', success: true, data: { ageGroups } });
};
exports.getAgeGroups = getAgeGroups;
const createAgeGroup = async (req, res) => {
    const { rangeLabel } = req.body;
    const ageGroup = await catalog_service_1.catalogService.createAgeGroup(rangeLabel);
    res.status(201).json({ status: 'success', success: true, message: 'Age group created successfully', data: { ageGroup } });
};
exports.createAgeGroup = createAgeGroup;
const getSkills = async (req, res) => {
    const skills = await catalog_service_1.catalogService.getSkills();
    res.status(200).json({ status: 'success', success: true, data: { skills } });
};
exports.getSkills = getSkills;
const createSkill = async (req, res) => {
    const { name } = req.body;
    const skill = await catalog_service_1.catalogService.createSkill(name);
    res.status(201).json({ status: 'success', success: true, message: 'Skill created successfully', data: { skill } });
};
exports.createSkill = createSkill;
// Articles Controller
const getArticles = async (req, res) => {
    const publishedOnly = req.query.all !== 'true';
    const articles = await catalog_service_1.catalogService.getArticles(publishedOnly);
    res.status(200).json({ status: 'success', success: true, data: { articles } });
};
exports.getArticles = getArticles;
const getArticleBySlug = async (req, res) => {
    const article = await catalog_service_1.catalogService.getArticleBySlug(req.params.slug);
    if (!article) {
        return res.status(404).json({ status: 'fail', success: false, message: 'Article not found' });
    }
    res.status(200).json({ status: 'success', success: true, data: { article } });
};
exports.getArticleBySlug = getArticleBySlug;
const createArticle = async (req, res) => {
    const article = await catalog_service_1.catalogService.createArticle(req.body);
    res.status(201).json({ status: 'success', success: true, message: 'Article created successfully', data: { article } });
};
exports.createArticle = createArticle;
const updateArticle = async (req, res) => {
    const article = await catalog_service_1.catalogService.updateArticle(req.params.id, req.body);
    res.status(200).json({ status: 'success', success: true, message: 'Article updated successfully', data: { article } });
};
exports.updateArticle = updateArticle;
const deleteArticle = async (req, res) => {
    await catalog_service_1.catalogService.deleteArticle(req.params.id);
    res.status(200).json({ status: 'success', success: true, message: 'Article deleted successfully' });
};
exports.deleteArticle = deleteArticle;
