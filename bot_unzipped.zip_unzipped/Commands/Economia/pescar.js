const Discord = require('discord.js');
const cor = require('../../config.js').discord.color;
const User = require('../../Modules/Database/User');

module.exports = {
  name: 'pescar',
  description: 'Vá pescar e ganhe rubis! 🎣',
  type: Discord.ApplicationCommandType.ChatInput,

  run: async (client, interaction) => {
    const userId = interaction.user.id;
    const database = new User();

    try {
      const userDatabase = await database.find(userId);

      if (!userDatabase) {
        await database.sendUndefinedUserMessage(interaction, interaction.user);
        return;
      }

      const lastFish = userDatabase.lastFish || 0;
      const now = Date.now();

      const lastFishTimestamp = new Date(lastFish).getTime();

      const miliseconds = 6 * 60 * 60 * 1000; // 6 horas em milissegundos

      if (now - lastFishTimestamp < miliseconds) {
        const nextFishTimestamp = Math.floor((lastFishTimestamp + miliseconds) / 1000);

        const embed = new Discord.EmbedBuilder().setColor(cor).setTitle('🎣 Pesca')
          .setDescription(`- Você já pescou recentemente. 🐟\n- Tente novamente <t:${nextFishTimestamp}:R>. ⏳`);

        interaction.reply({ embeds: [embed] });
        return;
      }

      // Balanceamento da recompensa: entre 200 e 800 rubis
      const fishReward = Math.floor(Math.random() * 601) + 200; // Gera um número entre 200 e 800
      userDatabase.coins += fishReward;
      userDatabase.lastFish = new Date();

      await userDatabase.save();

      const embed = new Discord.EmbedBuilder().setColor(cor).setTitle('🎣 Pesca')
        .setDescription(`- Você pescou e ganhou \`${fishReward}\` rubis 🐠.\n- Agora você tem \`${userDatabase.coins}\` rubis <:rubi:1369325451532697620>.`);

      interaction.reply({ embeds: [embed] });

    } catch (error) {
      console.error(error);
      database.sendErrorMessage(interaction, 'pescar');
    }
  }
};