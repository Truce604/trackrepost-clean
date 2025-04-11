import { Client, Environment } from 'square';
import { v4 as uuidv4 } from 'uuid';

const client = new Client({
  accessToken: process.env.SQUARE_ACCESS_TOKEN,
  environment: Environment.Production,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { credits, userId, plan } = req.body;

    if (!credits || !userId) {
      return res.status(400).json({ error: 'Missing credits or userId' });
    }

    const response = await client.checkoutApi.createCheckout(
      process.env.SQUARE_LOCATION_ID,
      {
        idempotencyKey: uuidv4(),
        order: {
          order: {
            locationId: process.env.SQUARE_LOCATION_ID,
            lineItems: [
              {
                name: `${credits} Credits`,
                quantity: '1',
                basePriceMoney: {
                  amount: credits * 10,
                  currency: 'CAD',
                },
              },
            ],
          },
        },
        askForShippingAddress: false,
        redirectUrl: 'https://www.trackrepost.com/payment-success',
        note: `${credits} Credits Purchase for userId=${userId}${plan ? ` Plan=${plan}` : ''}`,
      }
    );

    const checkoutUrl = response.result.checkout.checkoutPageUrl;
    res.status(200).json({ checkoutUrl });
  } catch (err) {
    console.error('❌ Square checkout error:', err);
    res.status(500).json({ error: 'Failed to create checkout' });
  }
}

