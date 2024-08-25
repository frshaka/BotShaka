/*const axios = require('axios');
const fs = require('fs');
const path = require('path');

const apiUrl = 'https://api.openai.com/v1/chat/completions';
const apiKey = 'gO7E1M6e0qGTpR9ichSkT3BlbkFJnd7r8fchKKpmvaLq70Ox';

const recommendationsFilePath = path.join(__dirname, '../gptFunctions/recomendations/recomendationsEneas.txt');
const recommendationsText = fs.readFileSync(recommendationsFilePath, 'utf8');

const chatGPTRequest = async (message) => {
  try {
    const messages = [
      { role: 'system', content: 'Você é um assistente que responde com base nas seguintes recomendações de um jogo de celular, falando de maneira bem informal e pode usar palavrões e gírias.' },
      { role: 'system', content: `Texto de Recomendações: ${recommendationsText}` },
      { role: 'user', content: `Baseando-se exclusivamente nas recomendações fornecidas, responda à seguinte pergunta: ${message}` },
      { role: 'user', content: `` }
    ];

    const response = await axios.post(
      apiUrl,
      {
        model: 'gpt-4',
        messages: messages,
        max_tokens: 350,
        temperature: 0.7,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
      }
    );

    const reply = response.data.choices[0].message.content;
    return reply;
  } catch (error) {
    console.error('Erro ao chamar a API do ChatGPT:', error.response ? error.response.data : error.message);
  }
};

module.exports = (client) => {
  client.on('message', async (msg) => {
    if (msg.body.startsWith('!gpt')) {
      const mensagem = msg.body.replace('!gpt', '').trim();
      const reply = await chatGPTRequest(mensagem);
      client.sendMessage(msg.from, reply);
    }
  });
};
*/