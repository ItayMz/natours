const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

module.exports = {
  getOverview: catchAsync(async function(req,res){

    // Get tour data from collection
    const tours = await Tour.find()
    // Build template
    // Render that template using tour data
    res.status(200).render('overview', {
      title: 'All Tours',
      tours
      })
  }),
  getTour: catchAsync(async function (req, res)  {
    // Get the data, for the requested tour (including reviews and guides)
    const tour = await Tour.findOne({slug: req.params.slug}).populate({
      path: 'reviews',
      fields: 'review rating user'
    })
    // Build template
    //Render template using the data 
    res.status(200).render('tour', {
      title: tour.name,
      tour
    })}
)
}
