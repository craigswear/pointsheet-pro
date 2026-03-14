// Vercel Serverless Function — AI Proxy using Google Gemini
// Free tier: 15 RPM, no credit card required
// Get free API key at: https://aistudio.google.com/app/apikey
 
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
 
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key not configured' });
 
  try {
    const { system, messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid request body' });
    }
 
    // Combine system prompt + user message for Gemini
    const userMessage = messages[0]?.content || '';
    const fullPrompt = system ? `${system}\n\n${userMessage}` : userMessage;
 
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: fullPrompt }] }],
          generationConfig: { maxOutputTokens: 1500, temperature: 0.7 }
        })
      }
    );
 
    const data = await response.json();
 
    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'Gemini API error' });
    }
 
    // Format response to match expected structure
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';
    return res.status(200).json({
      content: [{ type: 'text', text }]
    });
 
  } catch (err) {
    return res.status(500).json({ error: 'Server error: ' + err.message });
  }
}
