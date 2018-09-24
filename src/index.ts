import { Books } from './books';
import { msgs_welcome, msgs_confused, msgs_stop } from './data';
const { dialogflow, BasicCard, Suggestions } = require('actions-on-google');
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();
const fs = require('fs');
const app = dialogflow({ debug: true });
const db = admin.database();

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

    const msg = pickRandomMessage(msgs_welcome);

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
        const msg = pickRandomMessage(msgs_confused);
        conv.ask(`<speak>${msg.short}</speak>`);
            if (conv.hasScreen) {
                conv.ask(new BasicCard({
                    title: msg.short,
                    text: msg.text,
                }));
            }
    } else {
        const msg = pickRandomMessage(msgs_stop);
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
    const msg = pickRandomMessage(msgs_welcome);
    conv.ask(`<speak>${msg.short}</speak>`);
    if (conv.hasScreen) {
        conv.ask(new BasicCard({
            title: msg.short,
            text: msg.text,
        }));
    }});


exports.dialogflowFirebaseFulfillment = functions.https.onRequest(app);

