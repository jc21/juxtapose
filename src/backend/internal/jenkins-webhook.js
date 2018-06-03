'use strict';

const _                       = require('lodash');
const config                  = require('config');
const batchflow               = require('batchflow');
const logger                  = require('../logger').jenkins;
const serviceModel            = require('../models/service');
const ruleModel               = require('../models/rule');
const templateRender          = require('../lib/template_render');
const notificationQueueModel  = require('../models/notification_queue');
const jenkinsIncomingLogModel = require('../models/jenkins_incoming_log');
const jwt                     = require('jsonwebtoken');
const error                   = require('../lib/error');
const ALGO                    = 'RS256';

let public_key = null;

const internalJenkinsWebhook = {

    /**
     * Router use
     *
     * @param   {String}  token
     * @param   {Object}  webhook_data
     * @param   {String}  webhook_data.event
     * @param   {Object}  webhook_data.project
     * @param   {Object}  webhook_data.build
     * @returns {Promise}
     */
    processIncoming: (token, webhook_data) => {
        public_key = config.get('jwt.pub');

        // 1. Verify Token
        return internalJenkinsWebhook.verifyToken(token)
            .then(token_data => {
                // 2. Make sure service still exists
                return serviceModel
                    .query()
                    .where('is_deleted', 0)
                    .andWhere('id', token_data.s)
                    .andWhere('type', 'jenkins-webhook')
                    .first()
                    .then(service => {
                        // 3. Validate service with token validation key
                        if (service && service.data && service.data.validation_key === token_data.k) {
                            return service;
                        } else {
                            throw new Error('Invalid Service');
                        }
                    })
                    // 4. Save data for debugging
                    .then(service => {
                        logger.info('❯ Incoming Webhook for Service #' + service.id + ': ' + service.name);
                        return jenkinsIncomingLogModel
                            .query()
                            .insert({
                                service_id: service.id,
                                data:       webhook_data
                            })
                            .then(log_row => {
                                logger.info('  ❯ Saved in log table as ID #' + log_row.id);
                                return service;
                            });
                    })
                    // 5. Prune log table
                    .then(service => {
                        return jenkinsIncomingLogModel
                            .query()
                            .delete()
                            .where(jenkinsIncomingLogModel.raw('`created_on` < DATE_SUB(DATE(NOW()), INTERVAL 2 DAY)'))
                            .then(() => {
                                return service;
                            });
                    })
                    // 6. Process webhook
                    .then(service => {
                        return internalJenkinsWebhook.process(service.id, webhook_data);
                    });
            })
            .catch(err => {
                logger.error(err, webhook_data);
                throw err;
            });
    },

    /**
     * Internal use
     * Verifies the incoming endpoint token
     *
     * @param   {String}  token
     * @returns {Promise}
     */
    verifyToken: token => {
        return new Promise((resolve, reject) => {
            try {
                if (!token || token === null || token === 'null') {
                    reject(new Error('Empty token'));
                } else {
                    jwt.verify(token, public_key, {ignoreExpiration: true, algorithms: [ALGO]}, (err, token_data) => {
                        if (err) {
                            if (err.name === 'TokenExpiredError') {
                                reject(new error.AuthError('Token has expired', err));
                            } else {
                                reject(err);
                            }
                        } else {
                            resolve(token_data);
                        }
                    });
                }
            } catch (err) {
                reject(err);
            }
        });
    },

    /**
     * Internal use
     * First method to handle webhook data processing
     *
     * @param   {Integer} service_id
     * @param   {Object}  webhook_data
     * @param   {String}  webhook_data.event
     * @param   {Object}  webhook_data.project
     * @param   {Object}  webhook_data.build
     * @returns {Promise|Object}
     */
    process: (service_id, webhook_data) => {
        if (typeof webhook_data.build === 'object') {
            logger.info('  ❯ Project:                           ', webhook_data.project.full_name);

            let event_types = [['build_' + webhook_data.event]];

            if (event_types.length) {
                return new Promise((resolve, reject) => {
                    let already_notified_user_ids = [];

                    batchflow(event_types).sequential()
                        .each((i, event_type, next) => {
                            internalJenkinsWebhook.processTheseEventTypes(event_type, service_id, webhook_data, already_notified_user_ids)
                                .then(notified_user_ids => {
                                    if (notified_user_ids && notified_user_ids.length) {
                                        already_notified_user_ids = _.concat(already_notified_user_ids, notified_user_ids);

                                        // Remove falsy items from the array:
                                        already_notified_user_ids = _.compact(already_notified_user_ids);
                                    }

                                    next(notified_user_ids.length);
                                })
                                .catch(err => {
                                    console.error(err.message);
                                    next(err);
                                });
                        })
                        .error(err => {
                            reject(err);
                        })
                        .end(results => {
                            let total = 0;

                            _.map(results, (this_count) => {
                                total += this_count;
                            });

                            // Returns a total count of the notifications queued
                            resolve({notifications: total});
                        });
                });
            }
        }

        return {
            error: 'Unsupported payload'
        };
    },

    /**
     * @param   {Array}   event_types
     * @param   {Integer} service_id
     * @param   {Object}  webhook_data
     * @param   {String}  webhook_data.event
     * @param   {Object}  webhook_data.project
     * @param   {Object}  webhook_data.build
     * @param   {Array}   already_notified_user_ids
     * @returns {Promise}
     */
    processTheseEventTypes: (event_types, service_id, webhook_data, already_notified_user_ids) => {
        let template_data = _.assign({service_id: service_id}, internalJenkinsWebhook.getCommonTemplateData(webhook_data));

        return new Promise((resolve, reject) => {
            batchflow(event_types).sequential()
                .each((i, event_type, next) => {
                    internalJenkinsWebhook.processRules(event_type, template_data, webhook_data, already_notified_user_ids)
                        .then(notified_user_ids => {
                            if (notified_user_ids && notified_user_ids.length) {
                                already_notified_user_ids = _.concat(already_notified_user_ids, notified_user_ids);
                                already_notified_user_ids = _.compact(already_notified_user_ids);
                            }

                            next();
                        })
                        .catch(err => {
                            console.error(err);
                            next();
                        });
                })
                .error(err => {
                    reject(err);
                })
                .end(() => {
                    resolve(already_notified_user_ids);
                });
        });
    },

    /**
     * @param   {Object}  webhook_data
     * @param   {String}  webhook_data.event
     * @param   {Object}  webhook_data.project
     * @param   {Object}  webhook_data.build
     * @returns {Object}
     */
    getCommonTemplateData: webhook_data => {
        // change the log to a full string
        webhook_data.build.log             = webhook_data.build.log.join('\n');
        webhook_data.build.duration_string = webhook_data.build.duration_string.replace(' and counting', '');
        return webhook_data;
    },

    /**
     * @param   {Object}  conditions
     * @param   {Object}  webhook_data
     * @param   {Object}  webhook_data.push_data
     * @param   {Object}  webhook_data.repository
     * @returns {Boolean}
     */
    extraConditionsMatch: (conditions, webhook_data) => {
        // default or no conditions means it's ok to go through
        let is_ok = true;
        /*
                if (conditions !== {}) {
                    _.map(conditions, (value, name) => {
                        switch (name) {
                            case 'repo':
                                let repo = webhook_data.repository.repo_name;
                                if (repo && repo !== value) {
                                    // Repo key doesn't match
                                    is_ok = false;
                                }
                                break;
                            case 'tag':
                                let tag = webhook_data.push_data.tag;
                                if (tag && tag !== value) {
                                    // Tag doesn't match
                                    is_ok = false;
                                }
                                break;
                        }
                    });
                }
        */
        return is_ok;
    },

    /**
     * @param   {String}  event_type
     * @param   {Object}  data
     * @param   {Integer} data.service_id
     * @param   {Object}  webhook_data
     * @param   {String}  webhook_data.event
     * @param   {Object}  webhook_data.project
     * @param   {Object}  webhook_data.build
     * @param   {Array}   already_notified_user_ids
     * @returns {Promise} with array of user_ids who have been notified, so that they don't get notified again
     */
    processRules: (event_type, data, webhook_data, already_notified_user_ids) => {
        already_notified_user_ids = already_notified_user_ids || [];

        logger.info('  ❯ Processing Rules for:           ', event_type);

        // This complex query should only get the rules for users
        // where a notification hasn't already been sent to a user for this webhook

        let query = ruleModel
            .query()
            .select('rule.*')
            .where('rule.is_deleted', 0)
            .andWhere('rule.in_service_id', data.service_id)
            .andWhere('rule.trigger', event_type)
            .eager('[template, in_service_data]')
            .orderBy('rule.priority_order');

        if (already_notified_user_ids.length) {
            query.whereNotIn('rule.user_id', already_notified_user_ids);
        }

        let this_already_notified_user_ids = [];

        return query
            .then(rules => {
                return new Promise((resolve, reject) => {
                    batchflow(rules).sequential()
                        .each((i, rule, next) => {
                            logger.info('    ❯ Processing Rule #' + rule.id);

                            if (this_already_notified_user_ids.indexOf(rule.id) !== -1) {
                                logger.info('      ❯ We have already processed a notification for this user_id:', rule.user_id);
                                next(0);
                            } else if (!internalJenkinsWebhook.extraConditionsMatch(rule.extra_conditions, webhook_data)) {
                                // extra conditions don't match the event
                                logger.info('      ❯ Extra conditions do not match');
                                next(0);
                            } else {

                                // Debugging data in the payload
                                let debug_data = {
                                    _event_type:  event_type,
                                    _rule_id:     rule.id,
                                    _template_id: rule.out_template_id
                                };

                                templateRender(rule.template.content, _.assign({}, rule.template.default_options, rule.out_template_options, data, debug_data), rule.template.render_engine)
                                    .then(content => {
                                        return {
                                            user_id:    rule.user_id,
                                            rule_id:    rule.id,
                                            service_id: rule.out_service_id,
                                            content:    content,
                                            status:     'ready'
                                        };
                                    })
                                    .then(notification_data => {
                                        return notificationQueueModel
                                            .query()
                                            .insert(notification_data);
                                    })
                                    .then(() => {
                                        logger.info('      ❯ Notification queue item added');
                                        this_already_notified_user_ids.push(rule.user_id);

                                    })
                                    .then(() => {
                                        // Update rule fire count
                                        return ruleModel
                                            .query()
                                            .where('id', rule.id)
                                            .increment('fired_count', 1);
                                    })
                                    .then(() => {
                                        next(rule.user_id);
                                    });
                            }
                        })
                        .error(err => {
                            reject(err);
                        })
                        .end(() => {
                            logger.info('    ❯ Done processing Rules for:    ', event_type);
                            resolve(this_already_notified_user_ids);
                        });
                });
            });
    }
};

module.exports = internalJenkinsWebhook;
