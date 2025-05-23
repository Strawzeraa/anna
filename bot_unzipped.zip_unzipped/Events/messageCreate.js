const fetch = require('node-fetch')
const { Events } = require('discord.js')
const GEMINI_API_KEY = 'AIzaSyAhc7anx3MRHnXuuVZTjac01E9h03QVtR8'

module.exports = {
  name: 'messageCreate',
  execute: async (message) => {
    if (message.author.bot) return;

    const prefixoIA = 'anna, '
    const conteudo = message.content.toLowerCase()

    if (conteudo.startsWith(prefixoIA)) {
      const pergunta = message.content.slice(prefixoIA.length)

      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: pergunta }] }]
          })
        })

        const data = await response.json()
        const resposta = data.candidates?.[0]?.content?.parts?.[0]?.text

        if (resposta) {
          message.reply(resposta)
        } else {
          message.reply('Não consegui entender... tenta perguntar de outra forma!')
        }

      } catch (err) {
        console.error('Erro ao chamar Gemini:', err)
        message.reply('Houve um erro ao tentar responder...')
      }
    }
  }
}