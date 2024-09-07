import slugify from "slugify";
import { nanoid } from "nanoid";
// utils
import appError from "../utils/appError.js";
import {cloudinaryConfig } from '../config/cloudinaryConfig.js';
// models
import { Category } from "../models/category.model.js";
import { catchAsync } from "../helpers/catchAsync.js";

/**
 * @api {POST} /categories/create  create a  new category
 */
export const createCategory = catchAsync(async (req, res, next) => {
  // destructuring the request body
  const { name } = req.body;

  // Generating category slug
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
      folder: `Uploads/Categories/${customId}`,
    }
  );

  // prepare category object
  const category = {
    name,
    slug,
    Images: {
      secure_url,
      public_id,
    },
    customId,
  };

  // create the category in db
  const newCategory = await Category.create(category);

  // send the response
  res.status(201).json({
    status: "success",
    message: "Category created successfully",
    data: newCategory,
  });
});

/**
 * @api {GET} /categories Get category by name or id or slug
 */
export const getCategory = catchAsync(async (req, res, next) => {
  const { id, name, slug } = req.query;
  const queryFilter = {};

  // check if the query params are present
  if (id) queryFilter._id = id;
  if (name) queryFilter.name = name;
  if (slug) queryFilter.slug = slug;

  // find the category
  const category = await Category.find(queryFilter);

  if (!category) {
    return next(
      new appError("Category not found", 404, "Category not found")
    );
  }

  res.status(200).json({
    status: "success",
    message: "Category found",
    results: category.length,
    data: category,
  });
});

/**
 * @api {PUT} /categories/update/:_id  Update a category
 */
export const updateCategory = catchAsync(async (req, res, next) => {
  // get the category id
  const { id } = req.params;
  console.log(id)
  // find the category by id
  const category = await Category.findById(id);
  if (!category) {
    return next(
      new appError("Category not found", 404, "Category not found")
    );
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
