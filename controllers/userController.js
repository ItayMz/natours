const User = require('./../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

function filteredObj(obj, ...allowedFields) {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
}

module.exports = {
  getMe: function (req, res, next) {
    res.status(200).json({
      status: 'success',
      data: { user: req.user },
    });
  },
  updateMe: catchAsync(async function (req, res, next) {
    // 1) Create error if user POSTs password data
    if (req.body.password || req.body.confirmPassword)
      return next(
        new AppError(
          'This route is not for password updates. please use /updateMyPassword',
          400
        )
      );
    // 2) Filtered out unwanted fields names that are not allowed to be updated
    const filteredBody = filteredObj(req.body, 'name', 'email');
    // 3) Update user document
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      filteredBody,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      status: 'success',
      user: updatedUser,
    });
  }),
  deleteMe: catchAsync(async function (req, res, next) {
    await User.findByIdAndUpdate(req.user.id, { active: false });

    res.status(204).json({
      status: 'success',
      data: null,
    });
  }),
  createUser: function (req, res) {
    res.status(500).json({
      status: 'error',
      message: 'This route is not defined! Please use /signup instead',
    });
  },
  getAllUsers: factory.getAll(User),
  getUser: factory.getOne(User),
  //Do NOT update passwords with this!
  updateUser: factory.updateOne(User),
  deleteUser: factory.deleteOne(User),
};
