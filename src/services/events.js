const APP = process.env.APP || 'EVENTS';
const AMQP_URI = process.env.AMQP_URI || 'amqp://localhost:5672';
const DEFAULT_CHANNEL = process.env.DEFAULT_CHANNEL || 'smartapi-events';
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';

const amqplib = require('amqplib');
const { MongoClient } = require('mongodb')  ;

class EventHandler {
    mqo;
    dbo;

    constructor() {
        amqplib.connect(AMQP_URI)
            .then((conn) => {
                console.log(`[INFO_] ${new Date().toISOString()} ${APP} EVENTS AMQP connected`);
                this.mqo = conn;

                return MongoClient.connect(MONGO_URI)
            })
            .then(client => {
                console.log(`[INFO_] ${new Date().toISOString()} ${APP} EVENTS MONGO connected`);
                this.dbo = client.db('horizons')
            })
            .catch(err => console.log(`[WARN_] ${new Date().toISOString()} ${APP} EVENTS AMQP bootstrap failed ${JSON.stringify(err)}`))
    }

    dispatch(event, callback) {
        switch (event.target) {
            case 'smartapi-service':
                this.dispatchToSmartApiService(event, flag => callback(flag))
            break;
            default:
                console.log(`[WARN_] ${new Date().toISOString()} ${APP} EVENTS DISPA ${event.target} not found`);
                callback(false);
        }
    };

    dispatchToSmartApiService(event, callback) {
        let allowedActions = ['login', 'refresh', 'profile', 'logout', 'getdata', 'getltpdata', 'gettradebook', 
                            'placeorder', 'modifyorder', 'cancelorder', 'getholding', 'getposition'];

        if (allowedActions.includes(event.action)) this.pushToQueue(event, flag => callback(flag))
        else {
            console.log(`[WARN_] ${new Date().toISOString()} ${APP} DISPA_ SMARTA ${event.action} action not found`);
            callback(false);
        }
    }

    pushToQueue(payload, callback) {
        console.log(`[DEBUG] ${new Date().toISOString()} ${APP} EVENTS PUSHQ ${JSON.stringify(payload)}`);
        this.mqo.createChannel()
            .then(ch => {
                ch.assertQueue(DEFAULT_CHANNEL)
                .then(() => ch.sendToQueue(DEFAULT_CHANNEL, Buffer.from(JSON.stringify(payload))))
                .then(() => ch.close())
                .catch(err => console.log(`[INFO_] ${new Date().toISOString()} ${APP} SMARTA AMQPU message error`))

                return this.dbo.collection('events').insertOne(payload);
            })
            .then((result) => {
                console.log(`[DEBUG_] ${new Date().toISOString()} ${APP} DISPA_ PUSHQ db update ${JSON.stringify(result)}`);
                callback(true)
            })
            .catch(err => {
                console.log(`[WARN_] ${new Date().toISOString()} ${APP} EVENTS PUSHQ failed ${err}`);
                callback(false)
            })
    }
}

module.exports = {
    EventHandler
}