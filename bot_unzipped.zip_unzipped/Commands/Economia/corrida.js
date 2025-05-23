const { ButtonBuilder, ButtonStyle, ActionRowBuilder, EmbedBuilder, StringSelectMenuBuilder } = require('discord.js');
const User = require('../../Modules/Schemas/User'); // Mudando para o modelo correto

module.exports = {
  name: 'corrida',
  description: 'Aposte em uma corrida divertida e ganhe rubis!',
  type: 1,

  run: async (client, interaction) => {
    const userId = interaction.user.id;
    let userData = await User.findOne({ userId });
    if (!userData) {
      userData = new User({ userId });
      await userData.save();
    }

    // Verificar cooldown de 30 minutos
    const cooldown = 30 * 60 * 1000; // 30 minutos em milissegundos
    const agora = Date.now();
    const tempoRestante = userData.lastRaceTime ? (userData.lastRaceTime + cooldown - agora) : 0;

    if (tempoRestante > 0) {
      const minutosRestantes = Math.ceil(tempoRestante / 60000);
      return interaction.reply({
        content: `Você deve esperar **${minutosRestantes} minutos** antes de apostar novamente.`,
        ephemeral: true
      });
    }

    // Atualizando o tempo do último uso de corrida
    userData.lastRaceTime = agora;
    await userData.save();

    // Verificar se o usuário tem rubis suficientes para apostar
    const maxBet = 500;
    const minBet = 100;

    const embed = new EmbedBuilder()
      .setTitle('🏁 Corrida Maluca')
      .setDescription('Escolha o valor da sua aposta (de 100 a 500 rubis):')
      .setColor('#00bfff');

    // Menu suspenso para escolher o valor da aposta
    const betMenu = new StringSelectMenuBuilder()
      .setCustomId('aposta')
      .setPlaceholder('Escolha o valor da sua aposta!')
      .addOptions(
        { label: '100 Rubis', value: '100' },
        { label: '200 Rubis', value: '200' },
        { label: '300 Rubis', value: '300' },
        { label: '400 Rubis', value: '400' },
        { label: '500 Rubis', value: '500' },
      );

    const row = new ActionRowBuilder().addComponents(betMenu);

    // Enviar embed e menu suspenso para o usuário
    await interaction.reply({
      embeds: [embed],
      components: [row],
    });

    // Coletor para pegar a aposta
    const collector = interaction.channel.createMessageComponentCollector({
      filter: (i) => i.user.id === userId && i.customId === 'aposta',
      time: 15000,
      max: 1,
    });

    collector.on('collect', async (i) => {
      const aposta = parseInt(i.values[0], 10);

      // Verificar se o usuário tem rubis suficientes para apostar
      if (userData.coins < aposta) {
        return i.reply({
          content: 'Você não tem rubis suficientes para fazer essa aposta!',
          ephemeral: true,
        });
      }

      // Subtrai o valor da aposta
      userData.coins -= aposta;
      await userData.save();

      // Escolher corredores manualmente
      const corredores = [
        { nome: 'Cavalo', emoji: '🐎' },
        { nome: 'Foguete', emoji: '🚀' },
        { nome: 'Lesma', emoji: '🐌' },
        { nome: 'Pato', emoji: '🦆' },
      ];

      const escolhaEmbed = new EmbedBuilder()
        .setTitle('🏁 Corrida Maluca')
        .setDescription('Escolha o corredor em que você deseja apostar:')
        .setColor('#00bfff');

      // Menu suspenso para escolher o corredor
      const corredorMenu = new StringSelectMenuBuilder()
        .setCustomId('corredor')
        .setPlaceholder('Escolha o seu corredor!')
        .addOptions(corredores.map((corredor) => ({
          label: `${corredor.nome} ${corredor.emoji}`,
          value: corredor.nome,
        })));

      const corredorRow = new ActionRowBuilder().addComponents(corredorMenu);

      // Enviar embed e menu suspenso para escolher o corredor
      await i.update({
        embeds: [escolhaEmbed],
        components: [corredorRow],
      });

      // Coletor para pegar a escolha do corredor
      const corredorCollector = i.message.createMessageComponentCollector({
        filter: (buttonInteraction) => buttonInteraction.user.id === userId && buttonInteraction.customId === 'corredor',
        time: 15000,
        max: 1,
      });

      corredorCollector.on('collect', async (buttonInteraction) => {
        const corredorEscolhido = corredores.find((corredor) => corredor.nome === buttonInteraction.values[0]);

        // Exibir a corrida
        const raceEmbed = new EmbedBuilder()
          .setTitle('🏁 Corrida Maluca')
          .setDescription(
            `Você apostou **${aposta}** rubis no(a) **${corredorEscolhido.nome} ${corredorEscolhido.emoji}**!\n\nClique no botão abaixo para começar a corrida!`
          )
          .setColor('#00bfff');

        const botao = new ButtonBuilder()
          .setCustomId('apostar_corrida')
          .setLabel('Apostar')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('🎲');

        const raceRow = new ActionRowBuilder().addComponents(botao);

        await buttonInteraction.update({
          embeds: [raceEmbed],
          components: [raceRow],
        });

        // Coletor para apostar e realizar a corrida
        const raceCollector = buttonInteraction.message.createMessageComponentCollector({
          filter: (buttonInteraction) => buttonInteraction.user.id === userId && buttonInteraction.customId === 'apostar_corrida',
          time: 15000,
          max: 1,
        });

        raceCollector.on('collect', async (raceButtonInteraction) => {
          await raceButtonInteraction.deferUpdate();

          // Corrida
          const progresso = corredores.map((c) => ({
            ...c,
            pontos: 0,
          }));

          for (let turno = 0; turno < 10; turno++) {
            progresso.forEach((p) => {
              if (Math.random() < 0.6) p.pontos++;
            });

            const corridaText = progresso
              .map((p) => `${p.emoji} ━${'━'.repeat(p.pontos)}🏁`)
              .join('\n');

            await buttonInteraction.editReply({
              content: `**Corrida em andamento...**\n\n${corridaText}`,
              components: [],
              embeds: [],
            });

            await new Promise((r) => setTimeout(r, 1000));
          }

          const vencedor = progresso.sort((a, b) => b.pontos - a.pontos)[0];
          const ganhou = vencedor.nome === corredorEscolhido.nome;

          const resultadoEmbed = new EmbedBuilder()
            .setTitle(ganhou ? 'Você Venceu!' : 'Você Perdeu...')
            .setDescription(
              ganhou
                ? `O corredor **${vencedor.nome} ${vencedor.emoji}** venceu a corrida!\n\nVocê ganhou **+${aposta * 2}** rubis!`
                : `O vencedor foi **${vencedor.nome} ${vencedor.emoji}**...\nVocê perdeu a aposta!`
            )
            .setColor(ganhou ? '#00ff88' : '#ff0000');

          if (ganhou) userData.coins += aposta * 2; // Dobrar a aposta em caso de vitória
          else userData.coins = Math.max(0, userData.coins - aposta); // Subtrai a aposta em caso de derrota

          await userData.save();

          await buttonInteraction.editReply({
            embeds: [resultadoEmbed],
            components: [],
            content: '',
          });
        });

        raceCollector.on('end', (collected) => {
          if (collected.size === 0) {
            buttonInteraction.editReply({
              content: 'O tempo para iniciar a corrida acabou!',
              components: [],
              embeds: [],
            });
          }
        });
      });

      corredorCollector.on('end', (collected) => {
        if (collected.size === 0) {
          i.editReply({
            content: 'O tempo para escolher o corredor acabou!',
            components: [],
            embeds: [],
          });
        }
      });
    });

    collector.on('end', (collected) => {
      if (collected.size === 0) {
        interaction.editReply({
          content: 'O tempo para escolher o valor da aposta acabou!',
          components: [],
          embeds: [],
        });
      }
    });
  },
};