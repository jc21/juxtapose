'use strict';

const express              = require('express');
const validator            = require('../../lib/validator');
const jwtdecode            = require('../../lib/express/jwt-decode');
const pagination           = require('../../lib/express/pagination');
const internalNotification = require('../../internal/notification');

let router = express.Router({
	caseSensitive: true,
	strict:        true,
	mergeParams:   true
});

/**
 * /api/notifications
 */
router
	.route('/')
	.options((req, res) => {
		res.sendStatus(204);
	})
	.all(jwtdecode()) // preferred so it doesn't apply to nonexistent routes

	/**
	 * GET /api/notifications
	 *
	 * Retrieve all notifications for the current user
	 */
	.get(pagination('created_on.desc', 0, 50, 300), (req, res, next) => {
		validator({
			additionalProperties: false,
			required:             ['sort'],
			properties:           {
				sort:   {
					$ref: 'definitions#/definitions/sort'
				},
				expand: {
					$ref: 'definitions#/definitions/expand'
				}
			}
		}, {
			sort:   req.query.sort,
			expand: (typeof req.query.expand === 'string' ? req.query.expand.split(',') : null)
		})
			.then((data) => {
				return Promise.all([
					internalNotification.getCount(res.locals.access),
					internalNotification.getAll(res.locals.access, req.query.offset, req.query.limit, data.sort, data.expand)
				]);
			})
			.then((data) => {
				res.setHeader('X-Dataset-Total', data.shift());
				res.setHeader('X-Dataset-Offset', req.query.offset);
				res.setHeader('X-Dataset-Limit', req.query.limit);
				return data.shift();
			})
			.then((rules) => {
				res.status(200)
					.send(rules);
			})
			.catch(next);
	});

module.exports = router;
