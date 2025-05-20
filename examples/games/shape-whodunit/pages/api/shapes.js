import OpenAI from 'openai';

const shapesClient = new OpenAI({
  apiKey: process.env.SHAPES_API_KEY,
  baseURL: 'https://api.shapes.inc/v1/',
});

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { model, messages, headers } = req.body;
    try {
      const response = await shapesClient.chat.completions.create({
        model,
        messages,
        headers,
      });
      res.status(200).json(response);
    } catch (error) {
      console.error('Shapes API Error:', error);
      res.status(500).json({ error: 'Failed to communicate with Shapes API' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
