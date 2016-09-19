/*
 * Basado en https://github.com/howdyai/botkit/blob/master/slack_bot.js
 *
 * Usage:
 * token=xxxxxxxx node index.js
 *
 * El token se obtiene creando el bot en https://nardoz.slack.com/apps/A0F7YS25R-bots
 */
var request = require('request')
var Botkit = require('botkit')
var moment = require('moment')

if (!process.env.token) {
    console.log('Error: Specify token in environment')
    process.exit(1)
}

// recruiter no labura los findes
if (process.env.debug !== 'true') {
    var now = moment().utcOffset(-3)
    if (now.weekday() === 0 || now.weekday() === 6) {
        process.exit(0)
    }
}

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
bot.configureIncomingWebhook({url: process.env.WEBHOOK })

// respuesta random
// supuestamente con message_received debería funcionar pero no
// agregando 'ambient' did the trick
controller.hears(['recruiter speech'], ['direct_message','message_received','ambient'], function (bot, message) {
  var randomIndex = Math.floor(Math.random()*speech.length)
  var randomSpeech = speech[randomIndex]
  try {
    bot.reply(message, randomSpeech)
  }
  catch (err) {
    console.log('bot reply err:', err)
  }
})

var noJobsAvailable = [
    '¡Qué lastima! No tengo más ofertas por ahora, pero si me hacés acordar dentro de un rato me fijo de nuevo y te aviso.',
    '¡Interesante! Dejame ver si encuentro algo para vos, volveme a preguntar en un rato...',
    '¡Hola! Es bueno saberlo. En este momento no tengo nada interesante para ofrecerte, pero consultame más tarde y me fijo. ¡Gracias!',
    '¿Ah sí? Creo que tengo una posición super adecuada para vos. En un ratito me comunico con uno de mis clientes y averiguo bien, volveme a consultar más tarde!',
    '_se frota las manos y empieza a buscar una oferta para hacerle_',
    '_detiene inmediatamente lo que está haciendo y presta atención_',
    '_abre enormemente los ojos_ https://giphy.com/gifs/75IszyEvsH1eg',
    '_te acaba de agregar a su planilla Excel_',
    '_acaba de ponerte en su lista de spam_',
    '_comenzó a seguirte en LinkedIn_'
]

controller.hears([/.*(busco|buscando)(.+otro)?.+(trabajo|trabajito|laburo|laburito)/i], ['direct_message','message_received','ambient'], function (bot, message) {
    bot.api.reactions.add({
        timestamp: message.ts,
        channel: message.channel,
        name: 'eyes',
    }, function(err, res) {
        if (err) bot.botkit.log('Failed to add emoji reaction :(', err);
    })

    setTimeout(function () {
        var offer = /*jobOffer() ||*/ getRandomOf(noJobsAvailable)
        if (Math.random() > .55) {
            bot.reply(message, offer)
        }
        else {
            send(offer, message.channel)
        }
    }, 3000)
})

function send(message, channel) {
    bot.sendWebhook({
        text: message,
        channel: channel
    }, function (err, res) {
        if (err) console.log('incoming webhook err:', err)
    })    
}

