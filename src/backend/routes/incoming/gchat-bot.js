'use strict';

const express          = require('express');
const validator        = require('../../lib/validator');
const jwtdecode        = require('../../lib/express/jwt-decode');
const internalGchatBot = require('../../internal/gchat-bot');

let router = express.Router({
    caseSensitive: true,
    strict:        true,
    mergeParams:   true
});

/**
 * /incoming/gchat-bot
 */
router
    .route('/')
    .options((req, res) => {
        res.sendStatus(204);
    })
    .all(jwtdecode())

    /**
     * POST /incoming/gchat-bot
     *
     * Incoming endpoint for Google chat bot
     */
    .post((req, res, next) => {
        validator({
            additionalProperties: false,
            required:             ['token', 'webhook'],
            properties:           {
                token:   {
                    $ref: 'definitions#/definitions/token'
                },
                webhook: {
                    $ref: 'definitions#/definitions/gchat_bot_data'
                }
            }
        }, {
            token:   typeof req.query.t !== 'undefined' ? req.query.t : null,
            webhook: req.body
        })
            .then(data => {
                return internalGchatBot.processIncoming(data.token, data.webhook);
            })
            .then(result => {
                res.status(200)
                    .send(result);
            })
            .catch(next);
    });

module.exports = router;
