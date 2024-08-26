const db = require('../../config/db'); // Importe o db.js da pasta config

module.exports = (client) => {
    client.on('message', async msg => {
        if (msg.body.startsWith('!addplayer')) {
            const args = msg.body.split(' ').slice(1);
            if (args.length < 4) {
                client.sendMessage(msg.from, 'Erro: Comando inválido. Use !addplayer <ID> <Nick> <Nome> <Telefone>');
            } else {
                const [id, nick, nome, telefone] = args;

                try {
                    const player = await db.addPlayer(id, nick, nome, telefone);
                    if (player) {
                        client.sendMessage(msg.from, `Jogador ${player.nome} (${player.nick}) adicionado com sucesso!`);
                    } else {
                        client.sendMessage(msg.from, 'Erro ao adicionar jogador. Verifique se o telefone já está cadastrado.');
                    }
                } catch (error) {
                    console.error('Erro ao adicionar jogador:', error.message);
                    client.sendMessage(msg.from, 'Erro ao adicionar jogador. Verifique se o telefone já está cadastrado.');
                }
            }
        }
    });
};
