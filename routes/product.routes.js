import { Router } from "express";
import {
  createProduct,
  deleteProduct,
  getProducts,
  getProductById,
  updateProduct,
} from "../controllers/product.controllers.js";
import { multerHost } from "../middlewares/upload/multer.middleware.js";
import { extensions } from "../utils/fileExtensions.js";
import { findModelByName } from "../middlewares/finder/findByName.middleware.js";
import { Product } from "../models/product.model.js";

const productRouter = Router();

productRouter
  .route("/")
  .get(getProducts)
  .post(
    multerHost({ allowedExtensions: extensions.Images }).single("image"),
    findModelByName(Product),
    createProduct
  );
productRouter
  .route("/:id")
  .get(getProductById)
  .put(
    multerHost({ allowedExtensions: extensions.Images }).single("image"),
    findModelByName(Product),
    updateProduct
  )
  .delete(deleteProduct);

export { productRouter };
