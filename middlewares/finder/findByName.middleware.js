import appError from "../../utils/appError.js";

export const findModelByName = (model) => {
  return async (req, res, next) => {
    const { name } = req.body;
    const document = await model.findOne({ name });

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