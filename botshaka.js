const { Client, Message, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const express = require('express');
const { body, validationResult } = require('express-validator');
const socketIO = require('socket.io');
const qrcode = require('qrcode');
const http = require('http');
const fileUpload = require('express-fileupload');
const axios = require('axios');
const mime = require('mime-types');
const port = process.env.PORT || 8000;
const app = express();
const server = http.createServer(app);
const io = socketIO(server);
const schedule = require('node-schedule');
const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

// Function Groups Import
const changeGroupName = require('./modules/groups/changeGroupName.js');
const welcomeNewMembers = require('./modules/groups/welcomeNewMembers.js');
const sendAlertMessage = require('./modules/groups/sendAlertMessage.js');
const ghostMentions = require('./modules/groups/ghostMentions.js');
const markAll = require('./modules/groups/markAll.js');

// Utils Import
const cleanMessages = require('./modules/utils/cleanMessages.js');
const help = require('./modules/utils/help.js');
const contact = require('./modules/utils/contact.js');
const ping = require('./modules/utils/ping.js');
const addPlayer = require('./model/player/addplayers.js');
const deactivatePlayerByID = require('./model/player/deactivatePlayerByID.js');
const deactivatePlayerByPhone = require('./model/player/deactivatePlayerByPhone.js');
const activatePlayerByID = require('./model/player/activatePlayerByID.js');
const activatePlayerByPhone = require('./model/player/activatePlayerByPhone.js');
const saveImageToDrive = require('./modules/utils/saveImageToDrive');

//GPT Functions Import
const gptEneas = require('./modules/gptFunctions/gptEneas.js');
const chatGPT = require('./modules/gptFunctions/chatGPT.js');

//General Messages Import
const guildInfo = require('./modules/messages/guildInfo.js');

//Gruops Monitor Import
const GroupsMonitor = require('./modules/monitor/GroupsMonitor');

function delay(t, v) {
  return new Promise(function(resolve) { 
      setTimeout(resolve.bind(null, v), t)
  });
}

app.use(express.json());
app.use(express.urlencoded({
  extended: true
}));
app.use(fileUpload({
  debug: false
}));
app.use("/", express.static(__dirname + "/"))

app.get('/', (req, res) => {
  res.sendFile('index.html', {
    root: __dirname
  });
});

const client = new Client({
  authStrategy: new LocalAuth({ clientId: 'botShaka' }),
  puppeteer: { headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process', // <- this one doesn't work in Windows
      '--disable-gpu'
    ] }
});

client.setMaxListeners(20);

client.initialize();

io.on('connection', function(socket) {
  socket.emit('message', 'BotShaka - Iniciado');
  socket.emit('qr', './loading.svg');

  client.on('qr', (qr) => {
    console.log('QR RECEIVED', qr);
    qrcode.toDataURL(qr, (err, url) => {
      socket.emit('qr', url);
      socket.emit('message', '© BotShaka QRCode recebido, aponte a câmera  seu celular!');
    });
  });

  client.on('ready', () => {
    socket.emit('ready', 'BotShaka Dispositivo pronto!');
    socket.emit('message', 'BotShaka Dispositivo pronto!');
    socket.emit('qr', './check.svg');
    console.log('BotShaka Dispositivo pronto');
  });

  client.on('authenticated', () => {
    socket.emit('authenticated', 'BotShaka Autenticado!');
    socket.emit('message', 'BotShaka Autenticado!');
    console.log('BotShaka Autenticado');
  });

  client.on('auth_failure', function() {
    socket.emit('message', 'BotShaka Falha na autenticação, reiniciando...');
    console.error('BotShaka Falha na autenticação');
  });

  client.on('change_state', state => {
    console.log('BotShaka Status de conexão: ', state );
  });

  client.on('disconnected', (reason) => {
    socket.emit('message', 'BotShaka Cliente desconectado!');
    console.log('BotShaka Cliente desconectado', reason);
    client.initialize();
  });
});

  //função para geração do Resumo dos chats
  client.on('message', async (message) => {
    if (message.isGroupMsg) {
        console.log(`Mensagem recebida do grupo ${message.from}: ${message.body}`);
        try {
            await GroupsMonitor.salvarMensagem(message);
            console.log('Mensagem salva com sucesso.');
        } catch (err) {
            console.error('Erro ao salvar mensagem:', err);
        }
    }
});

//EXECUÇÃO DAS AÇÕES EXTERNAS