var goodMondayMessages = [
    '¡Buen día! Una nueva semana ha llegado. Es tiempo de recargar fuerzas y mejorar nuestro humor. Dibuja una sonrisa en tu rostro y mueve el mundo con tu determinación. ¡Feliz inicio de semana!',
    '¡Hola a todos! Esta semana quiero empezarla con alegría porque sé que tengo muchas oportunidades de mejorar. Quiero aprovecharlas al máximo, así que no me detendré a quejarme ya que el lunes acaba de llegar. ¡Mente positiva!',
    '¡Muy buenos días! Los lunes no tienen por qué ser aburridos, puedes cambiar todo lo gris con una gran sonrisa que te ayude a empezar. Ustedes son los hacedores de su propio destino, si deciden ser felices nada los detendrá. ¡Buen inicio de semana!',
    '¡Hola, hola, hola! A empezar la semana con una sonrisa, con sol o sin él puedes brillar. Recuerda que la fuerza recae en tus ganas de superarte así que no pienses en volver atrás. ¡Arriba ese ánimo!',
    '¡Buen día! Ya llegó el lunes y no hay tiempo para perezas ni para renegar. Recuerda que te esperan muchas nuevas experiencias así que no pierdas tiempo y llénate de energía para trabajar. ¡Ánimo!',
    '¡Muy buenos días! ¿Saben qué? Esta semana presiento que será diferente. Tienes siete poderosas razones para empezarla a disfrutar. No te desanimes al primer día porque la vida te puede sorprender regalándote la más grande felicidad. ¡Empieza con energía!',
    '¡Hola! Este lunes es un perfecto día para recargar las baterías, no te desanimes antes de empezar. Si empiezas tu semana con una sonrisa en los labios verás que se te abrirán muchas puertas y prosperarás. ¡Arriba ese ánimo!',
    '¡Buen día! Les deseo un lindo inicio de semana, empiecen por sonreír y mostrar una agradable actitud. Si le ponen ganas a todo lo que hacen verán que la vida los tratará con gratitud.',
    '¡Buen día! Una nueva semana comienza, tienes la oportunidad perfecta para empezar de nuevo, con más ánimo y más esfuerzo; en tus manos está la posibilidad de hacer de esta semana la mejor del mes. Vamos, ¡comienza con una sonrisa este nuevo día!',
    '¡Hola! Hoy es un nuevo día, una nueva oportunidad, un lienzo en blanco. Tomemos pinturas y pinceles, que es momento de pintarlo y de nosotros dependerá lo que suceda. Recuerda lo importante que es hacernos cargo de nuestro poder y usarlo con responsabilidad. ¡Feliz lunes!'
]

var goodMorningMessages = [
    '¡Buen día!',
    '¡Hola a todos! ¿Cómo andan hoy?',
    '¡Muy buenos días!'
]

var recruitingMessagePrologue = [
    'Para importante empresa agropecuaria,',
    'Para una reconocida multinacional de medios,',
    'Para startup que está creciendo exponencialmente,',
    'Para trabajar en importante empresa de E-commerce ubicada en el barrio de Núñez,',
    'Para importante agencia de marketing digital originaria de New York, ubicada en el barrio de Palermo,',
    'Para empresa internacional de medios,',
    'Para una start up en crecimiento,',
    'Para una start up en crecimiento ubicada en Palermo,',
    'Para una start up en crecimiento ubicada en Almagro,',
    'Para una start up en crecimiento ubicada en Villa Crespo,',
    'Para una start up en crecimiento ubicada en Abasto,',
    'Para una start up en crecimiento ubicada en San Telmo,',
    'Para una start up en crecimiento ubicada en Microcentro,',
    'Para una start up en crecimiento ubicada en Puerto Madero,',
    'Para una start up en crecimiento ubicada en La Boca,',
    'Para una start up en crecimiento ubicada en Dock Sud,',
    'Para una start up en crecimiento ubicada en Avellaneda,',
    'Para una start up en crecimiento ubicada en Quilmes,',
    'Para una start up en crecimiento ubicada en La Plata,',
    'Para una start up en crecimiento ubicada en La Lucila,',
    'Para una start up en crecimiento ubicada en Martínez,',
    'Para una start up en crecimiento ubicada en Luján,',
    'Para una start up en crecimiento ubicada en Mar del Plata,',
    'Para una start up en crecimiento ubicada en Monte Hermoso,',
    'Para una start up en crecimiento ubicada en Córdoba,',
    'Para una start up en crecimiento ubicada en Río Gallegos,',
    'Para una start up en crecimiento ubicada en Formosa,',
    'Para una start up en crecimiento ubicada en Neuquén,',
    'Para una start up en crecimiento ubicada en Córdoba,',
    'Para una start up en crecimiento ubicada en San Luis,',
    'Para una start up en crecimiento ubicada en Montevideo,',
    'Para una start up en crecimiento ubicada en Lima,',
    'Para una start up en crecimiento ubicada en Puerto Rico,',
    'Para uno de nuestros clientes de USA,'
]

