import { Router } from "express";
import { createCategory, getCategory, updateCategory } from "../controllers/category.controllers.js";
import { multerHost } from "../middlewares/upload/multer.middleware.js";
import { extensions } from "../utils/fileExtensions.js";

const categoryRouter = Router();

categoryRouter.route('/').get(getCategory).post(multerHost({ allowedExtensions: extensions.Images}).single("image"), createCategory);
categoryRouter.route("/:id").post(updateCategory);

export { categoryRouter };
