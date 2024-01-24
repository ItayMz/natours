const multer = require('multer'); // Multer is a poppular middleware for handling multi-part form data. This means it allows us to upload files from a form.
const sharp = require('sharp'); // Image processing library for node.js
const User = require('./../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

//No image processing

// const multerStorage = multer.diskStorage({
//   // The disk storage gives full control on storing files to disk
//   destination: (req, file, cb) => {
//     // destination is used to determine within which folder the uploaded files should be stored.
//     cb(null, 'public/img/users');
//   },
//   filename: (req, file, cb) => {
//     // filename is used to determine what the file should be named inside the folder.
//     const ext = file.mimetype.split('/')[1]; //Extracting the extention from the file.mimetype property (.jpeg)
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   },
// });

const multerStorage = multer.memoryStorage();

function multerFilter(req, file, cb) {
  // This filter is responsible for filtering out files that are not an image which should not be supported
  if (file.mimetype.startsWith('image')) cb(null, true);
  else cb(new AppError('Not an image! Please upload only images.', 404), false);
}

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

function filteredObj(obj, ...allowedFields) {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
}

module.exports = {
  uploadUserPhoto: upload.single('photo'), // upload.single means we only allow a single file (photo) to be uploaded with this route. The multer middleware will put the file in the req object
  
  resizeUserPhoto: function (req, res, next) { // This middleware triggers right after uploading the picture. the photo first is uploaded to memory storage and then the image is resized by the middleware and finally mounted to the req.file.filename and to the disk storage
    if (!req.file) return next();

    req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

    // Image processing
    sharp(req.file.buffer)
      .resize(500, 500)
      .toFormat('jpeg')
      .jpeg({ quality: 90 })
      .toFile(`public/img/users/${req.file.filename}`);
    next();
  },
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
    if (req.file) filteredBody.photo = req.file.filename;
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
