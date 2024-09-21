import { Router } from "express";
import { Brand } from "../models/brand.model.js";
import { createBrand, deleteBrand, getBrandById, getBrands, updateBrand } from "../controllers/brand.controllers.js";
import { multerHost } from "../middlewares/upload/multer.middleware.js";
import { extensions } from "../utils/fileExtensions.js";
import { findModelByName } from "../middlewares/finder/findByName.middleware.js";

const brandRouter = Router();

brandRouter
  .route("/")
  .get(getBrands)
  .post(
    multerHost({ allowedExtensions: extensions.Images }).single("image"),
    findModelByName(Brand),
    createBrand
  );
brandRouter
  .route("/:id")
  .get(getBrandById)
  .put(
    multerHost({ allowedExtensions: extensions.Images }).single("image"),
    findModelByName(Brand),
    updateBrand
  )
  .delete(deleteBrand);

export { brandRouter };