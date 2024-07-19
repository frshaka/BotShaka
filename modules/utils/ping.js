module.exports = (client) => {
  client.on("message", async (message) => {
      if (message.body === "!ping" || message.body === "!PONG") {
          message.reply("pong");
      }
  });
};
