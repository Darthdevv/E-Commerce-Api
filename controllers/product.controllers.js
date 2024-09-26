// models
import { Brand } from "../models/brand.model.js";
import { Category } from "../models/category.model.js";
import { SubCategory } from "../models/subcategory.model.js";
import { Product } from "../models/product.model.js";
import slugify from "slugify";
import { nanoid } from "nanoid";
// utils
import appError from "../utils/appError.js";
import { cloudinaryConfig, uploadFile } from "../config/cloudinaryConfig.js";
import { catchAsync } from "../helpers/catchAsync.js";

/**
 * @api {POST} /products  create a  new product
 */
export const createProduct = catchAsync(async (req, res, next) => {
  // destructuring the request body
  const { title, specs, overview, price, discountAmount, discountType, stock } = req.body;

  // getting Ids from query params
  const { categoryId, subCategoryId, brandId } = req.query;

  // checking for Ids
  const requiredBrand = await Brand.findOne({
    _id: brandId,
    categoryId,
    subCategoryId
  }).populate("categoryId").populate("subCategoryId");

  if (!requiredBrand) {
    return next(new appError("Brand Not Found", 404, "Brand Not Found"));
  }

  // Generating product slug
  const slug = slugify(title, {
    replacement: "_",
    lower: true,
  });

  // checking for files
  if (!req.files.length) {
    return next(new appError("No Images Uploaded", 404, "No Images Uploaded"));
  }

  //prices
  let priceAfterDiscount = price;
  if (discountAmount && discountType) {
    if (discountType == "Percentage") {
      priceAfterDiscount = price - (discountAmount * price) / 100;
    } else if (discountType == "Fixed") {
      priceAfterDiscount = price - discountAmount;
    }
  }

  const categoryCustomId = requiredBrand.categoryId.customId;
  const subCategoryCustomId = requiredBrand.subCategoryId.customId;
  const brandCustomId = requiredBrand.customId;
  const customId = nanoid(4);
  const folder = `Uploads/Categories/${categoryCustomId}/SubCategories/${subCategoryCustomId}/Brands/${brandCustomId}/Products/${customId}`
  const URLs = [];
  for (const file of req.files) {
    // upload each image to cloudinary
    const { secure_url, public_id } = await uploadFile({
      file: file.path,
      folder,
    });
    URLs.push({ secure_url, public_id });
  }

  // prepare product object
  const product = {
    title,
    slug,
    overview,
    specs: JSON.parse(specs),
    price,
    priceAfterDiscount,
    discount: {
      type: discountType,
      amount: discountAmount,
    },
    stock,
    images: {
      URLs,
      customId,
    },
    categoryId: requiredBrand.categoryId._id,
    subCategoryId: requiredBrand.subCategoryId._id,
    brandId: requiredBrand._id,
  };

  // create the product in db
  const newProduct = await Product.create(product);

  // send the response
  res.status(201).json({
    status: "success",
    message: "Product created successfully",
    data: newProduct,
  });
});

/**
 * @api {GET} /products Get product by title or id or slug
 */
export const getProducts = catchAsync(async (req, res, next) => {
  const { id, title, slug } = req.query;
  const queryFilter = {};

  // check if the query params are present
  if (id) queryFilter._id = id;
  if (title) queryFilter.name = title;
  if (slug) queryFilter.slug = slug;

  // find the products
  const products = await Product.find(queryFilter);

  if (!products) {
    return next(new appError("Product not found", 404, "Product not found"));
  }

  res.status(200).json({
    status: "success",
    message: "Product found",
    results: products.length,
    data: products,
  });
});

/**
 * @api {GET} /products/:id Get product by id
 */
export const getProductById = catchAsync(async (req, res, next) => {
  // get the product id
  const { id } = req.params;

  // find the product by id
  const product = await Product.findById(id);

  if (!product) {
    return next(new appError("Product not found", 404, "Product not found"));
  }

  res.status(200).json({
    status: "success",
    message: "Product found",
    data: product,
  });
});

/**
 * @api {PUT} /products/:_id  Update a product
 */
export const updateProduct = catchAsync(async (req, res, next) => {
  // get the category id
  const { id } = req.params;

  // find the category by id
  const category = await Category.findById(id);
  if (!category) {
    return next(new appError("Category not found", 404, "Category not found"));
  }
  // name of the category
  const { name, public_id } = req.body;

  if (name) {
    const slug = slugify(name, {
      replacement: "_",
      lower: true,
    });

    category.name = name;
    category.slug = slug;
  }

  //Image
  if (req.file) {
    const splitedPublicId = category.Images.public_id.split(
      `${category.customId}/`
    )[1];

    const { secure_url } = await cloudinaryConfig().uploader.upload(
      req.file.path,
      {
        folder: `Uploads/Categories/${category.customId}`,
        public_id: splitedPublicId,
      }
    );
    category.Images.secure_url = secure_url;
  }

  // save the category with the new changes
  await category.save();

  res.status(200).json({
    status: "success",
    message: "Category updated successfully",
    data: category,
  });
});

/**
 * @api {DELETE} /products/:_id  Delete a product
 */
export const deleteProduct = catchAsync(async (req, res, next) => {
  // get the category id
  const { id } = req.params;

  // find catgory by id and delete it from DB
  const category = await Category.findByIdAndDelete(id);

  if (!category) {
    return next(new appError("Category not found", 404, "Category not found"));
  }

  // Delete the category image and its folder from cloudinary
  const categoryPath = `Uploads/Categories/${category.customId}`;
  await cloudinaryConfig().api.delete_resources_by_prefix(categoryPath);
  await cloudinaryConfig().api.delete_folder(categoryPath);

  // Delete relevant subCategories from DB
  const deletedSubCategories = await SubCategory.deleteMany({
    categoryId: id,
  });
  // Delete relevant brands from DB
  if (deletedSubCategories.deletedCount) {
    await Brand.deleteMany({
      categoryId: id,
    });

    /// Delete Relevant products from DB
  }

  res.status(204).json({
    status: "success",
    message: "Category deleted successfully",
    data: category,
  });
});
