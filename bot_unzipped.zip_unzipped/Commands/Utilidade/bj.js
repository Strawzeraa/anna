// Imports
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ApplicationCommandType } = require('discord.js');
const User = require('../../Modules/Schemas/User');
const cor = require("../../config").discord.color;

// Cartas
const cartas = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const naipes = ['♠️', '♥️', '♦️', '♣️'];

function gerarCarta() {
  return {
    valor: cartas[Math.floor(Math.random() * cartas.length)],
    naipe: naipes[Math.floor(Math.random() * naipes.length)],
  };
}

function mostrarCartas(mao) {
  return mao.map(c => `\`${c.valor}${c.naipe}\``).join(' ');
}

function calcularTotal(mao) {
  let total = 0, ases = 0;
  for (const c of mao) {
    if (c.valor === 'A') {
      total += 11;
      ases++;
    } else if (['K', 'Q', 'J'].includes(c.valor)) {
      total += 10;
    } else {
      total += parseInt(c.valor);
    }
  }
  while (total > 21 && ases) {
    total -= 10;
    ases--;
  }
  return total;
}

module.exports = {
  name: 'blackjack',
  description: 'Jogue blackjack e teste sua sorte!',
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: 'aposta',
      description: 'Quantos rubis deseja apostar',
      type: 4,
      required: true
    },
    {
      name: 'modo',
      description: 'Escolha o modo de jogo',
      type: 3,
      required: false,
      choices: [
        { name: 'Normal', value: 'normal' },
        { name: 'Difícil', value: 'dificil' }
      ]
    }
  ],
  run: async (client, interaction) => {
    const aposta = interaction.options.getInteger('aposta');
    const modo = interaction.options.getString('modo') || 'normal';

    const userId = interaction.user.id;
    const usuario = await User.findOne({ userId }) || await User.create({ userId, coins: 0 });

    if (aposta <= 0 || aposta > usuario.coins) {
      return interaction.reply({ content: 'Você não tem saldo suficiente ou a aposta é inválida.', ephemeral: true });
    }

    const jogador = [gerarCarta(), gerarCarta()];
    const dealer = [gerarCarta(), gerarCarta()];

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('comprar').setLabel('Comprar').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('parar').setLabel('Parar').setStyle(ButtonStyle.Danger)
    );

    const embed = new EmbedBuilder()
      .setColor(cor)
      .setTitle(`🃏 Blackjack (${modo === 'dificil' ? 'Modo Difícil' : 'Modo Normal'})`)
      .setDescription(`**Suas cartas:** ${mostrarCartas(jogador)} — Total: \`${calcularTotal(jogador)}\`\n**Cartas do dealer:** \`${dealer[0].valor}${dealer[0].naipe}\` \`??\`\n\nAposte sua sorte e decida:`)
      .setFooter({ text: `Aposta: ${aposta.toLocaleString()} rubis • Boa sorte!` });

    await interaction.reply({ embeds: [embed], components: [row] });

    let fim = false;

    const collector = interaction.channel.createMessageComponentCollector({
      filter: i => i.user.id === interaction.user.id,
      time: 60000
    });

    collector.on('collect', async (i) => {
      if (fim) return;

      if (i.customId === 'comprar') {
        jogador.push(gerarCarta());
        const totalJ = calcularTotal(jogador);

        if (totalJ > 21) {
          fim = true;
          usuario.coins -= aposta;
          await usuario.save();

          return i.update({
            embeds: [new EmbedBuilder()
              .setColor('Red')
              .setTitle('💥 Você perdeu!')
              .setDescription(`**Suas cartas:** ${mostrarCartas(jogador)} — Total: \`${totalJ}\`\nVocê ultrapassou 21 e perdeu a aposta!`)
              .setFooter({ text: `- ${aposta.toLocaleString()} rubis • Saldo atual: ${usuario.coins.toLocaleString()} rubis` })],
            components: []
          });
        }

        return i.update({
          embeds: [new EmbedBuilder()
            .setColor(cor)
            .setTitle(`🃏 Blackjack (${modo === 'dificil' ? 'Modo Difícil' : 'Modo Normal'})`)
            .setDescription(`**Suas cartas:** ${mostrarCartas(jogador)} — Total: \`${totalJ}\`\n**Cartas do dealer:** \`${dealer[0].valor}${dealer[0].naipe}\` \`??\`\n\nContinue jogando:`)
            .setFooter({ text: `Aposta: ${aposta.toLocaleString()} rubis` })],
          components: [row]
        });
      }

      if (i.customId === 'parar') {
        fim = true;
        let totalJ = calcularTotal(jogador);
        let totalD = calcularTotal(dealer);

        // Dealer joga
        while (totalD < 17 || (modo === 'dificil' && totalD < totalJ && totalD < 21)) {
          dealer.push(gerarCarta());
          totalD = calcularTotal(dealer);
        }

        let resultado = '';
        let ganho = 0;

        if (totalD > 21 || totalJ > totalD) {
          resultado = '🎉 Você venceu!';
          ganho = modo === 'dificil' ? Math.floor(aposta * 1.5) : aposta;
          usuario.coins += ganho;
        } else if (totalJ === totalD) {
          resultado = '🤝 Empate!';
        } else {
          resultado = '💥 Você perdeu!';
          usuario.coins -= aposta;
        }

        await usuario.save();

        return i.update({
          embeds: [new EmbedBuilder()
            .setColor(resultado.includes('venceu') ? 'Green' : resultado.includes('Empate') ? 'Yellow' : 'Red')
            .setTitle(resultado)
            .setDescription(
              `**Suas cartas:** ${mostrarCartas(jogador)} — Total: \`${totalJ}\`\n**Cartas do dealer:** ${mostrarCartas(dealer)} — Total: \`${totalD}\`\n\n` +
              (ganho ? `Você ganhou \`${ganho.toLocaleString()}\` rubis!` :
               resultado.includes('Empate') ? 'Vocês empataram. Nada foi perdido.' :
               `Você perdeu \`${aposta.toLocaleString()}\` rubis.`))
            .setFooter({ text: `Saldo atual: ${usuario.coins.toLocaleString()} rubis` })],
          components: []
        });
      }
    });

    collector.on('end', (_, reason) => {
      if (!fim && reason === 'time') {
        interaction.editReply({ content: '⏰ Tempo esgotado.', components: [] });
      }
    });
  }
};