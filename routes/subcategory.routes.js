import { Router } from "express";
import {
  createSubCategory,
  deleteSubCategory,
  getSubCategories,
  getSubCategoryById,
  updateSubCategory,
} from "../controllers/subcategory.controllers.js";
import { multerHost } from "../middlewares/upload/multer.middleware.js";
import { extensions } from "../utils/fileExtensions.js";
import { findModelByName } from "../middlewares/finder/findByName.middleware.js";
import { SubCategory } from "../models/subcategory.model.js";

const subCategoryRouter = Router();

subCategoryRouter
  .route("/")
  .get(getSubCategories)
  .post(
    multerHost({ allowedExtensions: extensions.Images }).single("image"),
    findModelByName(SubCategory),
    createSubCategory
  );
subCategoryRouter
  .route("/:id")
  .get(getSubCategoryById)
  .put(
    multerHost({ allowedExtensions: extensions.Images }).single("image"),
    findModelByName(SubCategory),
    updateSubCategory
  )
  .delete(deleteSubCategory);

export { subCategoryRouter };
