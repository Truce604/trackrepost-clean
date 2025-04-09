// api/square/checkout.js

import { Client, Environment } from 'square';
import crypto from 'crypto';

const client = new Client({
  accessToken: process.env.SQUARE_ACCESS_TOKEN,
  environment: Environment.Production,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  try {
    const { amount, credits, userId, plan } = req.body;

    if (!amount || !credits || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const idempotencyKey = crypto.randomUUID();

    const checkoutResponse = await client.checkoutApi.createCheckout(
      process.env.SQUARE_LOCATION_ID,
      {
        idempotencyKey,
        order: {
          order: {
            locationId: process.env.SQUARE_LOCATION_ID,
            lineItems: [
              {
                name: `${credits} Credits`,
                quantity: '1',
                basePriceMoney: {
                  amount: parseInt(amount),
                  currency: 'CAD',
                },
              },
            ],
          },
        },
        redirectUrl: 'https://www.trackrepost.com/payment-success',
        note: `${credits} Credits Purchase for userId=${userId}${plan ? ` Plan=${plan}` : ''}`,
      }
    );

    const checkoutUrl = checkoutResponse.result.checkout.checkoutPageUrl;
    res.status(200).json({ url: checkoutUrl });

  } catch (error) {
    console.error('❌ Square Checkout Error:', error);
    res.status(500).json({ error: 'Checkout creation failed' });
  }
}


