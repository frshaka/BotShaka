const schedule = require('node-schedule');

module.exports = (client) => {
    // Agenda a tarefa para rodar diariamente às 00:01
    schedule.scheduleJob('1 0 * * *', async () => {
        console.log('Iniciando a limpeza das mensagens dos grupos...');

        try {
            // Obtém todos os chats do usuário
            const chats = await client.getChats();
            console.log(`Total de chats encontrados: ${chats.length}`);

            // Filtra apenas os grupos
            const groups = chats.filter(chat => chat.isGroup);

            // Limpar mensagens dos grupos
            for (const group of groups) {
                console.log(`Limpando mensagens do grupo: ${group.name} (${group.id._serialized})`);
                await group.clearMessages();
            }

            console.log('Limpeza das mensagens dos grupos concluída.');
        } catch (error) {
            console.error('Erro ao limpar mensagens dos grupos:', error);
        }
    });
};
