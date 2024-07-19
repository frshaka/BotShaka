module.exports = (client) => {
  client.on("message", (message) => {
      if (message.body === "!ajuda" || message.body === "!AJUDA") {
          const txtMensagem = `Digite *!todos* para realizar a marcação de todos os membros.

Digite *!aviso* seguido de sua mensagem para realizar a marcação fantasma e notificar todos os membros, mesmo que o grupo esteja silenciado.

Digite *!ping* para testar o BotShaka

Digite *!contato* Para entrar em contado com o Desenvolverdor.`;
          message.reply(txtMensagem);
      }
  });
};
