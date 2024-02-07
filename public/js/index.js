import '@babel/polyfill';
import { displayMap } from './mapbox';
import { login, logout, signup } from './login';
import { updateSettings } from './updateSettings';
import { bookTour } from './stripe';
import { leaveReview } from './reviews';
import { likeTour,unlikeTour } from './likeTour';
// DOM ELEMENTS

const mapBox = document.getElementById('map');
const loginForm = document.querySelector('.form--login');
const signupForm = document.querySelector('.form--signup');
const logoutBtn = document.querySelector('.nav__el--logout');
const userDataForm = document.querySelector('.form-user-data');
const userPasswordForm = document.querySelector('.form-user-password');
const bookBtn = document.getElementById('book-tour');
const reviewForm = document.querySelector(".review--form")
const likeTourBtn = document.getElementById("like-button")
const unlikeTourBtn = document.getElementById("unlike-button")
// DELEGATION

if (mapBox) {
  const locations = JSON.parse(
    document.getElementById('map').dataset.locations
  );
  displayMap(locations);
}

if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    login(email, password);
  });
}

if (signupForm) {
  signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    signup(name, email, password, confirmPassword);
  });
}

if (logoutBtn) logoutBtn.addEventListener('click', logout);

if (userDataForm) {
  userDataForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const form = new FormData();
    form.append('name', document.getElementById('name').value);
    form.append('email', document.getElementById('email').value);
    form.append('photo', document.getElementById('photo').files[0]);
    updateSettings(form, 'data');
  });
}

if (userPasswordForm) {
  userPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    document.querySelector('.btn--save-password').textContent = 'Updating...';
    const currentPassword = document.getElementById('password-current').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('password-confirm').value;

    await updateSettings(
      { currentPassword, password, confirmPassword },
      'password'
    );
    document.querySelector('.btn--save-password').textContent = 'Save password';

    document.getElementById('password-current').value = '';
    document.getElementById('password').value = '';
    document.getElementById('password-confirm').value = '';
  });
}

if (bookBtn)
  bookBtn.addEventListener('click', function (e) {
    e.target.textContent = 'Processing...';
    const { tourId } = e.target.dataset;
    bookTour(tourId);
  });

  if(reviewForm){
    reviewForm.addEventListener('submit', function(e){
      e.preventDefault()
      const reviewText = document.getElementById("review").value
      const reviewRating = document.getElementById("rating").value
      const {user,tour} = JSON.parse(reviewForm.dataset.ids)

      leaveReview(reviewText,reviewRating, tour, user)

      document.getElementById("review").textContent = ""
      document.getElementById("rating").textContent = ""
    })
  }

  if(likeTourBtn){
    likeTourBtn.addEventListener('click', function(e){
      e.preventDefault()
      const { tourId } = e.target.dataset;
      likeTour(tourId)
    })
  }
  if(unlikeTourBtn){
    unlikeTourBtn.addEventListener('click', function(e){
      e.preventDefault()
      const { tourId } = e.target.dataset;
      unlikeTour(tourId)
    })
  }
