import appError from "../../utils/appError.js";

export const findModelByName = (model) => {
  return async (req, res, next) => {
    const { name , title } = req.body;
    const document = await model.findOne({ name, title });

    if (document) {
      return next(new appError(
        'This name already exists',
        409,
        'This name already exists'
      ))
    }
    next();
  };
}