import { Router } from "express";
import { createCategory, getCategory, updateCategory } from "../controllers/category.controllers.js";
import { multerHost } from "../middlewares/upload/multer.middleware.js";
import { extensions } from "../utils/fileExtensions.js";
import { findModelByName } from "../middlewares/finder/findByName.middleware.js";
import { Category } from "../models/category.model.js";

const categoryRouter = Router();

categoryRouter.route('/').get(getCategory).post(multerHost({ allowedExtensions: extensions.Images}).single("image"),findModelByName(Category), createCategory);
categoryRouter.route("/:id").post(updateCategory);

export { categoryRouter };
