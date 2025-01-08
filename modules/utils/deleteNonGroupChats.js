const schedule = require('node-schedule');

module.exports = (client) => {
    // Agenda a tarefa para rodar todo primeiro dia do mês às 00:01
    schedule.scheduleJob('1 0 1 * *', async () => {
        console.log('Iniciando a exclusão de conversas não pertencentes a grupos...');

        try {
            // Obtém todos os chats do usuário
            const chats = await client.getChats();
            console.log(`Total de chats encontrados: ${chats.length}`);

            // Filtra apenas as conversas que não são grupos
            const nonGroupChats = chats.filter(chat => !chat.isGroup);

            // Excluir conversas não pertencentes a grupos
            for (const chat of nonGroupChats) {
                console.log(`Excluindo conversa: ${chat.name || chat.id._serialized}`);
                await chat.delete();
            }

            console.log('Exclusão de conversas não pertencentes a grupos concluída.');
        } catch (error) {
            console.error('Erro ao excluir conversas:', error);
        }
    });
};
