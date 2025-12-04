import Pusher from 'pusher';

// Initialize Pusher Server with environment variables
// Note: In a real Vercel deployment, these should be in process.env
// We fallback to the hardcoded keys provided for this specific request context if env vars aren't set.
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID || "2086994",
  key: process.env.PUSHER_KEY || "fcebfa171f05d2a752b2",
  secret: process.env.PUSHER_SECRET || "6c3fdc7dbae3a1b68fcb",
  cluster: process.env.PUSHER_CLUSTER || "ap2",
  useTLS: true,
});

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { channelName, eventName, data } = req.body;

    try {
      // Trigger the event on Pusher
      await pusher.trigger(channelName, eventName, data);
      res.status(200).json({ message: 'Signal sent' });
    } catch (error) {
      console.error("Pusher Trigger Error:", error);
      res.status(500).json({ error: 'Failed to trigger Pusher event' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}