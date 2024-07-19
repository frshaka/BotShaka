const schedule = require('node-schedule');

module.exports = (client) => {
    // Agenda a tarefa para rodar diariamente às 21:00
    schedule.scheduleJob('0 22 * * *', async () => {
        console.log('Iniciando a limpeza das mensagens dos grupos...');

        // Obtém todos os chats do usuário
        const chats = await client.getChats();

        // Filtra apenas os grupos
        const groups = chats.filter(chat => chat.isGroup);

        // Exibe os IDs e nomes dos grupos
        for (const group of groups) {
            console.log(`ID do grupo: ${group.id._serialized}, Nome do grupo: ${group.name}`);
            await group.clearMessages();
        }

        console.log('Limpeza das mensagens dos grupos concluída.');
    });
};
