const axios = require('axios');

const apiUrl = 'https://api.openai.com/v1/chat/completions';
const apiKey = 'gO7E1M6e0qGTpR9ichSkT3BlbkFJnd7r8fchKKpmvaLq70Ox';

// Objeto para armazenar o histórico de mensagens de cada usuário
const userMessages = {};

const GPTRequest = async (userId, message) => {
  try {
    // Se não houver histórico de mensagens para o usuário, inicialize com uma mensagem de sistema
    if (!userMessages[userId]) {
      userMessages[userId] = [{ role: 'system', content: 'Você é um assistente útil.' }];
    }

    // Adicione a nova mensagem do usuário ao histórico
    userMessages[userId].push({ role: 'user', content: message });

    const response = await axios.post(
      apiUrl,
      {
        model: 'gpt-4',
        messages: userMessages[userId],
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

    // Adicione a resposta do assistente ao histórico
    userMessages[userId].push({ role: 'assistant', content: reply });

    return reply;
  } catch (error) {
    console.error('Erro ao chamar a API do ChatGPT:', error.response ? error.response.data : error.message);
  }
};

module.exports = (client) => {
  client.on('message', async (msg) => {
    if (msg.body.startsWith('!chat')) {
      const mensagem = msg.body.replace('!chat', '').trim();

      // Obtém a resposta do ChatGPT e envia de volta para o usuário
      const reply = await GPTRequest(msg.from, mensagem);
      client.sendMessage(msg.from, reply);
    }
  });
};
