const mongoose = require('mongoose');
const fs = require('fs');
const Tour = require('../../models/tourModel');
const Review = require('../../models/reviewModel');
const User = require('../../models/userModel');

const dotenv = require('dotenv');
dotenv.config({ path: '../../config.env' });

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log('DB connection successful!');
  });
//Read JSON FILE
const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/tours.json`, 'utf-8')
);
const users = JSON.parse(
  fs.readFileSync(`${__dirname}/users.json`, 'utf-8')
);const reviews = JSON.parse(
  fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8')
);

//IMPOORT DATA INTO DB

async function importData() {
  try {
    await Tour.create(tours);
    await User.create(users,{validateBeforeSave: false});
    await Review.create(reviews);

    console.log('Data successfully loaded');
    process.exit()
  } catch (err) {
    console.error(err);
  }
}

//DELETE ALL DATA FROM DB

async function deleteData() {
  try {
    await Tour.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();

    console.log('Data successfully deleted');
    process.exit()
  } catch (err) {
    console.error(err);
  }
}

if(process.argv[2] === '--import')importData()
if(process.argv[2] === '--delete')deleteData()



//Important note: When importing data, make sure to comment out the first pre save hook in the user model 