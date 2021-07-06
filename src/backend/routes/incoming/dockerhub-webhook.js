'use strict';

const express                  = require('express');
const validator                = require('../../lib/validator');
const jwtdecode                = require('../../lib/express/jwt-decode');
const internalDockerhubWebhook = require('../../internal/dockerhub-webhook');

let router = express.Router({
	caseSensitive: true,
	strict:        true,
	mergeParams:   true
});

/**
 * /incoming/dockerhub-webhook
 */
router
	.route('/')
	.options((req, res) => {
		res.sendStatus(204);
	})
	.all(jwtdecode())

	/**
	 * POST /incoming/dockerhub-webhook
	 */
	.post((req, res, next) => {
		validator({
			additionalProperties: false,
			required:             ['key', 'service_id', 'webhook'],
			properties:           {
				key:        {
					$ref: 'definitions#/definitions/token'
				},
				service_id: {
					type:    'integer',
					minumum: 1
				},
				webhook:    {
					$ref: 'definitions#/definitions/dockerhub_webhook_data'
				}
			}
		}, {
			key:        typeof req.query.k !== 'undefined' ? req.query.k : null,
			service_id: typeof req.query.s !== 'undefined' ? parseInt(req.query.s, 10) : null,
			webhook:    req.body
		})
			.then(data => {
				return internalDockerhubWebhook.processIncoming(data.service_id, data.key, data.webhook);
			})
			.then(result => {
				res.status(200)
					.send(result);
			})
			.catch(next);
	});

module.exports = router;
