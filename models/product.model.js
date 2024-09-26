import mongoose from "mongoose";
const { Schema, model } = mongoose;

const productSchema = new Schema(
  {
    // Strings
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      lowercase: true,
    },
    overview: String,
    specifications: Object,
    badge: {
      type: String,
      enum: ["New", "Sale", "Best Seller"],
    },
    // Numbers
    price: {
      type: Number,
      required: true,
      min: 50,
    },
    discount: {
      type: {
        type: String,
        enum: ["Percentage", "Fixed"],
        default: "Percentage",
      },
      amount: {
        type: Number,
        min: 0,
        default: 0,
      },
    },
    priceAfterDiscount: {
      type: Number,
      required: true,
    },
    stock: {
      type: Number,
      required: true,
      min: 10,
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    // Images
    images: {
      URLs: [{
        secure_url: {
          type: String,
          required: true,
        },
        public_id: {
          type: String,
          required: true,
          unique: true,
        }
      }],
      customId: {
        type: String,
        required: true,
        unique: true,
      },
    },
    // Ids
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    subCategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubCategory",
      required: true,
    },
    brandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // TODO: Change to true after adding authentication
    },
  },
  { timestamps: true }
);

export const Product = mongoose.models.Product || model("Product", productSchema);
