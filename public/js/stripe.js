import axios from 'axios';
import { showAlert } from './alerts';

const stripe = Stripe(
  'pk_test_51OcXkJHgi1prQc23qqNSMvw4jQAtDFtAAn4zGvwkHW9BgkDZpmPvEBotYcwcjTS4sLitx9K3tYO3UhENtx8psE3h00QXfoBUxV'
);

export async function bookTour(tourId) {
  try {
    // 1) Get checkout session from API
    const session = await axios({
      url: `http://localhost:3000/api/v1/bookings/checkout-session/${tourId}`,
    });
    // 2) Create checkout form + charge credit card

    await stripe.redirectToCheckout({
        sessionId: session.data.session.id
    });
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
}
