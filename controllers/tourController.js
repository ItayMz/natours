const Tour = require('./../models/tourModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

module.exports = {
  getAllTours: factory.getAll(Tour),
  getTour: factory.getOne(Tour, { path: 'reviews' }),
  createTour: factory.createOne(Tour),
  deleteTour: factory.deleteOne(Tour),
  updateTour: factory.updateOne(Tour),
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

    const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1

    if (!lat || !lng) {
      next(
        new AppError(
          'Please provide latitude and longitude in the format of lat,lng',
          400
        )
      );
    }
    const tours = await Tour.find({
      startLocation: { $geoWithin: { $centerSphere: [[lng, lat],radius] } },
    });
    res.status(200).json({
      status: 'success',
      results: tours.length,
      data: { data: tours },
    });
  }),
  getDistances: catchAsync(async function(req,res,next){
    const { latlng, unit } = req.params;
    const [lat, lng] = latlng.split(',');

const multiplier = unit === 'mi'? 0.000621371 : 0.001

    if (!lat || !lng) {
      next(
        new AppError(
          'Please provide latitude and longitude in the format of lat,lng',
          400
        )
      );
    }
    const distances = await Tour.aggregate([
      {$geoNear:{
        near:{
          type: 'Point',
          coordinates: [lng * 1, lat * 1]
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier
      }},
      {
        $project:{
          distance: 1,
          name: 1
        }
      }
    ])
    res.status(200).json({
      status: 'success',
      data: { data: distances },
    });
  })
};
