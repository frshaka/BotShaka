module.exports = (client) => {
    client.on('message', async msg => {
        if (msg.body === null) return;
        let acao = msg.body.split(" ");
        let comando = acao[0].toLowerCase();

        // Marcar Todos
        if (comando === "!todos") {
            const chat = await msg.getChat();
            if (chat.isGroup) {
                const participants = chat.participants;
                const admins = participants.filter(p => p.isAdmin);
                const adminMapped = admins.map(a => a.id._serialized);

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
    });
};
