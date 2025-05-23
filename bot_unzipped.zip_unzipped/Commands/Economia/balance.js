const Discord = require("discord.js");
const cor = require('../../config.js').discord.color;
const User = require("../../Modules/Database/User");

module.exports = {
  name: 'balance',
  description: 'Veja a carteira de usuários.',
  type: Discord.ApplicationCommandType.ChatInput,
  options: [
    {
      name: 'usuário',
      description: 'Mencione um usuário.',
      type: Discord.ApplicationCommandOptionType.User,
      required: false,
    }
  ],

  run: async (client, interaction) => {
    const userMentioned = interaction.options.getUser('usuário') || interaction.user;
    const database = new User();
    const userDatabase = await database.find(userMentioned.id);

    if (!userDatabase) {
      database.sendUndefinedUserMessage(interaction, userMentioned);
      return;
    }

    const isSelf = userMentioned.id === interaction.user.id;
    const rubiEmoji = '<:rubi:1369325451532697620>';

    const embed = new Discord.EmbedBuilder()
      .setColor(cor)
      .setTitle(isSelf ? 'Minha Carteira' : `Carteira de ${userMentioned.username}`)
      .setThumbnail(userMentioned.displayAvatarURL({ dynamic: true }))
      .setDescription(
        isSelf
          ? `Você tem exatamente:\n\n> ${rubiEmoji} \`${userDatabase.coins.toLocaleString()}\` rubis guardadinhos.`
          : `${userMentioned} tem:\n\n> ${rubiEmoji} \`${userDatabase.coins.toLocaleString()}\` rubis disponíveis.`
      )
      .setFooter({ text: 'Use seus rubis com sabedoria!' })
      .setTimestamp();

    interaction.reply({ embeds: [embed] });
  }
};