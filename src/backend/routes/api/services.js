const express = require("express");
const validator = require("../../lib/validator");
const jwtdecode = require("../../lib/express/jwt-decode");
const pagination = require("../../lib/express/pagination");
const internalService = require("../../internal/service");
const internalServiceWorker = require("../../internal/service_worker");
const apiValidator = require("../../lib/validator/api");

const router = express.Router({
	caseSensitive: true,
	strict: true,
	mergeParams: true,
});

/**
 * /api/services
 */
router
	.route("/")
	.options((_, res) => {
		res.sendStatus(204);
	})
	.all(jwtdecode())

	/**
	 * GET /api/services
	 *
	 * Retrieve all services
	 */
	.get(pagination("name", 0, 50, 300), (req, res, next) => {
		validator(
			{
				additionalProperties: false,
				required: ["sort"],
				properties: {
					sort: {
						$ref: "definitions#/definitions/sort",
					},
					expand: {
						$ref: "definitions#/definitions/expand",
					},
					query: {
						$ref: "definitions#/definitions/query",
					},
				},
			},
			{
				sort: req.query.sort,
				expand:
					typeof req.query.expand === "string"
						? req.query.expand.split(",")
						: null,
				query: typeof req.query.query === "string" ? req.query.query : null,
			},
		)
			.then((data) => {
				return Promise.all([
					internalService.getCount(res.locals.access, data.query),
					internalService.getAll(
						res.locals.access,
						req.query.offset,
						req.query.limit,
						data.sort,
						data.expand,
						data.query,
					),
				]);
			})
			.then((data) => {
				res.setHeader("X-Dataset-Total", data.shift());
				res.setHeader("X-Dataset-Offset", req.query.offset);
				res.setHeader("X-Dataset-Limit", req.query.limit);
				return data.shift();
			})
			.then((services) => {
				res.status(200).send(services);
			})
			.catch(next);
	})

	/**
	 * POST /api/services
	 *
	 * Create a new Service
	 */
	.post((req, res, next) => {
		apiValidator({ $ref: "endpoints/services#/links/1/schema" }, req.body)
			.then((payload) => {
				return internalService.create(res.locals.access, payload);
			})
			.then((result) => {
				res.status(201).send(result);
			})
			.catch(next);
	});

/**
 * /api/services/available
 */
router
	.route("/available")
	.options((_, res) => {
		res.sendStatus(204);
	})
	.all(jwtdecode()) // preferred so it doesn't apply to nonexistent routes

	/**
	 * GET /api/services
	 *
	 * Retrieve all services
	 */
	.get((_, res, next) => {
		internalService
			.getAvailable(res.locals.access)
			.then((services) => {
				res.status(200).send(services);
			})
			.catch(next);
	});

/**
 * /api/services/restart
 */
router
	.route("/restart")
	.options((_, res) => {
		res.sendStatus(204);
	})
	.all(jwtdecode()) // preferred so it doesn't apply to nonexistent routes

	/**
	 * GET /api/services
	 *
	 * Retrieve all services
	 */
	.post((_, res, next) => {
		res.locals.access
			.can("services")
			.then(() => {
				internalServiceWorker.restart();
				res.status(200).send(true);
			})
			.catch(next);
	});

/**
 * Specific service
 *
 * /api/services/123
 */
router
	.route("/:service_id")
	.options((_, res) => {
		res.sendStatus(204);
	})
	.all(jwtdecode()) // preferred so it doesn't apply to nonexistent routes

	/**
	 * GET /services/123
	 *
	 * Retrieve a specific service
	 */
	.get((req, res, next) => {
		validator(
			{
				required: ["service_id"],
				additionalProperties: false,
				properties: {
					service_id: {
						$ref: "definitions#/definitions/id",
					},
					expand: {
						$ref: "definitions#/definitions/expand",
					},
				},
			},
			{
				service_id: req.params.service_id,
				expand:
					typeof req.query.expand === "string"
						? req.query.expand.split(",")
						: null,
			},
		)
			.then((data) => {
				return internalService.get(res.locals.access, {
					id: data.service_id,
					expand: data.expand,
				});
			})
			.then((service) => {
				res.status(200).send(service);
			})
			.catch(next);
	})

	/**
	 * PUT /api/services/123
	 *
	 * Update and existing service
	 */
	.put((req, res, next) => {
		apiValidator({ $ref: "endpoints/services#/links/2/schema" }, req.body)
			.then((payload) => {
				payload.id = parseInt(req.params.service_id, 10);
				return internalService.update(res.locals.access, payload);
			})
			.then((result) => {
				res.status(200).send(result);
			})
			.catch(next);
	})

	/**
	 * DELETE /api/services/123
	 *
	 * Delete and existing service
	 */
	.delete((req, res, next) => {
		internalService
			.delete(res.locals.access, { id: req.params.service_id })
			.then((result) => {
				res.status(200).send(result);
			})
			.catch(next);
	});

/**
 * Specific service Test
 *
 * /api/services/123/test
 */
router
	.route("/:service_id/test")
	.options((_, res) => {
		res.sendStatus(204);
	})
	.all(jwtdecode()) // preferred so it doesn't apply to nonexistent routes

	/**
	 * POST /api/services/123
	 *
	 * Update and existing service
	 */
	.post((req, res, next) => {
		apiValidator({ $ref: "endpoints/services#/links/4/schema" }, req.body)
			.then((payload) => {
				payload.id = parseInt(req.params.service_id, 10);
				return internalService.test(res.locals.access, payload);
			})
			.then((result) => {
				res.status(200).send(result);
			})
			.catch(next);
	});

/**
 * Specific service User List
 *
 * /api/services/123/users
 */
router
	.route("/:service_id/users")
	.options((_, res) => {
		res.sendStatus(204);
	})
	.all(jwtdecode()) // preferred so it doesn't apply to nonexistent routes

	/**
	 * GET /api/services/123
	 *
	 * Update and existing service
	 */
	.get((req, res, next) => {
		const service_id = parseInt(req.params.service_id, 10);

		internalService
			.getUsers(res.locals.access, service_id)
			.then((result) => {
				res.status(200).send(result);
			})
			.catch(next);
	});

module.exports = router;
