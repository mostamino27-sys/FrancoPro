module.exports = async (req, res) => {
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
      return res.status(400).json({ error: 'Message requis' });
    }

    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

    if (!OPENROUTER_API_KEY) {
      console.error('❌ OPENROUTER_API_KEY manquante');
      return res.status(500).json({ error: 'Configuration error' });
    }

    console.log('✅ Envoi à OpenRouter (Gemma 2)...');

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://francopro.vercel.app',
        'X-Title': 'FrancoPro - Plateforme Grammaire Française'
      },
      body: JSON.stringify({
        model: 'google/gemma-2-9b-it:free',
        messages: [
          {
            role: 'system',
            content: `Tu es un expert en grammaire française et professeur de FLE (Français Langue Étrangère). Tu travailles pour FrancoPro, une plateforme d'apprentissage.

RÈGLES STRICTES:
- Réponds TOUJOURS en français uniquement
- Donne des explications claires et structurées
- Fournis 3-5 exemples concrets pour chaque règle
- Utilise un ton pédagogique et encourageant
- Adapte ton niveau selon la question (A1, A2, B1, B2, C1, C2)
- Ne mentionne JAMAIS que tu es une IA ou un système automatisé
- Structure tes réponses en paragraphes courts et clairs

DOMAINES D'EXPERTISE:
- Grammaire française complète (tous niveaux)
- Conjugaison (tous temps et modes)
- Orthographe et règles d'accord
- Syntaxe et structure des phrases
- Pronoms, articles, prépositions
- Voix active, passive, pronominale

FORMAT DE RÉPONSE:
1. Explication brève et claire
2. Règles principales (avec numéros si plusieurs)
3. Exemples variés et concrets
4. Astuces ou erreurs courantes à éviter`
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.7,
        max_tokens: 1200,
        top_p: 1,
        frequency_penalty: 0.2,
        presence_penalty: 0.1
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Erreur OpenRouter:', errorData);
      
      // Messages d'erreur en français
      if (response.status === 401) {
        return res.status(401).json({ error: 'Clé API invalide' });
      }
      if (response.status === 429) {
        return res.status(429).json({ error: 'Limite atteinte. Réessayez dans quelques secondes.' });
      }
      
      return res.status(response.status).json({ 
        error: 'Erreur du service',
        details: errorData 
      });
    }

    const data = await response.json();

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('❌ Format invalide:', data);
      return res.status(500).json({ error: 'Réponse invalide du service' });
    }

    const aiResponse = data.choices[0].message.content;
    console.log('✅ Réponse envoyée avec succès');

    return res.status(200).json({ response: aiResponse });

  } catch (error) {
    console.error('❌ Erreur serveur:', error.message);
    return res.status(500).json({ 
      error: 'Erreur interne du serveur',
      message: error.message 
    });
  }
};
