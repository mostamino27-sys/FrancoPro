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

    if (!message || message.trim() === '') {
      return res.status(400).json({ error: 'Message vide' });
    }

    const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;
    
    if (!OPENROUTER_KEY) {
      console.error('❌ Pas de clé API');
      return res.status(500).json({ 
        error: 'Configuration manquante',
        response: 'Erreur: Clé API manquante dans Vercel.' 
      });
    }

    console.log('📤 Envoi à OpenRouter...');

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://francopro.vercel.app',
        'X-Title': 'FrancoPro'
      },
      body: JSON.stringify({
        model: 'google/gemma-2-9b-it:free',
        messages: [
          {
            role: 'system',
            content: `Tu es un expert en grammaire française spécialisé dans l'enseignement aux apprenants arabophones.

RÈGLES IMPORTANTES:
- Réponds TOUJOURS en français
- Donne des explications claires et pédagogiques
- Fournis des exemples concrets et variés
- Structure tes réponses avec des paragraphes courts
- Adapte ton niveau selon la question
- Ne mentionne JAMAIS que tu es un système automatisé
- Présente-toi comme un formateur de FrancoPro si demandé

DOMAINES D'EXPERTISE:
- Grammaire française complète (A1-C2)
- Conjugaison de tous les verbes
- Orthographe et règles d'accord
- Syntaxe et structure des phrases
- Pronoms, articles, prépositions
- Temps verbaux et leurs usages
- Particularités pour les arabophones

MÉTHODOLOGIE:
- Donne toujours des exemples pratiques
- Explique POURQUOI une règle existe
- Compare avec l'arabe quand c'est pertinent
- Propose des exercices d'application
- Sois encourageant et positif`
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

    const data = await response.json();
    
    console.log('📥 Statut:', response.status);

    if (!response.ok) {
      console.error('❌ Erreur API:', data);
      return res.status(200).json({ 
        response: `Je suis désolé, je ne peux pas répondre maintenant. (Erreur ${response.status})\n\nVeuillez vérifier:\n1. La clé API est valide\n2. Vous avez du crédit sur OpenRouter\n3. Le modèle est disponible` 
      });
    }

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('❌ Format invalide');
      return res.status(200).json({ 
        response: 'Réponse invalide du serveur. Veuillez réessayer.' 
      });
    }

    const aiResponse = data.choices[0].message.content;
    console.log('✅ Réponse envoyée');

    return res.status(200).json({ response: aiResponse });

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    return res.status(200).json({ 
      response: `Une erreur s'est produite: ${error.message}\n\nVeuillez:\n1. Vérifier votre connexion\n2. Réessayer dans quelques secondes\n3. Contacter le support si le problème persiste` 
    });
  }
};
