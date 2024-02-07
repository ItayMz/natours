const multer = require('multer');
const sharp = require('sharp');
const Tour = require('./../models/tourModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');
const AppError = require('../utils/appError');
const User = require('../models/userModel');

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

module.exports = {
  getAllTours: factory.getAll(Tour),
  getTour: factory.getOne(Tour, { path: 'reviews' }),
  createTour: factory.createOne(Tour),
  deleteTour: factory.deleteOne(Tour),
  updateTour: factory.updateOne(Tour),

  uploadTourImages: upload.fields([
    {
      name: 'imageCover',
      maxCount: 1,
    },
    { name: 'images', maxCount: 3 },
  ]),
  resizeTourImages: catchAsync(async function (req, res, next) {
    if (!req.files.imageCover || !req.files.images) return next();

    // 1) Cover image
    req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
    await sharp(req.files.imageCover[0].buffer)
      .resize(2000, 1333)
      .toFormat('jpeg')
      .jpeg({ quality: 90 })
      .toFile(`public/img/tours/${req.body.imageCover}`);

    // 2) Images
    req.body.images = []
    await Promise.all(req.files.images.map(async (file, i) => {
      const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;

      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${filename}`);

        req.body.images.push(filename)
    }));
    next();
  }),
  aliasTopTours: function (req, res, next) {
    req.query.limit = 5;
    req.query.sort = '-ratingsAverage,price';
    req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
    next();
  },

  getTourStats: catchAsync(async function (req, res, next) {
    const stats = await Tour.aggregate([
      {
        $match: { ratingsAverage: { $gte: 4.5 } },
      },
      {
        $group: {
          _id: '$difficulty',
          numTours: { $sum: 1 },
          numRatings: { $sum: '$ratingsQuantity' },
          avgRating: { $avg: '$ratingsAverage' },
          avgPrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' },
        },
      },
      {
        $sort: { avgPrice: 1 },
      },
    ]);
    res.status(200).json({
      status: 'success',
      data: { stats },
    });
  }),
  getMonthlyPlan: catchAsync(async function (req, res, next) {
    const year = req.params.year * 1; //2021

    const plan = await Tour.aggregate([
      {
        $unwind: '$startDates',
      },
      {
        $match: {
          startDates: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`),
          },
        },
      },
      {
        $group: {
          _id: { $month: '$startDates' },
          numTourStarts: { $sum: 1 },
          tours: { $push: '$name' },
        },
      },
      {
        $addFields: { month: '$_id' },
      },
      {
        $project: {
          _id: 0,
        },
      },
      {
        $sort: { numTourStarts: -1 },
      },
      {
        $limit: 6,
      },
    ]);
    res.status(200).json({
      status: 'success',
      data: { plan },
    });
  }),
  // /tours-within/233/center/34.111745,-118.113491/unit/mi
  getToursWithin: catchAsync(async function (req, res, next) {
    const { distance, latlng, unit } = req.params;
    const [lat, lng] = latlng.split(',');

    const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

    if (!lat || !lng) {
      next(
        new AppError(
          'Please provide latitude and longitude in the format of lat,lng',
          400
        )
      );
    }
    const tours = await Tour.find({
      startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
    });
    res.status(200).json({
      status: 'success',
      results: tours.length,
      data: { data: tours },
    });
  }),
  getDistances: catchAsync(async function (req, res, next) {
    const { latlng, unit } = req.params;
    const [lat, lng] = latlng.split(',');

    const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

    if (!lat || !lng) {
      next(
        new AppError(
          'Please provide latitude and longitude in the format of lat,lng',
          400
        )
      );
    }
    const distances = await Tour.aggregate([
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [lng * 1, lat * 1],
          },
          distanceField: 'distance',
          distanceMultiplier: multiplier,
        },
      },
      {
        $project: {
          distance: 1,
          name: 1,
        },
      },
    ]);
    res.status(200).json({
      status: 'success',
      data: { data: distances },
    });
  }),
  likeTour: catchAsync(async function(req,res,next){
    const tour = req.params.id;
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $push: { likedTours: tour } },
      { new: true }
    );
    res.status(200).json({
      status: "success",
      data: updatedUser
    })
  }),
  unlikeTour: catchAsync(async function(req,res,next){
    const tour = req.params.id;
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $pull: { likedTours: tour } },
      { new: true }
    );
    res.status(200).json({
      status: "success",
      data: updatedUser
    })
  })
};
