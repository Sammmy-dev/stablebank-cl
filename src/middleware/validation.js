const { AppError } = require("./errorHandler");

const validateRequest = (schema) => async (req, res, next) => {
  try {
    await schema.validate(
      {
        body: req.body,
        query: req.query,
        params: req.params,
      },
      { abortEarly: false }
    );
    next();
  } catch (error) {
    next(new AppError(error.errors.join(", "), 400));
  }
};

module.exports = {
  validateRequest,
};
