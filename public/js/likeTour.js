import axios from 'axios';
import { showAlert } from './alerts';
export async function likeTour(tourId){
    try {
        const res = await axios({
          method: 'GET',
          url: `/api/v1/tours/${tourId}/like-current-tour`, 
        });
        if (res.data.status === 'success') {
          showAlert('success', 'Successfully liked the tour');
          window.setTimeout(() => {
            location.reload(true);
          }, 500);
        }
      } catch (err) {
        showAlert('error', err.response.data.message);
      }
}

export async function unlikeTour(tourId){
    try {
        const res = await axios({
          method: 'GET',
          url: `/api/v1/tours/${tourId}/unlike-current-tour`, 
        });
        if (res.data.status === 'success') {
          showAlert('success', 'Successfully unliked the tour');
          window.setTimeout(() => {
            location.reload(true);
          }, 500);
        }
      } catch (err) {
        showAlert('error', err.response.data.message);
      }
}