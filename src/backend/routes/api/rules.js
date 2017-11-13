'use strict';

const express      = require('express');
const validator    = require('../../lib/validator');
const jwtdecode    = require('../../lib/express/jwt-decode');
const pagination   = require('../../lib/express/pagination');
const internalRule = require('../../internal/rule');
const apiValidator = require('../../lib/validator/api');

let router = express.Router({
    caseSensitive: true,
    strict:        true,
    mergeParams:   true
});

/**
 * /api/rules
 */
router
    .route('/')
    .options((req, res) => {
        res.sendStatus(204);
    })
    .all(jwtdecode()) // preferred so it doesn't apply to nonexistent routes

    /**
     * GET /api/rules
     *
     * Retrieve all rules for the current user
     */
    .get(pagination('priority_order.asc', 0, 50, 300), (req, res, next) => {
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
                    internalRule.getCount(res.locals.access),
                    internalRule.getAll(res.locals.access, req.query.offset, req.query.limit, data.sort, data.expand)
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
    })

    /**
     * POST /api/rules
     *
     * Create a new Rule
     */
    .post((req, res, next) => {
        apiValidator({$ref: 'endpoints/rules#/links/1/schema'}, req.body)
            .then((payload) => {
                return internalRule.create(res.locals.access, payload);
            })
            .then((result) => {
                res.status(201)
                    .send(result);
            })
            .catch(next);
    });

/**
 * Order the rules
 *
 * /api/rules/order
 */
router
    .route('/order')
    .options((req, res) => {
        res.sendStatus(204);
    })
    .all(jwtdecode()) // preferred so it doesn't apply to nonexistent routes

    /**
     * POST /api/rules/order
     *
     * Set the rules order
     */
    .post((req, res, next) => {
        apiValidator({$ref: 'endpoints/rules#/links/4/schema'}, req.body)
            .then((payload) => {
                return internalRule.setOrder(res.locals.access, payload);
            })
            .then((result) => {
                res.status(200)
                    .send(result);
            })
            .catch(next);
    });

/**
 * Specific Rule
 *
 * /api/rules/123
 */
router
    .route('/:rule_id')
    .options((req, res) => {
        res.sendStatus(204);
    })
    .all(jwtdecode()) // preferred so it doesn't apply to nonexistent routes

    /**
     * GET /rules/123
     *
     * Retrieve a specific Rule
     */
    .get((req, res, next) => {
        validator({
            required:             ['rule_id'],
            additionalProperties: false,
            properties:           {
                rule_id: {
                    $ref: 'definitions#/definitions/id'
                },
                expand:  {
                    $ref: 'definitions#/definitions/expand'
                }
            }
        }, {
            rule_id: req.params.rule_id,
            expand:  (typeof req.query.expand === 'string' ? req.query.expand.split(',') : null)
        })
            .then((data) => {
                return internalRule.get(res.locals.access, {
                    id:     data.rule_id,
                    expand: data.expand
                });
            })
            .then((rule) => {
                res.status(200)
                    .send(rule);
            })
            .catch(next);
    })

    /**
     * PUT /api/rules/123
     *
     * Update and existing Rule
     */
    .put((req, res, next) => {
        apiValidator({$ref: 'endpoints/rules#/links/2/schema'}, req.body)
            .then((payload) => {
                payload.id = parseInt(req.params.rule_id, 10);
                return internalRule.update(res.locals.access, payload);
            })
            .then((result) => {
                res.status(200)
                    .send(result);
            })
            .catch(next);
    })

    /**
     * DELETE /api/rules/123
     *
     * Delete and existing Rule
     */
    .delete((req, res, next) => {
        internalRule.delete(res.locals.access, {id: req.params.rule_id})
            .then((result) => {
                res.status(200)
                    .send(result);
            })
            .catch(next);
    });

module.exports = router;
