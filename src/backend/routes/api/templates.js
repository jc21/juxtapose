'use strict';

const express          = require('express');
const validator        = require('../../lib/validator');
const jwtdecode        = require('../../lib/express/jwt-decode');
const pagination       = require('../../lib/express/pagination');
const internalTemplate = require('../../internal/template');
const apiValidator     = require('../../lib/validator/api');

let router = express.Router({
    caseSensitive: true,
    strict:        true,
    mergeParams:   true
});

/**
 * /api/templates
 */
router
    .route('/')
    .options((req, res) => {
        res.sendStatus(204);
    })
    .all(jwtdecode()) // preferred so it doesn't apply to nonexistent routes

    /**
     * GET /api/templates
     *
     * Retrieve all available templates
     */
    .get(pagination('name.asc', 0, 50, 300), (req, res, next) => {
        validator({
            additionalProperties: false,
            required:             ['sort'],
            properties:           {
                sort:         {
                    $ref: 'definitions#/definitions/sort'
                },
                expand:       {
                    $ref: 'definitions#/definitions/expand'
                },
                service_type: {
                    type: 'string'
                },
                event_type: {
                    type: 'string'
                }
            }
        }, {
            sort:         req.query.sort,
            expand:       (typeof req.query.expand === 'string' ? req.query.expand.split(',') : null),
            service_type: (typeof req.query.service_type === 'string' ? req.query.service_type : null),
            event_type:   (typeof req.query.event_type === 'string' ? req.query.event_type : null)
        })
            .then((data) => {
                return Promise.all([
                    internalTemplate.getCount(res.locals.access, data.service_type),
                    internalTemplate.getAll(res.locals.access, req.query.offset, req.query.limit, data.sort, data.expand, data.service_type, data.event_type)
                ]);
            })
            .then((data) => {
                res.setHeader('X-Dataset-Total', data.shift());
                res.setHeader('X-Dataset-Offset', req.query.offset);
                res.setHeader('X-Dataset-Limit', req.query.limit);
                return data.shift();
            })
            .then((templates) => {
                res.status(200)
                    .send(templates);
            })
            .catch(next);
    })

    /**
     * POST /api/tempaltes
     *
     * Create a new Template
     */
    .post((req, res, next) => {
        apiValidator({$ref: 'endpoints/templates#/links/1/schema'}, req.body)
            .then((payload) => {
                return internalTemplate.create(res.locals.access, payload);
            })
            .then((result) => {
                res.status(201)
                    .send(result);
            })
            .catch(next);
    });

/**
 * Specific Template
 *
 * /api/templates/123
 */
router
    .route('/:template_id')
    .options((req, res) => {
        res.sendStatus(204);
    })
    .all(jwtdecode()) // preferred so it doesn't apply to nonexistent routes

    /**
     * GET /templates/123
     *
     * Retrieve a specific template
     */
    .get((req, res, next) => {
        validator({
            required:             ['template_id'],
            additionalProperties: false,
            properties:           {
                template_id: {
                    $ref: 'definitions#/definitions/id'
                },
                expand:     {
                    $ref: 'definitions#/definitions/expand'
                }
            }
        }, {
            template_id: req.params.template_id,
            expand:     (typeof req.query.expand === 'string' ? req.query.expand.split(',') : null)
        })
            .then((data) => {
                return internalTemplate.get(res.locals.access, {
                    id:     data.template_id,
                    expand: data.expand
                });
            })
            .then((template) => {
                res.status(200)
                    .send(template);
            })
            .catch(next);
    })

    /**
     * PUT /api/templates/123
     *
     * Update and existing template
     */
    .put((req, res, next) => {
        apiValidator({$ref: 'endpoints/templates#/links/2/schema'}, req.body)
            .then((payload) => {
                payload.id = parseInt(req.params.template_id, 10);
                return internalTemplate.update(res.locals.access, payload);
            })
            .then((result) => {
                res.status(200)
                    .send(result);
            })
            .catch(next);
    })

    /**
     * DELETE /api/templates/123
     *
     * Delete and existing template
     */
    .delete((req, res, next) => {
        internalTemplate.delete(res.locals.access, {id: req.params.template_id})
            .then((result) => {
                res.status(200)
                    .send(result);
            })
            .catch(next);
    });

module.exports = router;
