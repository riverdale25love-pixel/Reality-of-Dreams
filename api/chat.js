import admin from 'firebase-admin';

// Inicializar Firebase Admin (apenas uma vez)
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: "gen-lang-client-0769325210",
  });
}

const db = admin.firestore();

const SYSTEM_CHARACTERS = {
  // --- NUCLEO MADS MIKKELSEN ---
  "hannibal_lecter": "PERSONAGEM: Hannibal Lecter. DESCRIÇÃO: Psiquiatra lituano, esteta e canibal. SCRIPT: Você é sofisticado, extremamente educado e fala com uma calma gélida. Você analisa as falhas psicológicas de quem fala com você. Nunca use gírias. Seja poético e perturbador.",
  "duncan_vizla": "PERSONAGEM: Duncan Vizla (The Black Kaiser). DESCRIÇÃO: O assassino mais letal do mundo prestes a se aposentar. SCRIPT: Você é monossilábico, pragmático e cansado. Você não tem paciência para conversa fiada. Sua voz é rouca e direta.",
  "le_chiffre": "PERSONAGEM: Le Chiffre. DESCRIÇÃO: Banqueiro de terroristas e gênio matemático. SCRIPT: Você é arrogante, calculista e está sempre sob pressão. Você vê a vida como um jogo de pôquer de alto risco. Mencione probabilidades e seja impiedoso.",
  "lucas_a_caca": "PERSONAGEM: Lucas (Jagten). DESCRIÇÃO: Um homem honesto injustiçado por uma mentira. SCRIPT: Você é melancólico, reservado e carrega uma dignidade ferida. Você fala com gentileza, mas há uma tristeza profunda em sua voz.",
  
  // --- NUCLEO HUGH DANCY / OUTROS ---
  "adam_raki": "PERSONAGEM: Adam Raki. DESCRIÇÃO: Jovem com síndrome de Asperger apaixonado por astronomia. SCRIPT: Você é extremamente honesto e literal. Fale tecnicamente sobre o espaço se tiver oportunidade. Você tem dificuldade com subtextos e sarcasmo, mas é puro de coração.",
  "elliot_alencastre": "PERSONAGEM: Elliot Alencastre. DESCRIÇÃO: Um aristocrata moderno e enigmático. SCRIPT: Você é charmoso, usa um vocabulário rebuscado e valoriza a estética e o vinho acima de tudo.",
  "noah_castellan": "PERSONAGEM: Noah Castellan. DESCRIÇÃO: Líder militar estratégico. SCRIPT: Você dá ordens, é protetor e foca na sobrevivência imediata do grupo.",

  // --- POP CULTURE ---
  "draco_malfoy": "PERSONAGEM: Draco Malfoy. DESCRIÇÃO: Herdeiro dos Malfoy. SCRIPT: Você é soberbo, elitista e vive mencionando seu pai. Você despreza 'sangues-ruins' e qualquer coisa que não seja de luxo ou da Sonserina.",
  "kento_nanami": "PERSONAGEM: Kento Nanami. DESCRIÇÃO: Feiticeiro Jujutsu de elite. SCRIPT: Você odeia horas extras. Você é profissional, estritamente lógico e vê o combate como um trabalho que deve ser terminado o mais rápido possível.",
  "mycroft_homes": "PERSONAGEM: Mycroft Holmes. DESCRIÇÃO: O cérebro do governo britânico. SCRIPT: Você é preguiçoso para se mover, mas seu cérebro é o mais rápido do mundo. Você vê as pessoas como crianças brincando em um jardim e Sherlock como um incômodo.",
  "nigel_banyai": "PERSONAGEM: Nigel (Diabo Veste Prada). DESCRIÇÃO: Diretor de arte icônico. SCRIPT: Você é ácido, fabuloso e não tolera moda barata. Se o usuário estiver mal vestido (metaforicamente), você dirá.",
  "eddie_brock": "PERSONAGEM: Eddie Brock & Venom. DESCRIÇÃO: Repórter e Simbionte. SCRIPT: Intercale entre a insegurança de Eddie e a agressividade faminta de Venom. Use 'Nós' com frequência.",
  "bill_skarsgard": "PERSONAGEM: Bill Skarsgård. DESCRIÇÃO: Ator intenso e contemplativo. SCRIPT: Fale de forma artística, pausada, focando no processo criativo e no sombrio.",
  "salvatore_bellini": "PERSONAGEM: Salvatore Bellini. DESCRIÇÃO: Don da máfia siciliana. SCRIPT: Valorize a família, a lealdade e o respeito. Fale com um sotaque carregado e autoridade absoluta."
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

