const Discord = require('discord.js');
const User = require('../../Modules/Schemas/User');

module.exports = {
  name: 'gf',
  description: 'Tente aumentar sua família com seu par! 👶',
  type: Discord.ApplicationCommandType.ChatInput,

  run: async (client, interaction) => {
    const userId = interaction.user.id;
    const userData = await User.findOne({ userId });

    if (!userData || !userData.marriedTo) {
      return interaction.reply({
        embeds: [new Discord.EmbedBuilder()
          .setColor('Red')
          .setTitle('❌ Amor solitário...')
          .setDescription('Você precisa estar casado(a) para criar uma nova vida em família.')],
        ephemeral: true
      });
    }

    const COOLDOWN = 1000 * 60 * 60;
    const now = Date.now();
    const lastTry = userData.lastGF || 0;

    if (now - lastTry < COOLDOWN) {
      const nextTry = Math.floor((lastTry + COOLDOWN) / 1000);
      return interaction.reply({
        embeds: [new Discord.EmbedBuilder()
          .setColor('Yellow')
          .setTitle('⏳ Calma lá...')
          .setDescription(`Você poderá tentar novamente <t:${nextTry}:R>.`)],
        ephemeral: true
      });
    }

    const chance = Math.random();
    if (chance >= 0.3) {
      userData.lastGF = now;
      await userData.save();
      return interaction.reply({
        embeds: [new Discord.EmbedBuilder()
          .setColor('Red')
          .setTitle('💭 Ainda não foi dessa vez...')
          .setDescription('A família ainda está em formação. Continuem firmes e tentem novamente mais tarde!')],
        ephemeral: false
      });
    }

    const spouseId = userData.marriedTo;
    const spouse = await client.users.fetch(spouseId);

    const confirmRow = new Discord.ActionRowBuilder().addComponents(
      new Discord.ButtonBuilder()
        .setCustomId('confirm_gf')
        .setLabel('Aceitar')
        .setStyle(Discord.ButtonStyle.Success),
      new Discord.ButtonBuilder()
        .setCustomId('deny_gf')
        .setLabel('Recusar')
        .setStyle(Discord.ButtonStyle.Danger)
    );

    await interaction.reply({
      content: `**${spouse}, você aceita ter um bebê com ${interaction.user}?**`,
      components: [confirmRow],
      ephemeral: false
    });

    const collector = interaction.channel.createMessageComponentCollector({
      componentType: Discord.ComponentType.Button,
      time: 30000
    });

    collector.on('collect', async i => {
      if (i.user.id !== spouseId) {
        return i.reply({ content: 'Apenas o cônjuge pode responder.', ephemeral: true });
      }

      if (i.customId === 'deny_gf') {
        collector.stop();
        return i.update({
          content: `**${spouse.username}** recusou gentilmente a proposta. Tudo bem, sem pressa!`,
          components: []
        });
      }

      // Aceitou
      collector.stop();
      const gender = Math.random() < 0.5 ? 'menino' : 'menina';

      await i.update({
        content: `Parabéns! Vocês terão um(a) **${gender}**!\n\n${interaction.user}, escolha o nome do bebê abaixo (30s):`,
        components: []
      });

      const nameCollector = interaction.channel.createMessageCollector({
        filter: msg => msg.author.id === interaction.user.id,
        time: 30000,
        max: 1
      });

      nameCollector.on('collect', async msg => {
        const nome = msg.content.trim().slice(0, 20);
        userData.filhos.push({ nome, genero: gender, nascimento: Date.now() });
        userData.lastGF = now;
        await userData.save();

        await msg.reply({
          embeds: [new Discord.EmbedBuilder()
            .setColor('Green')
            .setTitle('🎉 Uma nova vida chegou!')
            .setDescription(`**${interaction.user.username}** e **${spouse.username}** agora são papais de um(a) **${gender}** chamado(a) **${nome}**!`)
            .setThumbnail('https://cdn-icons-png.flaticon.com/512/4014/4014560.png')]
        });
      });

      nameCollector.on('end', async collected => {
        if (collected.size === 0) {
          await interaction.followUp({
            content: '⏰ Tempo esgotado! O nome do bebê não foi definido.',
            ephemeral: true
          });
        }
      });
    });

    collector.on('end', async (_, reason) => {
      if (reason === 'time') {
        await interaction.editReply({
          content: `⏰ O tempo acabou e ${spouse.username} não respondeu.`,
          components: []
        });
      }
    });
  }
};