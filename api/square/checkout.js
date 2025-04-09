// File: api/square/checkout.js

import { Client, Environment } from 'square';

const client = new Client({
  accessToken: process.env.SQUARE_ACCESS_TOKEN,
  environment: 'production',
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  try {
    const { amount, credits, userId, plan } = req.body;

    const response = await client.checkoutApi.createCheckout(
      process.env.SQUARE_LOCATION_ID,
      {
        idempotencyKey: crypto.randomUUID(),
        order: {
          order: {
            locationId: process.env.SQUARE_LOCATION_ID,
            lineItems: [
              {
                name: `${credits} Credits`,
                quantity: '1',
                basePriceMoney: {
                  amount: parseInt(amount),
                  currency: 'USD',
                },
              },
            ],
          },
        },
        redirectUrl: 'https://www.trackrepost.com/payment-success',
        note: `${credits} Credits Purchase for userId=${userId}${plan ? ` Plan=${plan}` : ''}`,
      }
    );

    res.status(200).json({ url: response.result.checkout.checkoutPageUrl });
  } catch (err) {
    console.error('❌ Checkout creation failed:', err);
    res.status(500).json({ error: 'Checkout creation failed' });
  }
}



