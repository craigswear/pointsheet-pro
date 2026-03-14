export default async function handler(req, res) {
  const allowedOrigins = [
    'https://sams-edu.com',
    'https://www.sams-edu.com',
    'https://pointsheet-pro.vercel.app',
    'http://localhost:3000'
  ];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key not configured' });

  try {
    const { system, messages, max_tokens } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid request body' });
    }
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: max_tokens || 1500,
        system,
        messages
      })
    });
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data.error?.message || 'API error' });
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Server error: ' + err.message });
  }
}