const groupId = '120363198603699526@g.us'; // ID do grupo que você quer monitorar
const alertCloseTimes = ['13:00', '14:30', '15:00', '16:30', '17:00']; // Horários de alerta para Ataque de Grupo
const groupNameChangeTime = '22:30'; // Horário para alterar o nome do grupo

client.on('ready', async () => {

  // Chama a função para limpar as mensagens
  cleanMessages(client);

  // Chama a função para alterar o nome do grupo
  changeGroupName(client, groupId, groupNameChangeTime);

  // Chama a função para enviar mensagens de alerta
  sendAlertMessage(client, groupId, alertCloseTimes);

  // Chama a função para enviar mensagens de boas-vindas
  welcomeNewMembers(client);

  // Chama a função de marcação Fantasma
  ghostMentions(client);

  // Chama a função para marcar todos os participantes
  markAll(client);

  // Chama a função para enviar informações da guilda
  guildInfo(client);

  // Chama a função para interagir com o ChatGPT com contexto Eneas
  //gptEneas(client);

  // Chama a função para interagir com o ChatGPT
  //chatGPT(client);

  // Chama a função de ajuda com o uso do Bot
  help(client);

  // Chama a função de contato com o desenvolvedor
  contact(client);

  // Chama a função de PING
  ping(client);
  
  // Chama a função para salvar imagens no Google Drive
  saveImageToDrive(client);
  
  // Chama a função para adicionar jogador
  addPlayer(client);

  // Chama a função para inativar um jogador pelo ID
  deactivatePlayerByID(client);

  // Chama a função para inativar um jogador pelo Telefone
  deactivatePlayerByPhone(client);

  // Chama a função para ativar um jogador pelo Telefone
  activatePlayerByID(client);
  
  // Chama a função para ativar um jogador pelo Telefone
  activatePlayerByPhone(client);

});

const apiUrl = 'https://api.openai.com/v1/chat/completions';
const apiKey = 'sk-proj-4kL6glBZCaMmJvZ8qGatT3BlbkFJ3voUusLaZaQ9iIe3W498';

const recommendationsFilePath = path.join(__dirname, 'recomendationsEneas.txt');
const recommendationsText = fs.readFileSync(recommendationsFilePath, 'utf8');

// Função para truncar o texto das recomendações
const truncateText = (text, maxLength) => {
  if (text.length > maxLength) {
    return text.slice(0, maxLength) + '...';
  }
  return text;
};

// Definimos um limite de 4000 caracteres para garantir que não exceda o limite de tokens
//const truncatedRecommendationsText = truncateText(recommendationsText, 4000);

const chatGPTRequest = async (message) => {
  try {
    const messages = [
      { role: 'system', content: 'Você é um assistente que responde com base nas seguintes recomendações de um jogo de celular, falando de maneira bem informal e pode usar palavrões e gírias.' },
      { role: 'system', content: `Texto de Recomendações: ${recommendationsText}` }, //${truncatedRecommendationsText}
      { role: 'user', content: `Baseando-se exclusivamente nas recomendações fornecidas, responda à seguinte pergunta: ${message}` },
    ];

    const response = await axios.post(
      apiUrl,
      {
        model: 'chatgpt-4o-latest',
        messages: messages
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

client.on('message', async (msg) => {
  if (msg.body.startsWith('!gpt')) {
    const mensagem = msg.body.replace('!gpt', '').trim();
    const reply = await chatGPTRequest(mensagem);
    client.sendMessage(msg.from, reply);
  }
});

///Cron para envio do resumo diário do Grupo
const cron = require('node-cron');

// Seu número de WhatsApp (formato internacional)
const SEU_NUMERO = '5515991236228';

cron.schedule('0 23 * * *', async () => {
  try {
      const grupos = await client.getChats();
      for (const grupo of grupos) {
          if (grupo.isGroup) {
              console.log(`Gerando resumo para o grupo: ${grupo.name}`);
              const resumo = await GroupsMonitor.gerarResumoDiario(grupo.id._serialized);
              await client.sendMessage(`${SEU_NUMERO}@c.us`, `📂 **Grupo: ${grupo.name}**\n${resumo}`);
              console.log(`Resumo enviado para o grupo: ${grupo.name}`);
          }
      }
  } catch (err) {
      console.error('Erro ao gerar ou enviar resumo diário:', err);
  }
});



server.listen(port, function() {
  console.log(`BotShaka está rodando na porta ${port}`);
});
