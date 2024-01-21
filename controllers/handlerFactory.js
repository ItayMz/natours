const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const APIFeatures = require('../utils/apiFeatures');

module.exports = {
  deleteOne: (Model) =>
    catchAsync(async function (req, res, next) {
      const document = await Model.findByIdAndDelete(req.params.id);

      if (!document)
        return next(new AppError('No document found with that ID', 404));

      res.status(204).json({
        status: 'success',
        data: null,
      });
    }),
  updateOne: (Model) =>
    catchAsync(async function (req, res, next) {
      const document = await Model.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });
      if (!document)
        return next(new AppError('No document found with that ID', 404));
      res.status(200).json({
        status: 'success',
        data: document,
      });
    }),
  createOne: (Model) =>
    catchAsync(async function (req, res, next) {
      const document = await Model.create(req.body);
      res.status(200).json({
        status: 'success',
        data: { data: document },
      });
    }),
  getOne: (Model, popOptions) => 
    catchAsync(async function (req, res, next) {
      let query = Model.findById(req.params.id);
      if (popOptions) query = query.populate(popOptions);
      const document = await query;

      if (!document) {
        return next(
          new AppError(`No document found with that ID ${req.params.id}`, 404)
        );
      }
      res.status(200).json({
        status: 'success',
        data: { data: document },
      });
    }),
  getAll: (Model) =>
    catchAsync(async function (req, res, next) {
      // To allow for nested GET reviews on tour (hack)
      let filter = {};
      if (req.params.tourId) filter = { tour: req.params.tourId };
      const features = new APIFeatures(Model.find(), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate();
      const document = await features.query;

      //SEND RESPONSE
      res.status(200).json({
        status: 'success',
        results: document.length,
        data: {
          data: document,
        },
      });
    }),
};
