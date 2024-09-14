const db = require('../../config/db'); // Importe o db.js da pasta config

module.exports = (client) => {
    client.on('message', async msg => {
        if (msg.body.startsWith('!inativatel')) {
            const args = msg.body.split(' ').slice(1);
            if (args.length < 1) {
                client.sendMessage(msg.from, 'Erro: Comando inválido. Use !inativaplayer <ID>');
            } else {
                const [telefone] = args;

                try {
                    // Tente inativar o jogador no banco de dados
                    const player = await db.deactivatePlayerByPhone(telefone);

                    if (player && player.nome && player.nick) {
                        // Se a inativação for bem-sucedida e o player estiver correto
                        client.sendMessage(msg.from, `Jogador ${player.nome} (${player.nick}) foi inativado com sucesso!`);
                    } else {
                        // Se o retorno não for o esperado, exiba uma mensagem de erro apropriada
                        client.sendMessage(msg.from, 'Erro ao inativar jogador. Verifique se o Telefone está correto.');
                    }
                } catch (error) {
                    // Logue mais informações sobre o erro
                    console.error('Erro ao inativar jogador:', error);

                    // Envie uma mensagem de erro ao usuário
                    client.sendMessage(msg.from, 'Erro ao inativar jogador. Verifique se o Telefone está correto ou se ocorreu algum problema no processo.');
                }
            }
        }
    });
};