var recruitingMessageRole = [
    'estamos buscando programadores SR',
    'estamos buscando un Programador Sr',
    'estoy en la búsqueda de un buen developer y maquetador',
    'nos encontramos en la búsqueda de un Desarrollador Semi-senior',
    'buscamos a los desarrolladores más talentosos',
    'estamos sumando Full Stack Developers',
    'buscamos crecer el equipo de desarrollo y para eso queremos incorporar arquitectos',
    'necesitamos un Developer Ninja',
    'estamos buscando Developers Junior Ninja',
    'nos encontramos en la búsqueda de Arquitectos y Programadores SR',
    'estamos buscando Líder de Desarrollo',
    'estamos buscando Arquitecto Senior',
    'estoy en la búsqueda de un Gerente de Desarrollo',
    'estamos ampliando el talentoso equipo de developers y para eso buscamos un excelente Rockstar Developer',
    'buscamos ROCKSTAR ENGINEERS',
    'estamos en la búsqueda de los más destacables Junior Developers',
    'estoy buscando Rockstar Juniors'
]

var recruitingMessageSkills = [
    'idealmente con conocimientos en:',
    'con mucha experiencia en:',
    'que además posean vasta experiencia en:',
    'que estén bien preparados en:',
    'con mucha habilidad para manejar:',
    'y sobretodo con experiencia en:',
    'cuyos skills estén enfocados en:',
    'con interesante background en:',
    'que hayan estado trabajando con:'
]

var recruitingMessageTechnologies = [
    'Python',
    'PHP',
    '.NET',
    'Visual Basic',
    'Fox Pro',
    'MS SQL',
    'Oracle',
    'Turbo Pascal',
    'Rust',
    'CoffeeScript',
    'XML',
    'XHTML',
    'XPath',
    'DHTML',
    'HTML',
    'HTML5',
    'CSS',
    'JScript',
    'VBScript',
    'Perl',
    'jQuery',
    'Mootools',
    'C++',
    'Delphi',
    'COM, DCOM',
    'Autocad',
    'J2ME',
    'J2EE',
    'J2SE',
    'Hibernate',
    'Struts',
    'UML',
    'SOAP',
    'XMLRPC',
    'Lean Development',
    'Scrum',
    'AWS',
    'Azure',
    'Heroku',
    'Semantic web',
    'Web 2.0',
    'Web 3.0',
    'Java',
    'Scala',
    'Rust',
    'R',
    'Haskell',
    'Smalltalk',
    'Assembler',
    'ActionScript',
    'Macromedia Flash',
    'Dreamweaver',
    'Photoshop',
    'Unity',
    'XCode',
    'TypeScript',
    'criptografía',
    'interfaces 3D',
    'AR/VR',
    'microservices',
    'SOA',
    'servicios REST',
    'HTTP',
    'TCP',
    'UDP',
    'WebSockets',
    'POP3',
    'SMTP',
    'IMAP',
    'SSL',
    'Nginx',
    'Apache',
    'Struts',
    'Maven',
    'Node',
    'JavaScript',
    'Yahoo APIs',
    'Google APIs',
    'Bing APIs',
    'Facebook APIs',
    'Twitter APIs',
    'Instagram APIs',
    'Office 365 APIs',
    'Sharepoint',
    'WordPress',
    'Magento',
    'LDAP',
    'Microsoft Proxy Server',
    'Microsoft IIS',
    'ASP.NET',
    'Windows NT',
    'OLAP',
    'SAP',
    'Mondrian Server',
    'SAP NetWeaver',
    'data warehouse',
    'analytics',
    'Arduino',
    'Raspberry',
    'LUA',
    'Machine learning',
    'Sentiment analysis',
    'Natural language',
    'Big Data',
    'Hadoop',
    'Apache Spark',
    'Chef',
    'Puppet',
    'Docker',
    'VMware',
    'ethical hacking',
    'scraping',
    'web crawlers',
    'data cleansing',
    'Bootstrap',
    'WebForms',
    'Windows WCF Services',
    'Powershell',
    'Active Directory',
    'Exchange',
    'Angular',
    'React',
    'Ember',
    'Meteor',
    'ExtJS',
    'Silverlight',
    'Java applets',
    'DOM',
    'XSL',
    'Ruby',
    'Ruby on Rails',
    'Webkit',
    'IE8',
    'IE9',
    'AJAX',
    'Polymer',
    'Knockout',
    'Backbone',
    'JSX',
    'C#',
    'VB.NET',
    'SASS',
    'SAML',
    'Kanban',
    'Spring',
    'Salesforce',
    'Apex',
    'Visualforce',
    'Continuous Integration',
    'Continuous Delivery',
    'Continuous Deployment',
    'Red Hat',
    'SUSE',
    'Ubuntu',
    'Debian',
    'Solaris',
    'HP UX',
    'CentOS',
    'DevOps',
    'CloudOps',
    'iOS',
    'Android',
    'Blackberry',
    'Marionette',
    'ECMAScript 5',
    'Grunt',
    'Bower',
    'Gulp',
    'Yeoman'
]

