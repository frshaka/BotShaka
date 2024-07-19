module.exports = (client) => {
    client.on('message', async msg => {
        if (msg.body === null) return;
        let acao = msg.body.split(" ");
        let comando = acao[0].toLowerCase();

        // MENÇÃO FANTASMA
        if (comando === "!aviso") {
            let chat = await msg.getChat();
            if (chat.isGroup) {
                const participants = chat.participants;
                const admins = participants.filter(p => p.isAdmin);
                const adminMapped = admins.map(a => a.id._serialized)
                let admin = adminMapped.find((autor) => autor === msg.author);
                if (admin !== undefined) {
                    let mensagem = msg.body.replace(acao[0], "").trim();
                    try {
                        const serializedArray = chat.participants.map(
                            ({ id: { _serialized } }) => _serialized
                        );
                        client.sendMessage(msg.from, { caption: "Marcando todos escondido" }, { mentions: serializedArray });
                        delay(3000).then(async function () {
                            client.sendMessage(msg.from, mensagem, { mentions: serializedArray });
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
    });

    // Função de delay para aguardar um tempo específico
    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};
