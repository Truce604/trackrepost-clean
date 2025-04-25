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
    const { amount, credits, userId, plan } = req.body;

    if (!amount || !credits || !userId) {
      return res.status(400).json({ error: 'Missing required fields (amount, credits, userId).' });
    }

    const locationId = process.env.SQUARE_LOCATION_ID;
    if (!locationId) {
      return res.status(500).json({ error: 'Square Location ID missing from environment.' });
    }

    const response = await client.checkoutApi.createCheckout(locationId, {
      idempotencyKey: uuidv4(),
      order: {
        order: {
          locationId,
          lineItems: [
            {
              name: `${credits} Credits`,
              quantity: '1',
              basePriceMoney: {
                amount: parseInt(amount), // Amount passed in request (already in cents)
                currency: 'CAD', // Change to 'USD' if needed later
              },
            },
          ],
        },
      },
      askForShippingAddress: false,
      redirectUrl: 'https://www.trackrepost.com/payment-success.html', // ✅ Fixed the .html
      note: `${credits} Credits Purchase for userId=${userId}${plan ? ` Plan=${plan}` : ''}`,
    });

    const checkoutUrl = response.result.checkout.checkoutPageUrl;
    res.status(200).json({ checkoutUrl });

  } catch (err) {
    console.error('❌ Square checkout error:', err);
    res.status(500).json({ error: 'Failed to create checkout.' });
  }
}


