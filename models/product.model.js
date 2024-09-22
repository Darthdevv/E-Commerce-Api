import mongoose from "mongoose";
const { Schema, model } = mongoose;

const productSchema = new Schema(
  {
    // Strings
    title: {},
    slug: {},
    overview: String,
    specifications: Object,
    badge: {},
    // Numbers
    price: {},
    discount: {},
    priceAfterDiscount: {},
    stock: {},
    rating: {},
    // Images
    images: {},
    // Ids
    categoryId: {},
    subCategoryId: {},
    brandId: {},
    createdBy: {},
  },
  { timestamps: true }
);

export const Product = mongoose.models.Product || model("Product", productSchema);
