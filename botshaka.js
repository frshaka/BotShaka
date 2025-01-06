const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const socketIO = require('socket.io');
const qrcode = require('qrcode');
const http = require('http');
const fileUpload = require('express-fileupload');
const path = require('path');
const fs = require('fs');
const cron = require('node-cron');
const axios = require('axios');

// Funções de Grupos
const changeGroupName = require('./modules/groups/changeGroupName.js');
const welcomeNewMembers = require('./modules/groups/welcomeNewMembers.js');
const sendAlertMessage = require('./modules/groups/sendAlertMessage.js');
const ghostMentions = require('./modules/groups/ghostMentions.js');
const markAll = require('./modules/groups/markAll.js');

// Utilitários
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

// Funções GPT
const gptEneas = require('./modules/gptFunctions/gptEneas.js');
const chatGPT = require('./modules/gptFunctions/chatGPT.js');

// Mensagens Gerais
const guildInfo = require('./modules/messages/guildInfo.js');

// Monitor de Grupos
const GroupsMonitor = require('./modules/monitor/GroupsMonitor');

// Configurações
const port = process.env.PORT || 8000;
const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload({ debug: false }));
app.use("/", express.static(__dirname + "/"));

app.get('/', (req, res) => {
    res.sendFile('index.html', { root: __dirname });
});

// Cliente WhatsApp
const client = new Client({
    authStrategy: new LocalAuth({ clientId: 'botShaka' }),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu',
        ],
    },
});

client.setMaxListeners(20);
client.initialize();

// Eventos do cliente WhatsApp
io.on('connection', function (socket) {
    socket.emit('message', 'BotShaka - Iniciado');
    socket.emit('qr', './loading.svg');

    client.on('qr', (qr) => {
        console.log('QR RECEIVED', qr);
        qrcode.toDataURL(qr, (err, url) => {
            socket.emit('qr', url);
            socket.emit('message', '© BotShaka QRCode recebido, aponte a câmera do seu celular!');
        });
    });

    client.on('ready', () => {
        socket.emit('ready', 'BotShaka Dispositivo pronto!');
        console.log('BotShaka Dispositivo pronto');
    });

    client.on('authenticated', () => {
        socket.emit('authenticated', 'BotShaka Autenticado!');
        console.log('BotShaka Autenticado');
    });

    client.on('auth_failure', function () {
        socket.emit('message', 'BotShaka Falha na autenticação, reiniciando...');
        console.error('BotShaka Falha na autenticação');
    });

    client.on('disconnected', (reason) => {
        socket.emit('message', 'BotShaka Cliente desconectado!');
        console.log('BotShaka Cliente desconectado', reason);
        client.initialize();
    });
});

// Captura de mensagens
client.on('message', async (message) => {
        // Verifica se a mensagem é de um grupo
        if (message.from.endsWith('@g.us')) {
            try {
                await GroupsMonitor.salvarMensagem(message);
                console.log('Mensagem salva no banco de dados com sucesso.');
            } catch (err) {
                console.error('Erro ao salvar mensagem no banco de dados:', err);
            }
        }
        // Comando !gpt
        if (message.body.startsWith('!gpt')) {
            const mensagem = message.body.replace('!gpt', '').trim();
            const reply = await chatGPTRequest(mensagem);
            client.sendMessage(message.from, reply);
        }
});

// Função para ChatGPT
const chatGPTRequest = async (message) => {
    try {
        const apiKey = 'sk-proj-4kL6glBZCaMmJvZ8qGatT3BlbkFJ3voUusLaZaQ9iIe3W498';
        const apiUrl = 'https://api.openai.com/v1/chat/completions';
        const messages = [
            { role: 'system', content: 'Você é um assistente que responde com base nas recomendações do usuário.' },
            { role: 'user', content: message },
        ];

        const response = await axios.post(
            apiUrl,
            { model: 'gpt-4', messages },
            { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` } }
        );

        return response.data.choices[0].message.content;
    } catch (error) {
        console.error('Erro ao chamar a API do ChatGPT:', error.message);
        return 'Houve um erro ao processar sua solicitação.';
    }
};

// Funções executadas ao iniciar
client.on('ready', async () => {
    console.log('Executando funcionalidades adicionais...');

    // Executar funções gerais
    cleanMessages(client);
    changeGroupName(client, '120363198603699526@g.us', '22:30');
    sendAlertMessage(client, '120363198603699526@g.us', ['13:00', '14:30', '15:00', '16:30', '17:00']);
    welcomeNewMembers(client);
    ghostMentions(client);
    markAll(client);
    guildInfo(client);
    help(client);
    contact(client);
    ping(client);
    saveImageToDrive(client);
    addPlayer(client);
    deactivatePlayerByID(client);
    deactivatePlayerByPhone(client);
    activatePlayerByID(client);
    activatePlayerByPhone(client);
});

// Cron para envio de resumos diários
cron.schedule('0 23 * * *', async () => {
    try {
        const SEU_NUMERO = '5515991236228';
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

// Inicializa o servidor
server.listen(port, () => {
    console.log(`BotShaka está rodando na porta ${port}`);
});