function getRandomOf(arr) {
    return arr[Math.floor(Math.random() * arr.length)]   
}


// cuenta 3 veces, se resetea con el cron que tiene el host que corre este script
var recruitingMessagesCount = 0
function jobOffer() {
    if (recruitingMessagesCount < 3) {
        var prologue = getRandomOf(recruitingMessagePrologue)
        var role = getRandomOf(recruitingMessageRole)
        var skills = getRandomOf(recruitingMessageSkills)
        var techs = []
        var tc = Math.floor(Math.random()*4) + 2
        var ti = 0
        while (ti < tc) {
            var tech = getRandomOf(recruitingMessageTechnologies)
            if (techs.indexOf(tech) === -1) {
                techs.push(tech)
                ti++
            }
        }
        var hasRequi = Math.random()*10 >= .7
        var reqs = []
        var rc = Math.floor(Math.random()*3)
        var ri = 0
        while (ri < rc) {
            var req = getRandomOf(speech)
            if (req.match(/requisitos/i) && reqs.indexOf(req) === -1) {
                reqs.push(req)
                ri++
            }
        }
        reqs = reqs.map(r => r.replace(/requisitos:?\s?/i, ''))

        var benfs = []
        var bc = Math.floor(Math.random()*4) + 1
        var bi = 0
        while (bi < bc) {
            var benf = getRandomOf(speech)
            if (!benf.match(/requisitos/i) && benfs.indexOf(benf) === -1) {
                benfs.push(benf)
                bi++
            }
        }
        benfs = benfs.map(b => b.replace(/beneficios:?\s?/i, ''))

        var money = 'Remuneración: a convenir'
        var moneyUnits = [['hora', 1], ['semana', 8*5], ['mes', 8*5*4*.9], ['año', 8*5*4*12*.9]]
        if (Math.random() >= .0) {
            var mu = getRandomOf(moneyUnits)
            var usdHourlyRate = Math.floor(Math.random() * 14 + 18)
            var mcurr = Math.random() > .4 ? '$' : 'U$S'
            // si te garpan en $ asumimos un mercado local mais barato, por eso no es *15 
            var mmulti = mcurr === '$' ? 11 : 1 
            var mamount = Math.floor(mu[1] * usdHourlyRate * mmulti)
            if (mamount > 1000) {
                mamount = Math.floor((mamount / 1000)) * 1000
            }
            var msep = ['mes','año'].indexOf(mu[0]) >= 0 ? getRandomOf([' al ', ' por ']) : getRandomOf([' por ', '/']) 
            money = ['Remuneración: *' + mcurr, numberWithCommas(mamount) + msep + mu[0], '*'].join(' ')  
        } 

        var message = [
            prologue, 
            role, 
            skills,
            '\n> * ' + techs.join('\n> * '), 
            reqs.length ? ('\nRequisitos:\n> * ' + reqs.join('\n> * ')) : '',  
            '\nBeneficios:\n> * ' + benfs.join('\n> * '),
            '\n' + money
        ].join(' ')

        recruitingMessagesCount++

        return message
    }
    
}


setInterval(function () {
    var now = moment().utcOffset(-3)

    if (now.hours() === 9 && now.minutes() === 5) {
        if (now.weekday === 1) {
            var rndi = getRandomOf(goodMondayMessages)
            send(goodMondayMessages[rndi])
        }
        else {
            var rndi = getRandomOf(goodMorningMessages)
            send(goodMorningMessages[rndi])
        }  
    }

}, 1000 * 59)

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}