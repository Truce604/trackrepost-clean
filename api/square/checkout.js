// File: /api/square/checkout.js

import { Client, Environment } from 'square';
import { v4 as uuidv4 } from 'uuid';

// Initialize Square client with environment and access token
const client = new Client({
  accessToken: process.env.SQUARE_ACCESS_TOKEN, // Set your Square access token here
  environment: Environment.Production, // Change to Environment.Sandbox for testing
});

const cors = require('cors')({ origin: true }); // Enable CORS for your frontend

export default async function handler(req, res) {
  // Handle CORS for the API request
  cors(req, res, async () => {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
      // Extract required data from the request body
      const { credits, userId, plan } = req.body;

      // Validate the request data
      if (!credits || !userId) {
        return res.status(400).json({ error: 'Missing credits or userId' });
      }

      // Create the Square checkout
      const response = await client.checkoutApi.createCheckout(
        process.env.SQUARE_LOCATION_ID, // Set your Square location ID here
        {
          idempotencyKey: uuidv4(), // Unique key to prevent duplicates
          order: {
            order: {
              locationId: process.env.SQUARE_LOCATION_ID,
              lineItems: [
                {
                  name: `${credits} Credits`,
                  quantity: '1',
                  basePriceMoney: {
                    amount: credits * 10, // Adjust this as needed for pricing logic
                    currency: 'CAD', // Use the correct currency code for your region
                  },
                },
              ],
            },
          },
          askForShippingAddress: false, // No shipping address needed
          redirectUrl: 'https://www.trackrepost.com/payment-success', // Redirect URL after payment
          note: `${credits} Credits Purchase for userId=${userId}${plan ? ` Plan=${plan}` : ''}`, // Include plan in the note if available
        }
      );

      // Send the checkout URL back to the frontend
      const checkoutUrl = response.result.checkout.checkoutPageUrl;
      res.status(200).json({ checkoutUrl });
    } catch (err) {
      console.error('❌ Square checkout error:', err);
      res.status(500).json({ error: 'Failed to create checkout' });
    }
  });
}

