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


//GPT Functions Import
const gptEneas = require('./modules/gptFunctions/gptEneas.js');
const chatGPT = require('./modules/gptFunctions/chatGPT.js');

//General Messages Import
const guildInfo = require('./modules/messages/guildInfo.js');



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
      '--single-process', // <- this one doesn't works in Windows
      '--disable-gpu'
    ] }
});

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
    socket.emit('qr', './check.svg')	
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

// Send message
app.post('/shaka-message', [
  body('number').notEmpty(),
  body('message').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req).formatWith(({
    msg
  }) => {
    return msg;
  });

  if (!errors.isEmpty()) {
    return res.status(422).json({
      status: false,
      message: errors.mapped()
    });
  }

  const number = req.body.number;
  const numberDDI = number.substr(0, 2);
  const numberDDD = number.substr(2, 2);
  const numberUser = number.substr(-8, 8);
  const message = req.body.message;

  if (numberDDI !== "55") {
    const numberShaka = number + "@c.us";
    client.sendMessage(numberShaka, message).then(response => {
    res.status(200).json({
      status: true,
      message: 'BotShaka Mensagem enviada',
      response: response
    });
    }).catch(err => {
    res.status(500).json({
      status: false,
      message: 'BotShaka Mensagem não enviada',
      response: err.text
    });
    });
  }
  else if (numberDDI === "55" && parseInt(numberDDD) <= 30) {
    const numberShaka = "55" + numberDDD + "9" + numberUser + "@c.us";
    client.sendMessage(numberShaka, message).then(response => {
    res.status(200).json({
      status: true,
      message: 'BotShaka Mensagem enviada',
      response: response
    });
    }).catch(err => {
    res.status(500).json({
      status: false,
      message: 'BotShaka Mensagem não enviada',
      response: err.text
    });
    });
  }
  else if (numberDDI === "55" && parseInt(numberDDD) > 30) {
    const numberShaka = "55" + numberDDD + numberUser + "@c.us";
    client.sendMessage(numberShaka, message).then(response => {
    res.status(200).json({
      status: true,
      message: 'BotShaka Mensagem enviada',
      response: response
    });
    }).catch(err => {
    res.status(500).json({
      status: false,
      message: 'BotShaka Mensagem não enviada',
      response: err.text
    });
    });
  }
});


//EXECUÇÃO DAS AÇÕES EXTERNAS

// ALERTAS AUTOMÁTICOS NO GRUPO DA GVG
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
  gptEneas(client);

  // Chama a função para interagir com o ChatGPT
  chatGPT(client);

  // Chama a função de ajuda com o uso do Bot
  help(client);

  // Chama a função de contato com o desenvolvedor
  contact(client);

  // Chama a função de PING
  ping(client);


});


server.listen(port, function() {
});