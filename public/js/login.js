import axios from 'axios';
import { showAlert } from './alerts';
export async function login(email, password) {
  try {
    const res = await axios({
      method: 'POST',
      url: 'http://localhost:3000/api/v1/users/login',
      data: {
        email,
        password,
      },
    });
    if (res.data.status === 'success') {
      showAlert('success', 'Logged in successfully');
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
}

export async function logout() {
  try {
    await axios({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/users/logout',
    });
  } catch (err) {
    showAlert('error', 'Error logging out! Try again.');
  }
}

export async function signup(name, email, password, confirmPassword) {
  try {
    const res = await axios({
      method: 'POST',
      url: 'http://localhost:3000/api/v1/users/signup',
      data: {
        name,
        email,
        password,
        confirmPassword,
      },
    });
    if (res.data.status === 'success') {
      showAlert('success', 'Signed up successfully, please check your email');
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
  } catch (err) {
    console.log(err.response)
    showAlert('error', err.response.data.message);
  }
}
