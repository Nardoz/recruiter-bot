/*
 * Basado en https://github.com/howdyai/botkit/blob/master/slack_bot.js
 *
 * Usage:
 * token=xxxxxxxx node index.js
 *
 * El token se obtiene creando el bot en https://nardoz.slack.com/apps/A0F7YS25R-bots
 */
if (!process.env.token) {
    console.log('Error: Specify token in environment')
    process.exit(1)
}

var request = require('request')
var Botkit = require('botkit')
var controller = Botkit.slackbot()

// La idea es que busca los speeches directo al repo git
var speech = []
var speechUrl = 'https://raw.githubusercontent.com/nardoz/recruiter-bot/master/messages.txt'
var lastETag

// Cada 10 segundos chequea si hay nuevos y actualiza el array
// TODO: mucho para mejorar acá
function refreshSpeech() {
  var options = {
    url: speechUrl,
    headers: {
      'If-None-Match': lastETag
    }
  }
  request(options, function (err, response) {
    if (err) return console.log(err)
    if (response.statusCode === 200) {
      lastETag = response.headers.etag
      speech = response.body.trim().split('\n')
    }
  })
  setTimeout(refreshSpeech, 10000)
}
refreshSpeech()

// login to Slack
var bot = controller.spawn({
  token: process.env.token
})
bot.startRTM(function (err, bot, payload) {
  if (err) {
    throw new Error('Could not connect to Slack')
  }
})

// respuesta random
// supuestamente con message_received debería funcionar pero no
// agregando 'ambient' did the trick
controller.hears(['recruiter speech'], ['message_received','ambient'], function (bot, message) {
  var randomIndex = Math.floor(Math.random()*speech.length)
  var randomSpeech = speech[randomIndex]
  try {
    bot.reply(message, randomSpeech)
  }
  catch (err) {
    console.log(err)
  }
})
