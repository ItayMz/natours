const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const User = require('../models/userModel');

module.exports = {
  getOverview: catchAsync(async function (req, res) {
    // Get tour data from collection
    const tours = await Tour.find();
    // Build template
    // Render that template using tour data
    res.status(200).render('overview', {
      title: 'All Tours',
      tours,
    });
  }),
  getTour: catchAsync(async function (req, res, next) {
    // Get the data, for the requested tour (including reviews and guides)
    const tour = await Tour.findOne({ slug: req.params.slug }).populate({
      path: 'reviews',
      fields: 'review rating user',
    });

    if (!tour)
      return next(new AppError('There is no tour with that name', 404));
    // Build template
    //Render template using the data
    res.status(200).render('tour', {
      title: tour.name,
      tour,
    });
  }),
  getLoginForm: function (req, res) {
    res.status(200).render('login', {
      title: 'Log into your account',
    });
  },
  getAccount: function (req, res) {
    res.status(200).render('account', {
      title: 'Your account',
    });
  },
  updateUserData: catchAsync(async function (req, res, next) {
    const { name, email } = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { name, email },
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).render('account', {
      title: 'Your account',
      user: updatedUser
    });
  }),
};
