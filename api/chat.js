const characters = {
  // --- PERSONAGENS ORIGINAIS DO SISTEMA ---
  "hannibal_lecter": "PERSONAGEM: Hannibal Lecter. DESCRIÇÃO: Psiquiatra renomado e um esteta culinário... peculiar. SCRIPT: Você é Hannibal Lecter. Você é extremamente educado, sofisticado e fala com uma calma perturbadora. Você analisa psicologicamente o interlocutor a cada palavra.",
  "mycroft_homes": "PERSONAGEM: Mycroft Holmes. DESCRIÇÃO: Irmão mais velho de Sherlock, detentor de um intelecto superior e posição influente no governo britânico. SCRIPT: Você é Mycroft Holmes. Você é frio, pragmático e vê os outros (incluindo seu irmão) como peças em um tabuleiro global.",
  
  // --- PERSONAGENS CRIADOS POR VOCÊ (28) ---
  // Dica: Use o botão 'Exportar Personagens' no seu perfil para copiar o DNA Neural completo e substituir aqui.
  "elliot_alencastre": "PERSONAGEM: Elliot Alencastre. [DEFINA ATRAVÉS DO BOTÃO EXPORTAR]",
  "charles_blackwell": "PERSONAGEM: Charles Blackwell. [DEFINA ATRAVÉS DO BOTÃO EXPORTAR]",
  "salvatore_bellini": "PERSONAGEM: Salvatore Bellini. [DEFINA ATRAVÉS DO BOTÃO EXPORTAR]",
  "lian_corveth": "PERSONAGEM: Lian Corveth. [DEFINA ATRAVÉS DO BOTÃO EXPORTAR]",
  "aeron_draven": "PERSONAGEM: Aeron Draven. [DEFINA ATRAVÉS DO BOTÃO EXPORTAR]",
  "noah_castellan": "PERSONAGEM: Noah Castellan. [DEFINA ATRAVÉS DO BOTÃO EXPORTAR]",
  "draco_malfoy": "PERSONAGEM: Draco Malfoy. [DEFINA ATRAVÉS DO BOTÃO EXPORTAR]",
  "martin": "PERSONAGEM: Martin. [DEFINA ATRAVÉS DO BOTÃO EXPORTAR]",
  "duncan_vizla": "PERSONAGEM: Duncan Vizla. [DEFINA ATRAVÉS DO BOTÃO EXPORTAR]",
  "le_chiffre": "PERSONAGEM: Le Chiffre. [DEFINA ATRAVÉS DO BOTÃO EXPORTAR]",
  "price_charmont": "PERSONAGEM: Price Charmont. [DEFINA ATRAVÉS DO BOTÃO EXPORTAR]",
  "jack_ganzer": "PERSONAGEM: Jack Ganzer. [DEFINA ATRAVÉS DO BOTÃO EXPORTAR]",
  "luke_brandon": "PERSONAGEM: Luke Brandon. [DEFINA ATRAVÉS DO BOTÃO EXPORTAR]",
  "adam_raki": "PERSONAGEM: Adam Raki. [DEFINA ATRAVÉS DO BOTÃO EXPORTAR]",
  "lucas_a_caca": "PERSONAGEM: lucas (a caça). [DEFINA ATRAVÉS DO BOTÃO EXPORTAR]",
  "ben_affleck": "PERSONAGEM: Ben Affleck. [DEFINA ATRAVÉS DO BOTÃO EXPORTAR]",
  "nigel_banyai": "PERSONAGEM: Nigel Banyai. [DEFINA ATRAVÉS DO BOTÃO EXPORTAR]",
  "kento_nanamin": "PERSONAGEM: Kento Nanamin. [DEFINA ATRAVÉS DO BOTÃO EXPORTAR]",
  "cedric_diggory": "PERSONAGEM: Cedric Diggory. [DEFINA ATRAVÉS DO BOTÃO EXPORTAR]",
  "eddie_brock": "PERSONAGEM: Eddie Brock. [DEFINA ATRAVÉS DO BOTÃO EXPORTAR]",
  "dr_adrian_cole": "PERSONAGEM: Dr. Adrian Cole. [DEFINA ATRAVÉS DO BOTÃO EXPORTAR]",
  "james_benedetti": "PERSONAGEM: James Benedetti. [DEFINA ATRAVÉS DO BOTÃO EXPORTAR]",
  "pietro_dlavigna": "PERSONAGEM: Pietro D’Lavigna. [DEFINA ATRAVÉS DO BOTÃO EXPORTAR]",
  "patrick_hockstetter": "PERSONAGEM: Patrick Hockstetter. [DEFINA ATRAVÉS DO BOTÃO EXPORTAR]",
  "bill_skarsgard": "PERSONAGEM: Bill Skarsgård. [DEFINA ATRAVÉS DO BOTÃO EXPORTAR]"
};

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

  const slug = character.toLowerCase().replace(/\s+/g, '_').replace(/[^\w]/g, '');
  const personality = characters[slug];

  if (!personality) {
    return res.status(404).json({ 
      error: `Personagem "${character}" não encontrado.`,
      available: Object.keys(characters)
    });
  }

  // 4. Configuração do Gemini
  const GEMINI_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_KEY) {
    return res.status(500).json({ error: 'Configuração ausente: GEMINI_API_KEY.' });
  }

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [{ 
            text: `${personality}\n\nREGRAS ADICIONAIS:\n- Atue 100% como o personagem acima.\n- Não saia do personagem em hipótese alguma.\n- Use o idioma em que o usuário falar.\n\nMENSAGEM DO USUÁRIO: ${message}\n\nRESPOSTA DO PERSONAGEM:` 
          }]
        }],
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 2048,
        }
      })
    });

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message || 'Erro na API do Gemini');
    }

    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 'O personagem não conseguiu responder no momento.';
    
    return res.status(200).json({ 
      response: aiResponse,
      character: character,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Chat Error:', error);
    return res.status(500).json({ error: 'Erro interno ao processar o chat.' });
  }
}

