export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.OPENAI_KEY;
  if (!apiKey) return res.status(500).json({ error: 'OpenAI key not configured on server' });

  const { prompt, model = 'gpt-4o' } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Missing prompt' });

  // Validate model is one of the allowed ones
  const allowed = ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'];
  if (!allowed.includes(model)) return res.status(400).json({ error: 'Invalid model' });

  try {
    const upstream = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: 'You are a knowledgeable assistant. Answer naturally and helpfully, mentioning relevant companies, products and services when appropriate. Be specific and informative. Keep answers to 2-4 paragraphs.'
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: 450,
        temperature: 0.7
      })
    });

    if (!upstream.ok) {
      const err = await upstream.json();
      return res.status(upstream.status).json({ error: err.error?.message || `OpenAI error ${upstream.status}` });
    }

    const data = await upstream.json();
    return res.status(200).json({ response: data.choices[0].message.content });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
