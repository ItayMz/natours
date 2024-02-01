import axios from 'axios';
import { showAlert } from './alerts';

export async function leaveReview(review, rating, tour, user) {
  try {
    const res = await axios({
      method: 'POST',
      url: 'http://localhost:3000/api/v1/reviews',
      data: {
        review,
        rating,
        tour,
        user,
      },
    });

    if (res.data.status === 'success') {
      showAlert('success', 'Review was successfully uploaded.');
      setTimeout(() => {
        location.reload(true);
      }, 1000);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
}
