module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const API_KEY = process.env.OPENROUTER_API_KEY;

    if (!API_KEY) {
      console.error('API KEY NOT FOUND');
      return res.status(500).json({ error: 'Configuration error - API key missing' });
    }

    console.log('Sending request to OpenRouter...');

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://francopro.vercel.app',
        'X-Title': 'FrancoPro'
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.3-70b-instruct',
        messages: [
          {
            role: 'system',
            content: 'Tu es un expert en grammaire française. Réponds toujours en français de manière claire et pédagogique. Donne des exemples concrets.'
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.7,
        max_tokens: 800
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('OpenRouter Error:', data);
      return res.status(response.status).json({ 
        error: 'Service error',
        details: data 
      });
    }

    if (!data.choices || !data.choices[0]) {
      console.error('Invalid response format:', data);
      return res.status(500).json({ error: 'Invalid response from service' });
    }

    const aiResponse = data.choices[0].message.content;

    return res.status(200).json({ response: aiResponse });

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
};
