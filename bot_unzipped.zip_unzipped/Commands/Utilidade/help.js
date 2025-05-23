const { ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'help',
  description: 'Mostra todos os meus comandos disponíveis',
  type: 1,

  run: async (client, interaction) => {
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('help_select')
      .setPlaceholder('🌟 Escolha uma categoria de comandos!')
      .addOptions([
        {
          label: '💸 Economia',
          value: 'economia',
          description: 'Comandos de economia como transferir, apostar, etc.',
          emoji: '💸'
        },
        {
          label: '🏁 Corridas & Apostas',
          value: 'corridas',
          description: 'Comandos para apostas e jogos de corrida!',
          emoji: '🏁'
        },
        {
          label: '❤️ Relacionamentos & Família',
          value: 'relacionamentos',
          description: 'Comandos para interagir com outros usuários!',
          emoji: '❤️'
        },
        {
          label: '🎨 Personalização',
          value: 'personalizacao',
          description: 'Comandos para personalizar seu perfil!',
          emoji: '🎨'
        },
        {
          label: '🛠️ Utilidade',
          value: 'utilidade',
          description: 'Comandos úteis como ping e botinfo!',
          emoji: '🛠️'
        },
        {
          label: '🔧 Outros',
          value: 'outros',
          description: 'Comandos adicionais!',
          emoji: '🔧'
        },
      ]);

    const row = new ActionRowBuilder().addComponents(selectMenu);

    const embed = new EmbedBuilder()
      .setColor('#ff66cc')  // Cor mais vibrante
      .setTitle('📖 Meus Comandos')
      .setDescription('Escolha uma categoria abaixo para explorar meus comandos!')
      .setFooter({ text: 'Escolha uma categoria para começar!' });

    // Envia a mensagem com o select menu
    await interaction.reply({
      embeds: [embed],
      components: [row],
      ephemeral: false,
    });

    // Criar o coletor de interações para o select menu
    const filter = (i) => i.customId === 'help_select' && i.user.id === interaction.user.id;
    const collector = interaction.channel.createMessageComponentCollector({ filter, time: 2 * 60 * 1000 });

    collector.on('collect', async (i) => {
      const value = i.values[0];
      let categoryEmbed = new EmbedBuilder().setColor('#ff66cc');

      if (value === 'economia') {
        categoryEmbed
          .setTitle('💸 Comandos de Economia')
          .setDescription([
            '`/balance` - Veja a carteira de usuários.',
            '`/transferir` - Transfira rubis para um usuário.',
            '`/daily` - Resgate suas rubis diárias.',
            '`/investir` - Invista seus rubis com diferentes níveis de risco.',
            '`/work` - Veja qual trabalho você tem hoje e ganhe rubis!',
            '`/pescar` - Vá pescar e ganhe rubis! 🎣',
            '`/ranking` - Veja o ranking dos usuários mais ricos.',
            '`/crime` - Comete um crime ou tenta roubar outro usuário!',
            '`/drop` - Gere um drop de rubis para o servidor',
            '`/apostar` - Aposte rubis com um usuário.',
          ].join('\n'));
      } else if (value === 'corridas') {
        categoryEmbed
          .setTitle('🏁 Comandos de Corridas & Apostas')
          .setDescription([
            '`/corrida` - Aposte em uma corrida divertida e ganhe rubis!',
            '`/duelocorrida` - Desafie outro usuário para uma corrida de apostas!',
            '`/cassino` - Jogue no caça-níquel com seus rubis!',
            '`/jogodavelha` - Desafie a Anna no jogo da velha!',
            '`/cobrinha` - Jogue um mini game da cobrinha!',
            '`/cofre` - Tente descobrir a combinação secreta do cofre!',
          ].join('\n'));
      } else if (value === 'relacionamentos') {
        categoryEmbed
          .setTitle('❤️ Comandos de Relacionamentos & Família')
          .setDescription([
            '`/casar` - Peça alguém em casamento com muito charme!',
            '`/filhos` - Veja a lista dos seus filhos com o seu par! 👶',
            '`/cuidar` - Cuide dos seus filhos e fortaleça os laços!',
            '`/divorciar` - Encerre seu relacionamento com muito respeito (ou não)',
            '`/gf` - Tente ter um filho com seu par! 👶',
          ].join('\n'));
      } else if (value === 'personalizacao') {
        categoryEmbed
          .setTitle('🎨 Comandos de Personalização')
          .setDescription([
            '`/perfil` - Veja seu perfil completo (rubis, bio, banner etc)',
            '`/banner` - Veja todos os banners disponíveis na loja!',
            '`/bio` - Atualize a sua bio com um toque especial!',
          ].join('\n'));
      } else if (value === 'utilidade') {
        categoryEmbed
          .setTitle('🛠️ Comandos de Utilidade')
          .setDescription([
            '`/botinfo` - Mostra informações detalhadas sobre mim!',
            '`/ping` - Veja o meu ping!',
            '`/comandos` - Veja todos os comandos disponíveis do bot.',
            '`/help` - Mostra todos os meus comandos disponíveis',
          ].join('\n'));
      } else if (value === 'outros') {
        categoryEmbed
          .setTitle('🔧 Outros Comandos')
          .setDescription('`/userinfo` - Veja informações completas de um usuário!');
      }

      // Atualiza a mensagem com os comandos da categoria selecionada
      await i.update({ embeds: [categoryEmbed] });
    });
  },
};