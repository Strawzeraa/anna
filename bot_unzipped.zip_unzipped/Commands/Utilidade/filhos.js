const { EmbedBuilder } = require('discord.js'); // Para Embeds
const Discord = require('discord.js'); // Adicionando a importação de Discord.js
const User = require('../../Modules/Schemas/User'); // Ajuste o caminho se necessário

module.exports = {
  name: 'filhos',
  description: 'Veja a lista dos seus filhos com o seu par! 👶',
  type: Discord.ApplicationCommandType.ChatInput, // Usando o tipo correto para Slash Commands

  run: async (client, interaction) => {
    const userId = interaction.user.id;
    let userData = await User.findOne({ userId });

    if (!userData) {
      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor('Red')
          .setTitle('❌ Você não tem dados registrados!')
          .setDescription('Parece que você ainda não tem dados de relacionamento.')],
        ephemeral: true
      });
    }

    if (!userData.marriedTo) {
      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor('Red')
          .setTitle('❌ Você não está casado(a)!')
          .setDescription('Você precisa estar casado(a) para ver seus filhos. 💔')],
        ephemeral: true
      });
    }

    const parceiroId = userData.marriedTo;
    const parceiroData = await User.findOne({ userId: parceiroId });

    if (!parceiroData) {
      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor('Red')
          .setTitle('❌ Não conseguimos encontrar os dados do seu parceiro!')
          .setDescription('Algo deu errado ao tentar verificar os dados do seu parceiro. 😔')],
        ephemeral: true
      });
    }

    const filhos = [...userData.filhos, ...parceiroData.filhos];

    if (filhos.length === 0) {
      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor('Yellow')
          .setTitle('👶 Sem filhos registrados')
          .setDescription('Você e seu parceiro ainda não têm filhos registrados. 😔')],
        ephemeral: true
      });
    }

    const listaFilhos = filhos.map((filho, index) => {
      const dataNascimento = new Date(filho.nascimento);
      const dataAtual = new Date();

      let idade = dataAtual.getFullYear() - dataNascimento.getFullYear();
      const mesNascimento = dataNascimento.getMonth();
      const mesAtual = dataAtual.getMonth();
      
      if (mesAtual < mesNascimento || (mesAtual === mesNascimento && dataAtual.getDate() < dataNascimento.getDate())) {
        idade--;
      }

      const emojiGenero = filho.genero === 'menino' ? '👦' : '👧';

      const dataNascimentoFormatada = dataNascimento.toLocaleDateString('pt-BR', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      });

      return `**${index + 1}.** ${filho.nome} ${emojiGenero} - ${idade} anos - Nascido em ${dataNascimentoFormatada}`;
    }).join('\n');

    const embed = new EmbedBuilder()
      .setColor('Aqua')
      .setTitle('👶 Seus filhos com o parceiro(a)')
      .setDescription(listaFilhos)
      .setFooter({ text: `Você e seu parceiro têm ${filhos.length} filho(s) registrado(s)! 🎉` });

    interaction.reply({
      embeds: [embed],
      ephemeral: true
    });
  }
};