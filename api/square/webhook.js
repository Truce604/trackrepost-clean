import { buffer } from 'micro';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  try {
    const rawBody = await buffer(req);
    const event = JSON.parse(rawBody.toString());

    console.log('🔔 Webhook event received:', event.type);

    if (event.type !== 'payment.created' && event.type !== 'payment.updated') {
      console.log('⚠️ Ignoring non-payment event:', event.type);
      return res.status(200).send('Ignored');
    }

    const payment = event.data?.object?.payment;

    if (!payment) {
      console.error('❌ No payment object found.');
      return res.status(400).send('Missing payment object');
    }

    const note = payment.note;

    if (!note) {
      console.error('❌ Missing payment note.');
      return res.status(400).send('Missing note');
    }

    console.log('📝 Payment note:', note);

    const match = note.match(/(\d+)\sCredits\sPurchase\sfor\suserId=(\w+)/);
    if (!match) {
      console.error('❌ Invalid payment note format.');
      return res.status(400).send('Invalid note format');
    }

    const credits = parseInt(match[1], 10);
    const userId = match[2];

    console.log(`✅ Adding ${credits} credits to user ${userId}`);

    await admin.firestore().collection('users').doc(userId).update({
      credits: admin.firestore.FieldValue.increment(credits)
    });

    return res.status(200).send('Success');
  } catch (err) {
    console.error('❌ Webhook handler error:', err);
    return res.status(500).send('Internal Server Error');
  }
}

