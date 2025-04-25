import { buffer } from 'micro';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

export const config = {
  api: {
    bodyParser: false, // we need the raw body
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  try {
    const rawBody = await buffer(req);
    const signature = req.headers['x-square-signature'];

    // (Optional) You can verify the signature if you want
    console.log('🔔 Webhook received from Square');

    const event = JSON.parse(rawBody.toString());

    if (event.type !== 'order.created' && event.type !== 'payment.created') {
      console.log('⚠️ Ignoring irrelevant Square webhook event:', event.type);
      return res.status(200).send('Ignored non-payment event');
    }

    const note = event.data?.object?.payment?.note || event.data?.object?.order?.note;

    if (!note) {
      console.error('❌ Missing payment note in webhook.');
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
    console.error('❌ Webhook error:', err);
    return res.status(500).send('Internal Server Error');
  }
}

