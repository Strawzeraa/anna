const { ButtonBuilder, ButtonStyle, ActionRowBuilder, EmbedBuilder } = require('discord.js');
const User = require('../../Modules/Schemas/User');

module.exports = {
  name: 'crime',
  description: 'Comete um crime ou tenta roubar outro usuário!',
  type: 1,
  options: [
    {
      name: 'tipo',
      description: 'Escolha o tipo de crime',
      type: 3,
      required: true,
      choices: [
        { name: 'Crime aleatório', value: 'aleatorio' },
        { name: 'Roubar outro usuário', value: 'roubo' }
      ]
    },
    {
      name: 'alvo',
      description: 'Escolha o alvo para roubar',
      type: 6,
      required: false
    }
  ],

  run: async (client, interaction) => {
    const tipo = interaction.options.getString('tipo');
    const alvo = interaction.options.getUser('alvo');
    const userId = interaction.user.id;

    const rubiEmoji = '<:rubi:1369325451532697620>';

    let userData = await User.findOne({ userId });
    if (!userData) {
      return interaction.reply({ content: 'Você ainda não criou sua conta! Use **/cadastrar** para começar.', ephemeral: true });
    }

    const cooldown = 3 * 60 * 60 * 1000;
    const currentTime = Date.now();

    if (userData.lastCrimeTime && currentTime - userData.lastCrimeTime < cooldown) {
      const timeRemaining = formatCooldownTime((cooldown - (currentTime - userData.lastCrimeTime)) / 1000);
      return interaction.reply({
        content: `Você precisa esperar **${timeRemaining}** para cometer outro crime.`,
        ephemeral: true
      });
    }

    userData.lastCrimeTime = currentTime;
    await userData.save();

    const button = new ButtonBuilder()
      .setCustomId('crime_button')
      .setLabel('Executar Ação')
      .setStyle(ButtonStyle.Danger)
      .setEmoji('💣');

    const row = new ActionRowBuilder().addComponents(button);

    const embed = new EmbedBuilder()
      .setColor('#ff003c')
      .setTitle('**Escolha seu destino criminoso!**')
      .setDescription(`Você está prestes a cometer um crime...\n\n**Tipo:** ${tipo === 'aleatorio' ? 'Crime Aleatório' : 'Roubo de Usuário'}\n\nClique no botão abaixo para continuar.`)
      .setFooter({ text: 'Lembre-se: o crime não compensa... ou será que sim?' })
      .setTimestamp();

    const sentMessage = await interaction.reply({
      embeds: [embed],
      components: [row],
      fetchReply: true
    });

    const filter = i => i.customId === 'crime_button' && i.user.id === userId;
    const collector = interaction.channel.createMessageComponentCollector({ filter, time: 15000 });

    collector.on('collect', async (i) => {
      let resultado = '';
      let sucesso = false;
      let recompensa = 0;

      if (tipo === 'aleatorio') {
        const crimes = [
          { lugar: 'banco', recompensa: Math.floor(Math.random() * 700) + 300 },
          { lugar: 'joalheria', recompensa: Math.floor(Math.random() * 600) + 250 },
          { lugar: 'mansão', recompensa: Math.floor(Math.random() * 800) + 400 }
        ];
        const crime = crimes[Math.floor(Math.random() * crimes.length)];
        sucesso = Math.random() > 0.2;

        if (sucesso) {
          recompensa = crime.recompensa;
          userData.coins += recompensa;
          await userData.save();
          resultado = `Você invadiu uma **${crime.lugar}** e saiu com **${recompensa} ${rubiEmoji}** no bolso!`;
        } else {
          const perda = Math.floor(Math.random() * 200) + 50;
          userData.coins = Math.max(0, userData.coins - perda);
          await userData.save();
          resultado = `Você foi pego no flagra e teve que pagar **${perda} ${rubiEmoji}** de fiança!`;
        }
      }

      if (tipo === 'roubo' && alvo) {
        const alvoData = await User.findOne({ userId: alvo.id });
        if (!alvoData) {
          return i.reply({ content: 'Esse usuário não possui uma conta!', ephemeral: true });
        }

        sucesso = Math.random() > 0.3;

        if (sucesso) {
          recompensa = Math.floor(Math.random() * 1000) + 500;
          if (alvoData.coins >= recompensa) {
            alvoData.coins -= recompensa;
            userData.coins += recompensa;
            await alvoData.save();
            await userData.save();
            resultado = `Você assaltou ${alvo.username} e conseguiu **${recompensa} ${rubiEmoji}**!`;
          } else {
            resultado = `${alvo.username} não tem rubis suficientes para roubo!`;
          }
        } else {
          const penalidade = Math.floor(Math.random() * 150) + 50;
          userData.coins = Math.max(0, userData.coins - penalidade);
          await userData.save();
          resultado = `O roubo falhou! Você foi denunciado e perdeu **${penalidade} ${rubiEmoji}**!`;
        }
      }

      await sentMessage.edit({
        content: `**Resultado do Crime:**\n\n${resultado}`,
        embeds: [],
        components: []
      });

      collector.stop();
    });

    collector.on('end', async (_, reason) => {
      if (reason === 'time') {
        await sentMessage.edit({
          content: 'Você demorou demais para agir e perdeu sua chance!',
          embeds: [],
          components: []
        });
      }
    });
  }
};

function formatCooldownTime(timeRemaining) {
  const hours = Math.floor(timeRemaining / 3600);
  const minutes = Math.floor((timeRemaining % 3600) / 60);
  return `${hours}h ${minutes}m`;
}