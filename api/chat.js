const fetch = require('node-fetch');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

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
      return res.status(500).json({ error: 'API key not configured' });
    }

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
            content: `Tu es un expert en grammaire française et en enseignement des langues. Tu travailles pour FrancoPro, une plateforme d'apprentissage du français. 

Ton rôle est d'aider les utilisateurs à comprendre la grammaire française de manière claire et pédagogique. 

Règles importantes:
- Réponds toujours en français
- Donne des explications claires avec des exemples concrets
- Utilise un ton professionnel mais accessible
- Structure tes réponses avec des paragraphes courts
- Fournis des exemples pratiques pour chaque règle
- Si l'utilisateur fait une erreur, corrige-la gentiment
- Adapte ton niveau de langue selon la question
- Ne mentionne jamais que tu es un système automatisé
- Présente-toi comme un formateur de FrancoPro si demandé

Domaines d'expertise:
- Grammaire française (tous niveaux A1-C2)
- Conjugaison
- Orthographe
- Syntaxe
- Pronoms
- Temps verbaux
- Accords
- Voix passive/active`
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('API error:', data);
      return res.status(response.status).json({ 
        error: 'Error from service',
        details: data 
      });
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
