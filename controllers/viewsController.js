const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

module.exports = {
  
  getTour: catchAsync(async function (req, res, next) {
    console.log("REQUEST OBJ",req);
    const tour = await Tour.findOne({ slug: req.params.slug }).populate({
      path: 'reviews',
      fields: 'review rating user',
    });
    if (!tour) {
      return next(new AppError('Tour not found', 404));
    }

    res.status(200).json({ tour });
  }),
};
