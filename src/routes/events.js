const APP = process.env.APP || 'DEFAULT';

const express = require('express');
const { v1 } = require('uuid');

const { EventHandler } = require('../services/events')

const router = express.Router();
const eventHandler = new EventHandler();

router.use((req, res, next) => {
    console.log(`[DEBUG] ${new Date().toISOString()} ${APP} ROUTE_ ${req.method} /events${req.path}`);
    next();
});

router.get('/', (req, res) => {
    res.send({
        status: true,
        message: `${APP} /events is available`
    })
});

router.post('/smartapi-service/:id/:action', (req, res) => {
    let event = {
        uuid: v1(),
        ts: new Date().toISOString(),
        source: 'events-engine',
        target: 'smartapi-service',
        action: req.params.action,
        clientcode: req.params.id,
        inputs: req.body,
    };

    eventHandler.dispatch(
        event,
        (flag) => res.send({status: flag, ...event})
    )
});

router.post('/:target/:action', (req, res) => {
    let event = {
        uuid: v1(),
        ts: new Date().toISOString(),
        source: 'events-engine',
        target: req.params.target,
        action: req.target.action,
        clientcode: req.params.id,
        inputs: req.body,
    };
    
    eventHandler.dispatch(
        event,
        (flag) => res.send({status: flag, ...event})
    )
});

module.exports = router