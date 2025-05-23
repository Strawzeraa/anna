const { ApplicationCommandType, ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');
const User = require('../../Modules/Schemas/User');

module.exports = {
  name: 'bio',
  description: 'Atualize a sua bio com um toque especial!',
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: 'texto',
      description: 'Escreva sua nova bio (máximo de 100 caracteres)',
      type: ApplicationCommandOptionType.String,
      required: true
    }
  ],

  run: async (client, interaction) => {
    const texto = interaction.options.getString('texto').trim().slice(0, 100);
    const userId = interaction.user.id;

    const userData = await User.findOneAndUpdate(
      { userId },
      { bio: texto },
      { new: true, upsert: true }
    );

    const embed = new EmbedBuilder()
      .setColor('#FF85B3') // Rosa suave
      .setTitle('✨ Bio atualizada com sucesso!')
      .setDescription(`Sua nova bio ficou assim:\n> *${userData.bio}*`)
      .setFooter({ text: 'Mostre sua personalidade com estilo!' })
      .setTimestamp();

    return interaction.reply({ embeds: [embed], ephemeral: true });
  }
};