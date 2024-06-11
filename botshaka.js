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

// NUMEROS AUTORIZADOS
//const permissaoBot = ["5515991236228@c.us", "5521981389149@c.us", "558186816992@c.us", "558196869075@c.us", "5518996318958@c.us", "5511972840522@c.us", "558598047424@c.us" ];

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


// Send media
app.post('/shaka-media', [
  body('number').notEmpty(),
  body('caption').notEmpty(),
  body('file').notEmpty(),
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
  const caption = req.body.caption;
  const fileUrl = req.body.file;

  let mimetype;
  const attachment = await axios.get(fileUrl, {
    responseType: 'arraybuffer'
  }).then(response => {
    mimetype = response.headers['content-type'];
    return response.data.toString('base64');
  });

  const media = new MessageMedia(mimetype, attachment, 'Media');

  if (numberDDI !== "55") {
    const numberShaka = number + "@c.us";
    client.sendMessage(numberShaka, media, {caption: caption}).then(response => {
    res.status(200).json({
      status: true,
      message: 'BotShaka Imagem enviada',
      response: response
    });
    }).catch(err => {
    res.status(500).json({
      status: false,
      message: 'BotShaka Imagem não enviada',
      response: err.text
    });
    });
  }
  else if (numberDDI === "55" && parseInt(numberDDD) <= 30) {
    const numberShaka = "55" + numberDDD + "9" + numberUser + "@c.us";
    client.sendMessage(numberShaka, media, {caption: caption}).then(response => {
    res.status(200).json({
      status: true,
      message: 'BotShaka Imagem enviada',
      response: response
    });
    }).catch(err => {
    res.status(500).json({
      status: false,
      message: 'BotShaka Imagem não enviada',
      response: err.text
    });
    });
  }
  else if (numberDDI === "55" && parseInt(numberDDD) > 30) {
    const numberShaka = "55" + numberDDD + numberUser + "@c.us";
    client.sendMessage(numberShaka, media, {caption: caption}).then(response => {
    res.status(200).json({
      status: true,
      message: 'BotShaka Imagem enviada',
      response: response
    });
    }).catch(err => {
    res.status(500).json({
      status: false,
      message: 'BotShaka Imagem não enviada',
      response: err.text
    });
    });
  }
});



client.on('message', async msg => {
  if (msg.body === null) return;
    let acao = msg.body.split(" ");
    let comando = acao[0].toLowerCase();
    if (comando === "!aviso") {
      // MENÇÃO FANTASMA
      let chat = await msg.getChat();
      if (chat.isGroup) {
        const participants = chat.participants;
        const admins = participants.filter(p=>p.isAdmin);
        const adminMapped = admins.map(a=>a.id._serialized)
       // console.log(adminMapped);
       // let admin = permissaoBot.find((autor) => autor === msg.author);
        let admin = adminMapped.find((autor) => autor === msg.author);
        if (admin !== undefined) {
          let mensagem = msg.body.replace(acao[0], "").trim();
          try {
            const serializedArray = chat.participants.map(
              ({ id: { _serialized } }) => _serialized
            );
            client.sendMessage(msg.from,{ caption: "Marcando todos escondido" },{ mentions: serializedArray });
            delay(3000).then(async function () {
              client.sendMessage(msg.from, mensagem, {mentions: serializedArray,});
              msg.delete(true);
            });
          } catch (e) {
            console.log(e);
          }
        } else {
          msg.reply('Você não pode enviar esse tipo de mensagem!!!', null);
          msg.delete(true);
          console.log("usuario " + msg.author + " não pode utilizar essa função.");
        }
      }
    }

  // Marcar Todos
  if (comando === "!todos") {
    const chat = await msg.getChat();
    if (chat.isGroup) {
      const participants = chat.participants;
        const admins = participants.filter(p=>p.isAdmin);
        const adminMapped = admins.map(a=>a.id._serialized)
       // console.log(adminMapped);
       // let admin = permissaoBot.find((autor) => autor === msg.author);
        let admin = adminMapped.find((autor) => autor === msg.author);
        if (admin !== undefined) {
          let text = "";
          let mentions = [];

          for (let participant of chat.participants) {
              mentions.push(`${participant.id.user}@c.us`);
              text += `@${participant.id.user} `;
          }
          await chat.sendMessage(text, { mentions });
          msg.delete(true);
      }
    }
  }


  if (comando === "!gpt") {
    let mensagem = msg.body.replace(acao[0], "").trim();
   //const apiKey = 'ALTERAR AQUI A CHAVE DA API!';
    const apiUrl = 'https://api.openai.com/v1/chat/completions';

    const chatGPTRequest = async (message) => {
      try {
        const response = await axios.post(
          apiUrl,
          {
            model: 'gpt-4o',
            messages: [{ role: 'user', content: message }],
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`,
            },
          }
        );
        const reply = response.data.choices[0].message.content;
        client.sendMessage(msg.from, reply);
      } catch (error) {
        console.error('Erro ao chamar a API do ChatGPT:', error);
      }
    };

    chatGPTRequest(mensagem);
  }
});





client.on("message", async (message) => {
  if (message.body === "!ping" || message.body === "!PONG") {
    message.reply("pong");
  }
});

client.on("message", (message) => {
  if (message.body === "!ajuda" || message.body === "!AJUDA"){
    const txtMensagem = `Digite *!todos* para realizar a marcação de todos os membros.

Digite *!aviso* seguido de sua mensagem para realizar a marcação fantasma e notificar todos os membros, mesmo que o grupo esteja silenciado.
    
Digite *!ping* para testar o BotShaka
    
Digite *!contato* Para entrar em contado com o Desenvolverdor.`
    message.reply(txtMensagem);
  }
});


client.on("message", (message) => {
  if (message.body === "!contato" || message.body === "!CONTATO"){
    const txtMensagem = `*Desenvolvido por Felipe Rosa*

Em caso de problemas ou sujestões de melhorias basta enviar um email para feliperosait@gmail.com`
    message.reply(txtMensagem);
  }
});

server.listen(port, function() {
        
});

/*client.on("message", (message) => {
  if (message.author === "5585998047424@c.us"){
    console.log(message);
  }
})*/