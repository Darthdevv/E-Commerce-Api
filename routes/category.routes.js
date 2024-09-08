import { Router } from "express";
import { createCategory, deleteCategory, getCategories, getCategoryById, updateCategory } from "../controllers/category.controllers.js";
import { multerHost } from "../middlewares/upload/multer.middleware.js";
import { extensions } from "../utils/fileExtensions.js";
import { findModelByName } from "../middlewares/finder/findByName.middleware.js";
import { Category } from "../models/category.model.js";

const categoryRouter = Router();

categoryRouter
  .route("/")
  .get(getCategories)
  .post(
    multerHost({ allowedExtensions: extensions.Images }).single("image"),
    findModelByName(Category),
    createCategory
  );
categoryRouter
  .route("/:id")
  .get(getCategoryById)
  .put(
    multerHost({ allowedExtensions: extensions.Images }).single("image"),
    findModelByName(Category),
    updateCategory
  )
  .delete(deleteCategory);


export { categoryRouter };
