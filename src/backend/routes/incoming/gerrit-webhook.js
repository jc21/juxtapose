'use strict';

const express               = require('express');
const validator             = require('../../lib/validator');
const jwtdecode             = require('../../lib/express/jwt-decode');
const internalGerritWebhook = require('../../internal/gerrit-webhook');

let router = express.Router({
	caseSensitive: true,
	strict:        true,
	mergeParams:   true
});

/**
 * /incoming/gerrit-webhook
 */
router
	.route('/')
	.options((req, res) => {
		res.sendStatus(204);
	})
	.all(jwtdecode())

	/**
	 * POST /incoming/gerrit-webhook
	 */
	.post((req, res, next) => {
		validator({
			additionalProperties: false,
			required:             ['token', 'webhook'],
			properties:           {
				token:   {
					$ref: 'definitions#/definitions/token'
				},
				webhook:    {
					$ref: 'definitions#/definitions/gerrit_webhook_data'
				}
			}
		}, {
			token:   typeof req.query.t !== 'undefined' ? req.query.t : null,
			webhook: req.body
		})
			.then(data => {
				return internalGerritWebhook.processIncoming(data.token, data.webhook);
			})
			.then(result => {
				res.status(200)
					.send(result);
			})
			.catch(next);
	});

module.exports = router;
