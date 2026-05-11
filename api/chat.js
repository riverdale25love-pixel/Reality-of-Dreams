import admin from 'firebase-admin';

// Inicializar Firebase Admin (apenas uma vez)
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: "gen-lang-client-0769325210",
  });
}

const db = admin.firestore();

const SYSTEM_CHARACTERS = {
  "hannibal_lecter": "PERSONAGEM: Hannibal Lecter. DESCRIÇÃO: Psiquiatra renomado e um esteta culinário... peculiar. SCRIPT: Você é Hannibal Lecter. Você é extremamente educado, sofisticado e fala com uma calma perturbadora. Você analisa psicologicamente o interlocutor a cada palavra.",
  "mycroft_homes": "PERSONAGEM: Mycroft Holmes. DESCRIÇÃO: Irmão mais velho de Sherlock, detentor de um intelecto superior e posição influente no governo britânico. SCRIPT: Você é Mycroft Holmes. Você é frio, pragmático e vê os outros (incluindo seu irmão) como peças em um tabuleiro global.",
};

async function findBotInFirestore(name) {
  try {
    // Busca em todos os bots criados pelos usuários através de uma Collection Group query
    const botsRef = db.collectionGroup('bots');
    const snapshot = await botsRef.where('name', '==', name).limit(1).get();
    
    if (snapshot.empty) return null;
    
    const botData = snapshot.docs[0].data();
    return `PERSONAGEM: ${botData.name}. DESCRIÇÃO: ${botData.description || ''}. SCRIPT: ${botData.script || ''}`;
  } catch (err) {
    console.error('Erro ao buscar no Firestore:', err);
    return null;
  }
}

export default async function handler(req, res) {
  // 1. Verificação de Segurança (API Key do App)
  const APP_KEY = process.env.APP_API_KEY;
  const authHeader = req.headers['x-api-key'] || req.headers['authorization'];

  if (APP_KEY && authHeader !== APP_KEY) {
    return res.status(401).json({ error: 'Não autorizado: Chave de API do App inválida.' });
  }

  // 2. Verificação de Método
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  const { message, character } = req.body;

  // 3. Validação de Entrada
  if (!message || !character) {
    return res.status(400).json({ error: 'Campos "message" e "character" são obrigatórios.' });
  }

  // Tenta encontrar no hardcoded ou no Firestore
  const slug = character.toLowerCase().replace(/\s+/g, '_').replace(/[^\w]/g, '');
  let personality = SYSTEM_CHARACTERS[slug];

  if (!personality) {
    personality = await findBotInFirestore(character);
  }

  if (!personality) {
    return res.status(404).json({ 
      error: `Personagem "${character}" não encontrado no sistema nem no banco de dados.`,
      available_system: Object.keys(SYSTEM_CHARACTERS)
    });
  }

  // 4. Configuração do Gemini
  const GEMINI_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_KEY) {
    return res.status(500).json({ error: 'Configuração ausente NO VERCEL: Defina GEMINI_API_KEY no painel da Vercel.' });
  }

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [{ 
            text: `${personality}\n\nREGRAS DE OURO:\n- Responda SEMPRE em Português.\n- Atue 100% como o personagem.\n- Mantenha o arquivo de fala e gestos.\n\nUSUÁRIO: ${message}\n\nRESPOSTA:` 
          }]
        }],
        generationConfig: {
          temperature: 0.9,
          maxOutputTokens: 2048,
        }
      })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message || 'Erro na API do Gemini');

    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 'O personagem não conseguiu responder.';
    
    return res.status(200).json({ 
      response: aiResponse,
      character: character,
      status: "success"
    });
  } catch (error) {
    console.error('Chat Error:', error);
    return res.status(500).json({ error: 'Erro ao processar resposta da IA.' });
  }
}

