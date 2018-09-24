import { Books } from './books';
const { dialogflow, BasicCard, Suggestions } = require('actions-on-google');
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();
const fs = require('fs');
const app = dialogflow({ debug: true });
const db = admin.database();


const samConfusedMessages = [
    {
        text: 'You can ask me to tell you a bible verse, or a bible story.',
        short: 'sorry! I don\'t understand!'
    },
    {
        text: 'Could you ask differently? You can ask me to tell you a bible verse, or a bible story.',
        short: 'I\'m confused right now!'
    },
];

const samWelcomeMessages = [
    {
        text: 'You can ask me to tell you a bible verse, or a bible story.',
        short: ' Hi, I\'m Word Fire!'
    },
    {
        short: ' It\'s Word time!',
        text: 'You can ask me to tell you a bible verse, or a bible story.'
    },
];

const samGiveUpMessages = [
    {
        short: 'Sorry, I am not getting you.',
        text: 'I\'m going to take a nap. See you next time!',
    }
];

function pickRandomMessage(messages) {
    return messages[Math.floor(Math.random() * messages.length)];
}

let booksObject;
app.intent('read-scripture', (conv, { book, chapter, verse }) => {
     booksObject = JSON.parse(fs.readFileSync(`${__dirname}/books.json`));

    const word = (booksObject as Books).keys.find(bok => bok.n === book);

    return db.ref()
        .child(`${word.b}/${chapter}/${verse}`)
        .once('value')
        .then(function (snapshot) {
            const info = snapshot.val();

            conv.ask(new Suggestions(['next verse', 'Joshua 1:8', 'Genesis 2 9 to 11', 'Prodigal Son']));

            conv.ask(`<speak>${book} chapter ${chapter} verse ${verse}. ${info}</speak>`);
        });
});

app.middleware((conv) => {
    conv.hasScreen = conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT');
    conv.hasAudioPlayback = conv.surface.capabilities.has('actions.capability.AUDIO_OUTPUT');
    conv.hasMediaPlayback = conv.surface.capabilities.has('actions.capability.MEDIA_RESPONSE_AUDIO');
    conv.hasWebBroswer = conv.surface.capabilities.has('actions.capability.WEB_BROWSER');
});

app.fallback((conv) => {
    console.log('Fallback');
    conv.ask(new Suggestions(['Joshua 1 8', 'Genesis 2 9', 'Prodigal Son']));

    const msg = pickRandomMessage(samWelcomeMessages);

    conv.ask(`<speak>${msg.short}</speak>`);
    if (conv.hasScreen) {
                conv.ask(new BasicCard({
                    title: msg.short,
                    text: msg.text,
                }));
            }
});

app.intent('Default Fallback Intent', (conv) => {
    console.log('Default fallback intent');
    conv.data.fallbackCount++;
    conv.ask(new Suggestions(['Joshua 1 8', 'Genesis 2 9', 'Prodigal Son']));
    if (conv.data.fallbackCount < 3) {
        const msg = pickRandomMessage(samConfusedMessages);
        conv.ask(`<speak>${msg.short}</speak>`);
            if (conv.hasScreen) {
                conv.ask(new BasicCard({
                    title: msg.short,
                    text: msg.text,
                }));
            }
    } else {
        const msg = pickRandomMessage(samGiveUpMessages);
        conv.ask(`<speak>${msg.short}</speak>`);
        if (conv.hasScreen) {
            conv.ask(new BasicCard({
                title: msg.short,
                text: msg.text,
            }));
        }
        conv.close();
    }
});

app.intent('Default Welcome Intent', (conv) => {
    console.log('Default Welcome Intent');
    conv.data.fallbackCount = 0;
    conv.ask(new Suggestions(['Joshua 1 8', 'Genesis 2 9', 'Prodigal Son']));
    const msg = pickRandomMessage(samWelcomeMessages);
    conv.ask(`<speak>${msg.short}</speak>`);
    if (conv.hasScreen) {
        conv.ask(new BasicCard({
            title: msg.short,
            text: msg.text,
        }));
    }});


exports.dialogflowFirebaseFulfillment = functions.https.onRequest(app);

