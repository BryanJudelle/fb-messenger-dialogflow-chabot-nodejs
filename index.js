

/**
 * 
 * @author Bryan Judelle Ramos
 * 
 */

const ENV_PORT 	 = 5000
const PAGE_TOKEN = '<insert your facebook page secret token here>'
const DIALOG_FLOW_TOKEN = '<insert your dialogflow token here>';

const express 	 = require('express')
const bodyParser = require('body-parser')
const request	 = require('request')
const app 		 = express()
const apiaiApp   = require('apiai')(DIALOG_FLOW_TOKEN)

app.set('port', (process.env.PORT || 5000))

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: true}))

// parse application/json
app.use(bodyParser.json())

// index
app.get('/', (req, res) => {
	res.send('hello world i am a secret bot')
})

/**
 * 
 * @description
 * 		use for facebook verification.
 * 
 * */ 

app.get('/webhook/', (req, res) => {
	if (req.query['hub.verify_token'] === 'this_is_secret_password') {
		res.send(req.query['hub.challenge'])
	} else {
		res.send('Error, wrong token')
	}
})

app.post('/webhook/', (req, res) => {
	let messaging_events = req.body.entry[0].messaging
	for (let i = 0; i < messaging_events.length; i++) {
		let event = req.body.entry[0].messaging[i]
		let sender = event.sender.id
        
        if (event.message && event.message.text) {
			let text = event.message.text
			sendTextMessage(sender, text)
        }
        
	}
	res.sendStatus(200)
})

//dialog-flow fullfilment
app.post('/ai', (req, res) => {

	// insert your logic here
	
});

function sendTextMessage(sender, text) {

	let apiai = apiaiApp.textRequest(text, {
		sessionId: '<insert-your-dialogflow-session-id-here>'
	});

	apiai.on('response', (response) => {
		let aiText = response.result.fulfillment.speech;
		let messageData = { text: aiText }
		
		//send message into fb messenger
		request({
			url: 'https://graph.facebook.com/v2.6/me/messages',
			qs: { access_token: PAGE_TOKEN},
			method: 'POST',
			json: {
				recipient: {id:sender},
				message: messageData,
			}
		}, function(error, response, body) {
			if (error) {
				console.log('Error sending messages: ', error)
			} else if (response.body.error) {
				console.log('Error: ', response.body.error)
			}
		})
   })

	apiai.on('error', (error) => {
		console.log(error);
	});

	apiai.end();
}

/**
 * 
 * start server at specific host
 * 
 */
app.listen(app.get('port'), function() {
	console.log('running on port', app.get('port'))
})