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
  // Destructure subCategoryId from the request query
  const { subCategoryId } = req.query;

  // Fetch the subcategory and populate the associated categoryId
  const subcategory = await SubCategory.findById(subCategoryId).populate('categoryId');

  // Check if subcategory exists
  if (!subcategory) {
    return next(
      new appError("SubCategory not found", 404, "SubCategory not found")
    );
  }

  // Extract the category from the populated subcategory
  const category = subcategory.categoryId;

  // Check if category exists (in case subcategory has a broken relation)
  if (!category) {
    return next(new appError("Category not found", 404, "Category not found"));
  }

  // Destructure the request body to get the name of the brand
  const { name } = req.body;

  // Generate the slug for the brand name
  const slug = slugify(name, {
    replacement: "_",
    lower: true,
  });

  // Check if the logo file is uploaded
  if (!req.file) {
    return next(
      new appError("Please upload an image", 400, "Please upload an image")
    );
  }

  // Upload the logo to Cloudinary
  const customId = nanoid(4); // Generate a unique customId for the brand
  const { secure_url, public_id } = await cloudinaryConfig().uploader.upload(
    req.file.path,
    {
      folder: `Uploads/Categories/${category.customId}/SubCategories/${subcategory.customId}/Brands/${customId}`,
    }
  );

  // Prepare the brand object
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

  // Create the brand in the database
  const newBrand = await Brand.create(brand);

  // Send the response
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
  // get the brand id
  const { id } = req.params;

  // find the brand by id
  const brand = await Brand.findById(id).populate("categoryId").populate("subCategoryId");

  if (!brand) {
    return next(
      new appError("Brand not found", 404, "Brand not found")
    );
  }
  // name of the brand
  const { name, public_id } = req.body;

  if (name) {
    const slug = slugify(name, {
      replacement: "_",
      lower: true,
    });

    brand.name = name;
    brand.slug = slug;
  }

  //Logo
  if (req.file) {
    const splitedPublicId = brand.Logo.public_id.split(
      `${brand.customId}/`
    )[1];

    const { secure_url } = await cloudinaryConfig().uploader.upload(
      req.file.path,
      {
        folder: `Uploads/Categories/${brand.categoryId.customId}/SubCategories/${brand.subCategoryId.customId}/Brands/${brand.customId}`,
        public_id: splitedPublicId,
      }
    );
    brand.Logo.secure_url = secure_url;
  }

  // save the brand with the new changes
  await brand.save();

  res.status(200).json({
    status: "success",
    message: "Brand updated successfully",
    data: brand,
  });
});

/**
 * @api {DELETE} /brands/:id  Delete a specific brand
 */
export const deleteBrand = catchAsync(async (req, res, next) => {
  // get the brand id
  const { id } = req.params;

  // find brand by id and delete it from DB
  const brand = await Brand.findByIdAndDelete(id).populate("categoryId").populate("subCategoryId");

  if (!brand) {
    return next(
      new appError("Brand not found", 404, "Brand not found")
    );
  }

  // Delete the brand logo and its folder from cloudinary
  const brandPath = `Uploads/Categories/${brand.categoryId.customId}/SubCategories/${brand.subCategoryId.customId}/Brands/${brand.customId}`;
  await cloudinaryConfig().api.delete_resources_by_prefix(brandPath);
  await cloudinaryConfig().api.delete_folder(brandPath);

  // Delete relevant products from DB

  res.status(204).json({
    status: "success",
    message: "Brand deleted successfully",
    data: brand,
  });
});
