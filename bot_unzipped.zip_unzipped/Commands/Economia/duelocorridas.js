const {
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  EmbedBuilder,
  StringSelectMenuBuilder
} = require('discord.js');
const User = require('../../Modules/Schemas/User');

module.exports = {
  name: 'duelocorrida',
  description: 'Desafie outro usuário para uma corrida de apostas!',
  type: 1,
  options: [
    {
      name: 'oponente',
      description: 'Usuário que você quer desafiar',
      type: 6,
      required: true,
    }
  ],

  run: async (client, interaction) => {
    const desafiador = interaction.user;
    const oponente = interaction.options.getUser('oponente');

    if (oponente.id === desafiador.id)
      return interaction.reply({ content: 'Você não pode desafiar a si mesmo!', ephemeral: true });

    let desafiadorData = await User.findOne({ userId: desafiador.id }) || new User({ userId: desafiador.id });
    let oponenteData = await User.findOne({ userId: oponente.id }) || new User({ userId: oponente.id });

    const cooldown = 30 * 60 * 1000; // 30 minutos
    const agora = Date.now();

    const restanteDesafiador = desafiadorData.lastDuelRaceTime + cooldown - agora;
    const restanteOponente = oponenteData.lastDuelRaceTime + cooldown - agora;

    if (restanteDesafiador > 0 || restanteOponente > 0) {
      const formatarTempo = (ms) => {
        const min = Math.floor(ms / 60000);
        const seg = Math.floor((ms % 60000) / 1000);
        return `${min}m ${seg}s`;
      };

      let mensagens = [];
      if (restanteDesafiador > 0) mensagens.push(`**${desafiador.username}** precisa esperar **${formatarTempo(restanteDesafiador)}**`);
      if (restanteOponente > 0) mensagens.push(`**${oponente.username}** precisa esperar **${formatarTempo(restanteOponente)}**`);

      return interaction.reply({
        content: `Um de vocês precisa esperar um pouco antes de tentar outra corrida!\n\n${mensagens.join('\n')}`,
        ephemeral: true
      });
    }

    const embed = new EmbedBuilder()
      .setTitle('🏁 Desafio de Corrida')
      .setDescription(`Escolha o valor da aposta (100 a 500 rubis).\nO oponente **${oponente.username}** precisa aceitar depois.`)
      .setColor('#ff69b4');

    const menuAposta = new StringSelectMenuBuilder()
      .setCustomId('duelo_aposta')
      .setPlaceholder('Escolha sua aposta')
      .addOptions(
        { label: '100 Rubis', value: '100' },
        { label: '200 Rubis', value: '200' },
        { label: '300 Rubis', value: '300' },
        { label: '400 Rubis', value: '400' },
        { label: '500 Rubis', value: '500' },
      );

    const row = new ActionRowBuilder().addComponents(menuAposta);

    await interaction.reply({
      embeds: [embed],
      components: [row],
      ephemeral: false
    });

    const apostaColetor = interaction.channel.createMessageComponentCollector({
      filter: i => i.user.id === desafiador.id && i.customId === 'duelo_aposta',
      time: 15000,
      max: 1
    });

    apostaColetor.on('collect', async (i) => {
      const valorAposta = parseInt(i.values[0]);

      if (desafiadorData.coins < valorAposta || oponenteData.coins < valorAposta) {
        return i.update({ content: 'Um dos usuários não tem rubis suficientes para apostar!', components: [], embeds: [] });
      }

      const confirmEmbed = new EmbedBuilder()
        .setTitle('🏁 Aposta Confirmada')
        .setDescription(`Valor da aposta: **${valorAposta} rubis** cada\nAguardando aceitação de ${oponente}...`)
        .setColor('#ffa500');

      const botaoAceitar = new ButtonBuilder()
        .setCustomId('aceitar_duelo')
        .setLabel('Aceitar Desafio')
        .setStyle(ButtonStyle.Success);

      const botaoRow = new ActionRowBuilder().addComponents(botaoAceitar);

      await i.update({ embeds: [confirmEmbed], components: [botaoRow] });

      const aceitarColetor = interaction.channel.createMessageComponentCollector({
        filter: btn => btn.user.id === oponente.id && btn.customId === 'aceitar_duelo',
        time: 20000,
        max: 1
      });

      aceitarColetor.on('collect', async (btn) => {
        await btn.deferUpdate();

        const corredores = [
          { nome: 'Cavalo', emoji: '🐎' },
          { nome: 'Foguete', emoji: '🚀' },
          { nome: 'Lesma', emoji: '🐌' },
          { nome: 'Pato', emoji: '🦆' },
        ];

        const escolhaEmbed = new EmbedBuilder()
          .setTitle('Escolha seu corredor')
          .setDescription('Selecione o seu corredor favorito!')
          .setColor('#00bfff');

        const menuCorredores = new StringSelectMenuBuilder()
          .setCustomId('escolher_corredor')
          .setPlaceholder('Escolha seu corredor!')
          .addOptions(corredores.map(c => ({
            label: `${c.nome} ${c.emoji}`,
            value: c.nome
          })));

        const escolhaRow = new ActionRowBuilder().addComponents(menuCorredores);

        await interaction.editReply({
          content: `${desafiador}, ${oponente}, escolham seus corredores!`,
          embeds: [escolhaEmbed],
          components: [escolhaRow]
        });

        const escolhidos = {};

        const corredorColetor = interaction.channel.createMessageComponentCollector({
          filter: sel => [desafiador.id, oponente.id].includes(sel.user.id) && sel.customId === 'escolher_corredor',
          max: 2,
          time: 20000,
        });

        corredorColetor.on('collect', async (sel) => {
          const escolha = corredores.find(c => c.nome === sel.values[0]);

          if (escolhidos[sel.user.id]) {
            return sel.reply({ content: 'Você já escolheu o seu corredor!', ephemeral: true });
          }

          escolhidos[sel.user.id] = escolha;
          await sel.reply({ content: `Você escolheu ${escolha.nome} ${escolha.emoji}`, ephemeral: true });

          if (Object.keys(escolhidos).length === 2) {
            // Verificar se ambos escolheram o mesmo corredor
            if (escolhidos[desafiador.id].nome === escolhidos[oponente.id].nome) {
              return interaction.editReply({
                content: 'Corrida cancelada! Ambos escolheram o mesmo corredor.',
                embeds: [],
                components: []
              });
            }

            // Deduz rubis e inicia a corrida
            desafiadorData.coins -= valorAposta;
            oponenteData.coins -= valorAposta;
            desafiadorData.lastDuelRaceTime = agora;
            oponenteData.lastDuelRaceTime = agora;
            await desafiadorData.save();
            await oponenteData.save();

            const progresso = corredores.map(c => ({ ...c, pontos: 0 }));

            for (let t = 0; t < 10; t++) {
              progresso.forEach(p => {
                if (Math.random() < 0.6) p.pontos++;
              });

              const txt = progresso.map(p => `${p.emoji} ━${'━'.repeat(p.pontos)}🏁`).join('\n');
              await interaction.editReply({ content: `**Corrida em andamento...**\n\n${txt}` });
              await new Promise(r => setTimeout(r, 1000));
            }

            const vencedor = progresso.sort((a, b) => b.pontos - a.pontos)[0];
            let ganhador;

            if (escolhidos[desafiador.id].nome === vencedor.nome) ganhador = desafiador;
            else if (escolhidos[oponente.id].nome === vencedor.nome) ganhador = oponente;

            const total = valorAposta * 2;
            const bonus = Math.floor(total * 0.2);

            const resultadoEmbed = new EmbedBuilder()
              .setTitle('Resultado da Corrida')
              .setDescription(
                ganhador
                  ? `**${vencedor.nome} ${vencedor.emoji}** venceu!\n**${ganhador.username}** ganhou **${total + bonus} rubis!**`
                  : `**${vencedor.nome} ${vencedor.emoji}** venceu, mas ninguém apostou nele!`
              )
              .setColor('#00ff88');

            if (ganhador?.id === desafiador.id) desafiadorData.coins += total + bonus;
            if (ganhador?.id === oponente.id) oponenteData.coins += total + bonus;

            await desafiadorData.save();
            await oponenteData.save();

            await interaction.editReply({
              content: '',
              embeds: [resultadoEmbed],
              components: []
            });
          }
        });

        corredorColetor.on('end', collected => {
          if (collected.size < 2) {
            interaction.editReply({ content: 'Corrida cancelada por inatividade. O desafio expirou.', components: [], embeds: [] });

            // Não conta cooldown quando o desafio é cancelado
            desafiadorData.lastDuelRaceTime = agora;
            oponenteData.lastDuelRaceTime = agora;
            desafiadorData.save();
            oponenteData.save();
          }
        });
      });

      aceitarColetor.on('end', collected => {
        if (collected.size < 1) {
          interaction.editReply({ content: 'Corrida cancelada por inatividade. O outro jogador não aceitou a corrida.', components: [], embeds: [] });

          // Não conta cooldown se o botão não for clicado
          desafiadorData.lastDuelRaceTime = agora;
          oponenteData.lastDuelRaceTime = agora;
          desafiadorData.save();
          oponenteData.save();
        }
      });
    });
  }
};