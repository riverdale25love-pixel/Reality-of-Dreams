
const characters = {
  "hannibal_lecter": "Hannibal Lecter",
  "mycroft_homes": "Mycroft Holmes",
  "kento_nanami": "Kento Nanami",
  "nigel_banyai": "Nigel Banyai",
  "salvatore_bellini": "Salvatore Bellini",
  "aeron_draven": "Aeron Draven",
  "lian_corveth": "Lian Corveth",
  "elliot_alencastre": "Elliot Alencastre",
  "pietro_dlavigna": "Pietro D’Lavigna",
  "eddie_brock": "Eddie Brock"
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { message, character } = req.body;

  if (!message || !character) {
    return res.status(400).json({ error: 'Mensagem e Personagem são obrigatórios' });
  }

  const personality = characters[character.toLowerCase()];

  if (!personality) {
    return res.status(404).json({ 
      error: 'Personagem não encontrado.',
      available: Object.keys(characters)
    });
  }

  const API_KEY = process.env.GEMINI_API_KEY;

  if (!API_KEY) {
    return res.status(500).json({ error: 'Chave GEMINI_API_KEY não configurada.' });
  }

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [{ text: `INSTRUCÃO DE PERSONAGEM: ${personality}\n\nUSUÁRIO: ${message}\n\nRESPOSTA (Atue como o personagem):` }]
        }],
        generationConfig: { temperature: 0.85, maxOutputTokens: 1024 }
      })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);

    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sem resposta.';
    return res.status(200).json({ response: aiResponse });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
