const Discord = require('discord.js');  
const User = require('../../Modules/Database/User');  
const SecretCode = require('../../Modules/Schemas/SecretCode');  
  
module.exports = {  
  name: 'cofre',  
  description: 'Tente descobrir a combinação secreta do cofre!',  
  type: Discord.ApplicationCommandType.ChatInput,  
  options: [  
    {  
      name: 'numero',  
      description: 'Digite um número de 3 dígitos (ex: 739)',  
      type: Discord.ApplicationCommandOptionType.String,  
      required: true  
    }  
  ],  
  
  run: async (client, interaction) => {  
    const tentativa = interaction.options.getString('numero');  
    const userId = interaction.user.id;  
    const custo = 500;  // O custo permanece o mesmo (1000 rubis)
  
    if (!/^\d{3}$/.test(tentativa)) {  
      return interaction.reply({ content: '❌ A senha deve conter exatamente 3 dígitos numéricos.', ephemeral: true });  
    }  
  
    const database = new User();  
    const userData = await database.find(userId);  
  
    if (!userData) return interaction.reply({ content: '❌ Você ainda não tem uma conta.', ephemeral: true });  
    if (userData.coins < custo) return interaction.reply({ content: '❌ Você não tem rubis suficientes.', ephemeral: true });  
  
    let segredo = await SecretCode.findOne();  
  
    // Gerar nova senha se não existir ou se tiver expirado  
    if (!segredo || segredo.expiresAt < Date.now()) {  
      const novaSenha = Math.floor(100 + Math.random() * 900).toString();  
      segredo = await SecretCode.findOneAndUpdate({}, {  
        code: novaSenha,  
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),  
        winner: null  
      }, { upsert: true, new: true });  
    }  
  
    // Deduzir custo  
    userData.coins -= custo;  
    await userData.save();  
  
    // Comparar tentativa  
    if (tentativa === segredo.code) {  
      const premio = 5000;  // O prêmio foi reduzido para 5000 rubis
      userData.coins += premio;  
      await userData.save();  
  
      const codigoAntigo = segredo.code; // guarda a senha antiga para não mostrar a nova
  
      // Gera nova senha imediatamente
      const novaSenha = Math.floor(100 + Math.random() * 900).toString();  
      segredo.code = novaSenha;  
      segredo.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);  
      segredo.winner = userId;  
      await segredo.save();  

      console.log(`Senha antiga: ${codigoAntigo}. Nova senha gerada para o cofre.`);  // Log da senha antiga e nova.

      const embed = new Discord.EmbedBuilder()  
        .setColor('Gold')  
        .setTitle('🔓 Cofre Desbloqueado!')  
        .setDescription(`Você acertou a senha secreta: \`${codigoAntigo}\`!\n**+${premio} rubis** adicionados à sua conta.`)  
        .setFooter({ text: 'A senha foi alterada imediatamente.' });  

      return interaction.reply({ embeds: [embed] });  
    }  
  
    // Gerar dica simples  
    let acertos = 0;  
    for (let i = 0; i < 3; i++) {  
      if (tentativa[i] === segredo.code[i]) acertos++;  
    }  
  
    const embed = new Discord.EmbedBuilder()  
      .setColor('Red')  
      .setTitle('❌ Senha Incorreta')  
      .setDescription(  
        `Você tentou: \`${tentativa}\`\n` +  
        (acertos === 0  
          ? 'Nenhum número está na posição certa.'  
          : `${acertos} número(s) estão na posição correta.`) +  
        `\n\n- \`-${custo} rubis\`\nSaldo atual: \`${userData.coins}\` rubis`  
      );  
  
    return interaction.reply({ embeds: [embed] });  
  }  
};