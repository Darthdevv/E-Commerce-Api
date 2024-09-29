// models
import { Brand } from "../models/brand.model.js";
import { Product } from "../models/product.model.js";
import slugify from "slugify";
import { nanoid } from "nanoid";
// utils
import appError from "../utils/appError.js";
import { cloudinaryConfig, uploadFile } from "../config/cloudinaryConfig.js";
import { catchAsync } from "../helpers/catchAsync.js";
import APIFeatures from "../utils/apiFeatures.js"

/**
 * @api {POST} /products  create a  new product
 */
export const createProduct = catchAsync(async (req, res, next) => {
  // destructuring the request body
  const {
    title,
    specifications,
    overview,
    price,
    discountAmount,
    discountType,
    stock,
  } = req.body;

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
    specifications: JSON.parse(specifications),
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
  // const { id, title, slug } = req.query;
  // const queryFilter = {};

  // check if the query params are present
  // if (id) queryFilter._id = id;
  // if (title) queryFilter.name = title;
  // if (slug) queryFilter.slug = slug;

  // find the products
  // const products = await Product.find(queryFilter);

  // const { page = 1, limit = 5 } = req.query;
  // const skip = (page - 1) * limit;

  // const products = await Product.paginate({}, {
  //   page,
  //   skip,
  //   limit,
  //   select: "-__v -images"
  // })

  const features = new APIFeatures(
    Product.find(),
    req.query
  )
    .filter()
    .sort()
    .paginate();
  const products = await features.query;

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
  // get the product id from params
  const { id } = req.params;

  // find the product by id
  const product = await Product.findById(id)
    .populate("categoryId")
    .populate("subCategoryId")
    .populate("brandId");

  if (!product) {
    return next(new appError("Product not found", 404, "Product not found"));
  }

  const {
    title,
    stock,
    overview,
    badge,
    price,
    discountAmount,
    discountType,
    specifications,
  } = req.body;

  // title and slug of the product
  if (title) {
    const slug = slugify(title, {
      replacement: "_",
      lower: true,
    });

    product.title = title;
    product.slug = slug;
  }

  // stock of product
  if (stock) product.stock = stock;

  // specifications of product
  if (specifications) product.specifications = JSON.parse(specifications);

  // overview of product
  if (overview) product.overview = overview;

  // stock of product
  if (stock) product.stock = stock;

  // badge of product
  if (badge) product.badge = badge;

  // price and discount of the product
  if (price || discountAmount || discountType) {
    const newPrice = price || product.price;
    const newDiscount = {};
    newDiscount.amount = discountAmount || product.discount.amount;
    newDiscount.type = discountType || product.discount.type;

    if (newDiscount.type == "Percentage") {
      product.priceAfterDiscount =
        newPrice - (newDiscount.amount * newPrice) / 100;
    } else if (newDiscount.type == "Fixed") {
      product.priceAfterDiscount = newPrice - newDiscount.amount;
    } else {
      product.priceAfterDiscount = newPrice;
    }

    product.price = newPrice;
    product.discount = newDiscount;
  }

  // image of the product
  if (req.file) {
    const splitedPublicId = product.images.URLs[0].public_id.split(
      `${product.images.customId}/`
    )[1];

    const { secure_url } = await cloudinaryConfig().uploader.upload(
      req.file.path,
      {
        folder: `Uploads/Categories/${product.categoryId.customId}/SubCategories/${product.subCategoryId.customId}/Brands/${product.brandId.customId}/Products/${product.images.customId}`,
        public_id: splitedPublicId,
      }
    );

    // Find the image in the URLs array and update its secure_url
    product.images.URLs = product.images.URLs.map((imageObj) => {
      if (imageObj.public_id === splitedPublicId) {
        imageObj.secure_url = secure_url;
      }
      return imageObj;
    });
  }

  // save the product with the new changes
  await product.save();

  // send the response
  res.status(200).json({
    status: "success",
    message: "Product updated successfully",
    data: product,
  });
});

/**
 * @api {DELETE} /products/:_id  Delete a product
 */
export const deleteProduct = catchAsync(async (req, res, next) => {
  // get the product id
  const { id } = req.params;

  // find product by id and delete it from DB
  const product = await Product.findByIdAndDelete(id)
    .populate("categoryId")
    .populate("subCategoryId")
    .populate("brandId");

  if (!product) {
    return next(new appError("Product not found", 404, "Product not found"));
  }

  // Delete the product image and its folder from cloudinary
  const productPath = `Uploads/Categories/${product.categoryId.customId}/SubCategories/${product.subCategoryId.customId}/Brands/${product.brandId.customId}/Products/${product.images.customId}`;
  await cloudinaryConfig().api.delete_resources_by_prefix(productPath);
  await cloudinaryConfig().api.delete_folder(productPath);

  // send the response
  res.status(204).json({
    status: "success",
    message: "Product deleted successfully",
    data: product,
  });
});
