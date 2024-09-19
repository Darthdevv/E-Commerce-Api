import slugify from "slugify";
import { nanoid } from "nanoid";
// utils
import appError from "../utils/appError.js";
import { cloudinaryConfig } from "../config/cloudinaryConfig.js";
// models
import { Category } from "../models/category.model.js";
import { catchAsync } from "../helpers/catchAsync.js";
import { SubCategory } from "../models/subcategory.model.js";

/**
 * @api {POST} /subcategories create a new subcategory
 */
export const createSubCategory = catchAsync(async (req, res, next) => {
  // check categoryId exists
  const { categoryId } = req.query

  const category = await Category.findById(categoryId);

  if (!category) {
    return next(new appError("Category not found", 404, "Category not found"));
  }
  // destructuring the request body
  const { name } = req.body;

  // Generating subcategory slug
  const slug = slugify(name, {
    replacement: "_",
    lower: true,
  });

  // Image
  if (!req.file) {
    return next(
      new appError("Please upload an image", 400, "Please upload an image")
    );
  }
  // upload the image to cloudinary
  const customId = nanoid(4);
  const { secure_url, public_id } = await cloudinaryConfig().uploader.upload(
    req.file.path,
    {
      folder: `Uploads/Categories/${category.customId}/SubCategories/${customId}`,
    }
  );

  // prepare subcategory object
  const subCategory = {
    name,
    slug,
    Images: {
      secure_url,
      public_id,
    },
    customId,
    categoryId: category._id
  };

  // create the subcategory in db
  const newSubCategory = await SubCategory.create(subCategory);

  // send the response
  res.status(201).json({
    status: "success",
    message: "SubCategory created successfully",
    data: newSubCategory,
  });
});

/**
 * @api {GET} /subcategories Get subcategory by name or id or slug
 */
export const getSubCategories = catchAsync(async (req, res, next) => {
  const { id, name, slug } = req.query;
  const queryFilter = {};

  // check if the query params are present
  if (id) queryFilter._id = id;
  if (name) queryFilter.name = name;
  if (slug) queryFilter.slug = slug;

  // find the category
  const subCategories = await SubCategory.find(queryFilter);

  if (!subCategories) {
    return next(
      new appError("No subCategories Found", 404, "No subCategories Found")
    );
  }

  res.status(200).json({
    status: "success",
    message: "SubCategories found",
    results: subCategories.length,
    data: subCategories,
  });
});

/**
 * @api {GET} /subcategories Get subcategory by id
 */
export const getSubCategoryById = catchAsync(async (req, res, next) => {
  // get the subcategory id
  const { id } = req.params;

  // find the subcategory by id
  const subcategory = await SubCategory.findById(id);

  if (!subcategory) {
    return next(new appError("SubCategory not found", 404, "SubCategory not found"));
  }

  res.status(200).json({
    status: "success",
    message: "SubCategory found",
    data: subcategory,
  });
});

/**
 * @api {PUT} /categories/:_id  Update a subcategory
 */
export const updateSubCategory = catchAsync(async (req, res, next) => {
  // get the subcategory id
  const { id } = req.params;

  // find the subcategory by id
  const subCategory = await SubCategory.findById(id).populate("categoryId");

  if (!subCategory) {
    return next(
      new appError("SubCategory not found", 404, "SubCategory not found")
    );
  }
  // name of the category
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
 * @api {DELETE} /categories/:_id  Delete a subcategory
 */
export const deleteSubCategory = catchAsync(async (req, res, next) => {
  // get the subcategory id
  const { id } = req.params;

  // find subcatgory by id and delete it from DB
  const subCategory = await SubCategory.findByIdAndDelete(id).populate("categoryId");

  if (!subCategory) {
    return next(new appError("SubCategory not found", 404, "SubCategory not found"));
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
