import slugify from "slugify";
import { nanoid } from "nanoid";
// utils
import appError from "../utils/appError.js";
import { cloudinaryConfig } from "../config/cloudinaryConfig.js";
// models
import { Category } from "../models/category.model.js";
import { catchAsync } from "../helpers/catchAsync.js";
import { SubCategory } from "../models/subcategory.model.js";
import { Brand } from "../models/brand.model.js";

/**
 * @api {POST} /brands create a new brand
 */
export const createBrand = catchAsync(async (req, res, next) => {
  // check categoryId exists
  const { categoryId, subCategoryId } = req.query;

  const category = await Category.findById(categoryId);
  const subcategory = await SubCategory.findById(subCategoryId);

  if (!category) {
    return next(new appError("Category not found", 404, "Category not found"));
  }

  if (!subcategory) {
    return next(
      new appError("SubCategory not found", 404, "SubCategory not found")
    );
  }
  // destructuring the request body
  const { name } = req.body;

  // Generating subcategory slug
  const slug = slugify(name, {
    replacement: "_",
    lower: true,
  });

  // Logo
  if (!req.file) {
    return next(
      new appError("Please upload an image", 400, "Please upload an image")
    );
  }
  // upload the logo to cloudinary
  const customId = nanoid(4);
  const { secure_url, public_id } = await cloudinaryConfig().uploader.upload(
    req.file.path,
    {
      folder: `Uploads/Categories/${category.customId}/SubCategories/${subcategory.customId}/Brands/${customId}`,
    }
  );

  // prepare brand object
  const brand = {
    name,
    slug,
    Logo: {
      secure_url,
      public_id,
    },
    customId,
    categoryId: category._id,
    subCategoryId: subcategory._id,
  };

  // create the brand in db
  const newBrand = await Brand.create(brand);

  // send the response
  res.status(201).json({
    status: "success",
    message: "Brand created successfully",
    data: newBrand,
  });
});

/**
 * @api {GET} /brands Get brands by name or id or slug
 */
export const getBrands = catchAsync(async (req, res, next) => {
  const { id, name, slug } = req.query;
  const queryFilter = {};

  // check if the query params are present
  if (id) queryFilter._id = id;
  if (name) queryFilter.name = name;
  if (slug) queryFilter.slug = slug;

  // find the brand
  const brands = await Brand.find(queryFilter);

  if (!brands) {
    return next(
      new appError("No brands Found", 404, "No brands Found")
    );
  }

  res.status(200).json({
    status: "success",
    message: "Brands found",
    results: brands.length,
    data: brands,
  });
});

/**
 * @api {GET} /brands/:id Get brand by id
 */
export const getBrandById = catchAsync(async (req, res, next) => {
  // get the id by destructuring
  const { id } = req.params;

  // find the brand by id
  const brand = await Brand.findById(id);

  if (!brand) {
    return next(
      new appError("Brand not found", 404, "Brand not found")
    );
  }

  res.status(200).json({
    status: "success",
    message: "Brand found",
    data: brand,
  });
});

/**
 * @api {PUT} /brands/:id  Update a specific brand
 */
export const updateBrand = catchAsync(async (req, res, next) => {
  // get the subcategory id
  const { id } = req.params;

  // find the subcategory by id
  const subCategory = await SubCategory.findById(id).populate("categoryId");

  if (!subCategory) {
    return next(
      new appError("SubCategory not found", 404, "SubCategory not found")
    );
  }
  // name of the subcategory
  const { name, public_id } = req.body;

  if (name) {
    const slug = slugify(name, {
      replacement: "_",
      lower: true,
    });

    subCategory.name = name;
    subCategory.slug = slug;
  }

  //Image
  if (req.file) {
    const splitedPublicId = subCategory.Images.public_id.split(
      `${subCategory.customId}/`
    )[1];

    const { secure_url } = await cloudinaryConfig().uploader.upload(
      req.file.path,
      {
        folder: `Uploads/Categories/${subCategory.categoryId.customId}/SubCategories/${subCategory.customId}`,
        public_id: splitedPublicId,
      }
    );
    subCategory.Images.secure_url = secure_url;
  }

  // save the subcategory with the new changes
  await subCategory.save();

  res.status(200).json({
    status: "success",
    message: "Category updated successfully",
    data: subCategory,
  });
});

/**
 * @api {DELETE} /brands/:id  Delete a specific brand
 */
export const deleteBrand = catchAsync(async (req, res, next) => {
  // get the subcategory id
  const { id } = req.params;

  // find subcatgory by id and delete it from DB
  const subCategory = await SubCategory.findByIdAndDelete(id).populate(
    "categoryId"
  );

  if (!subCategory) {
    return next(
      new appError("SubCategory not found", 404, "SubCategory not found")
    );
  }

  // Delete the subcategory image and its folder from cloudinary
  const subCategoryPath = `Uploads/Categories/${subCategory.categoryId.customId}/SubCategories/${subCategory.customId}`;
  await cloudinaryConfig().api.delete_resources_by_prefix(subCategoryPath);
  await cloudinaryConfig().api.delete_folder(subCategoryPath);

  // Delete relevant brands from DB

  res.status(204).json({
    status: "success",
    message: "SubCategory deleted successfully",
    data: subCategory,
  });
});
