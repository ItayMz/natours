
// const catchAsync = require('../utils/catchAsync');
const Review = require('../models/reviewModel');
const factory = require('./handlerFactory');

module.exports = {
  setTourUserIds: function (req, res, next) {
    // Allow nested routes
    if (!req.body.tour) req.body.tour = req.params.tourId;
    if (!req.body.user) req.body.user = req.user.id;
    next()
  },
  getAllReviews: factory.getAll(Review),
  getReview: factory.getOne(Review),
  createReview: factory.createOne(Review),
  deleteReview: factory.deleteOne(Review),
  updateReview: factory.updateOne(Review),
};
