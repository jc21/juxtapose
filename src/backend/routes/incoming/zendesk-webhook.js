'use strict';

const express                = require('express');
const validator              = require('../../lib/validator');
const jwtdecode              = require('../../lib/express/jwt-decode');
const internalZendeskWebhook = require('../../internal/zendesk-webhook');

let router = express.Router({
    caseSensitive: true,
    strict:        true,
    mergeParams:   true
});

/**
 * /incoming/zendesk-webhook
 */
router
    .route('/')
    .options((req, res) => {
        res.sendStatus(204);
    })
    .all(jwtdecode())

    /**
     * POST /incoming/zendesk-webhook
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
                    $ref: 'definitions#/definitions/zendesk_webhook_data'
                }
            }
        }, {
            token:   typeof req.query.t !== 'undefined' ? req.query.t : null,
            webhook: req.body
        })
            .then(data => {
                return internalZendeskWebhook.processIncoming(data.token, data.webhook);
            })
            .then(result => {
                res.status(200)
                    .send(result);
            })
            .catch(next);
    });

module.exports = router;
