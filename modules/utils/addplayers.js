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
                    // Tente adicionar o jogador ao banco de dados
                    const player = await db.addPlayer(id, nick, nome, telefone);

                    if (player && player.nome && player.nick) {
                        // Se a inclusão for bem-sucedida e o player estiver correto
                        client.sendMessage(msg.from, `Jogador ${player.nome} (${player.nick}) adicionado com sucesso!`);
                    } else {
                        // Se o retorno não for o esperado, exiba uma mensagem de erro apropriada
                        client.sendMessage(msg.from, 'Erro ao adicionar jogador. O jogador pode já estar cadastrado ou ocorreu um problema no processo.');
                    }
                } catch (error) {
                    // Logue mais informações sobre o erro
                    console.error('Erro ao adicionar jogador:', error);

                    // Envie uma mensagem de erro ao usuário
                    client.sendMessage(msg.from, 'Erro ao adicionar jogador. Verifique se o telefone já está cadastrado ou se os dados estão corretos.');
                }
            }
        }
    });
};
