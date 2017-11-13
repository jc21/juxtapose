'use strict';

const _                         = require('lodash');
const config                    = require('config');
const batchflow                 = require('batchflow');
const logger                    = require('../logger');
const error                     = require('../lib/error');
const serviceModel              = require('../models/service');
const jwt                       = require('jsonwebtoken');
const ruleModel                 = require('../models/rule');
const templateRender            = require('../lib/template_render');
const notificationQueueModel    = require('../models/notification_queue');
const bitbucketIncomingLogModel = require('../models/bitbucket_incoming_log');
const ALGO                      = 'RS256';

let public_key = null;

const internalBitbucketWebhook = {

    /**
     * Router use
     *
     * @param   {String}  token
     * @param   {Object}  webhook_data
     * @param   {String}  webhook_data.eventKey
     * @param   {Object}  webhook_data.actor
     * @param   {Object}  webhook_data.pullRequest
     * @returns {Promise}
     */
    processIncoming: (token, webhook_data) => {
        public_key = config.get('jwt.pub');

        // 1. Verify Token
        return internalBitbucketWebhook.verifyToken(token)
            .then(token_data => {
                // 2. Make sure service still exists
                return serviceModel
                    .query()
                    .where('is_deleted', 0)
                    .andWhere('id', token_data.s)
                    .andWhere('type', 'bitbucket-webhook')
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
                        logger.bitbucket_webhook('❯ Incoming Webhook for Service #' + service.id + ': ' + service.name);
                        return bitbucketIncomingLogModel
                            .query()
                            .insert({
                                service_id: service.id,
                                data:       webhook_data
                            })
                            .then(log_row => {
                                logger.bitbucket_webhook('  ❯ Saved in log table as ID #' + log_row.id);
                                return service;
                            });
                    })
                    // 5. Prune log table
                    .then(service => {
                        return bitbucketIncomingLogModel
                            .query()
                            .delete()
                            .where(bitbucketIncomingLogModel.raw('`created_on` < DATE_SUB(DATE(NOW()), INTERVAL 2 DAY)'))
                            .then(() => {
                                return service;
                            });
                    })
                    // 6. Process webhook
                    .then(service => {
                        return internalBitbucketWebhook.process(service.id, webhook_data);
                    });
            });
    },

    /**
     * Internal use
     * Verifies the incoming endpoint token
     *
     * @param   {String}  token
     * @returns {Promise}
     */
    verifyToken: (token) => {
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
     * @param   {String}  webhook_data.eventKey
     * @param   {Object}  webhook_data.actor
     * @param   {Object}  webhook_data.pullRequest
     * @returns {Promise|Object}
     */
    process: (service_id, webhook_data) => {
        if (typeof webhook_data.eventKey === 'string') {
            logger.bitbucket_webhook('  ❯ Event:                          ', webhook_data.eventKey);
            logger.bitbucket_webhook('  ❯ From:                           ', internalBitbucketWebhook.getFromProjectField(webhook_data, 'key') + '/' + internalBitbucketWebhook.getFromRepoField(webhook_data, 'slug'));
            logger.bitbucket_webhook('  ❯ To:                             ', internalBitbucketWebhook.getToProjectField(webhook_data, 'key') + '/' + internalBitbucketWebhook.getToRepoField(webhook_data, 'slug'));
            logger.bitbucket_webhook('  ❯ Title:                          ', internalBitbucketWebhook.getPrField(webhook_data, 'title'));
            logger.bitbucket_webhook('  ❯ PR State:                       ', internalBitbucketWebhook.getPrField(webhook_data, 'state'));
            logger.bitbucket_webhook('  ❯ PR Owner:                       ', internalBitbucketWebhook.getPrOwner(webhook_data, 'displayName'));

            let process_promises = [];

            switch (webhook_data.eventKey) {
                case 'pr:opened':
                    process_promises.push(internalBitbucketWebhook.processPrOpened);
                    break;
                /*
                                case 'jira:issue_updated':
                                    process_promises.push(internalBitbucketWebhook.processIssueUpdated);
                                    break;
                */
            }

            if (process_promises.length) {
                return new Promise((resolve, reject) => {
                    let already_notified_user_ids = [];

                    batchflow(process_promises).sequential()
                        .each((i, process_promise, next) => {
                            process_promise(service_id, webhook_data, already_notified_user_ids)
                                .then(notified_user_ids => {
                                    if (notified_user_ids && notified_user_ids.length) {
                                        already_notified_user_ids = _.concat(already_notified_user_ids, notified_user_ids);

                                        // Remove falsy items from the array:
                                        already_notified_user_ids = _.compact(already_notified_user_ids);
                                    }

                                    next(notified_user_ids.length);
                                })
                                .catch((err) => {
                                    console.error(err.message);
                                    next(err);
                                });
                        })
                        .error((err) => {
                            reject(err);
                        })
                        .end((results) => {
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
            error: 'Unsupported event: ' + webhook_data.eventKey
        };
    },

    /**
     * pr:opened
     *
     * Valid event types are:
     *
     * pr_review_requested
     * pr_opened
     *
     * @param   {Integer} service_id
     * @param   {Object}  webhook_data
     * @param   {String}  webhook_data.eventKey
     * @param   {Object}  webhook_data.actor
     * @param   {Object}  webhook_data.pullRequest
     * @param   {Array}   already_notified_user_ids
     * @returns {Promise|Boolean}
     */
    processPrOpened: (service_id, webhook_data, already_notified_user_ids) => {
        let event_types = [];

        event_types.push('pr_review_requested');
        event_types.push('pr_opened');

        let template_data = _.assign({service_id: service_id}, internalBitbucketWebhook.getCommonTemplateData(webhook_data));

        return new Promise((resolve, reject) => {
            batchflow(event_types).sequential()
                .each((i, event_type, next) => {
                    internalBitbucketWebhook.processRules(event_type, template_data, webhook_data, already_notified_user_ids)
                        .then(notified_user_ids => {
                            if (notified_user_ids && notified_user_ids.length) {
                                already_notified_user_ids = _.concat(already_notified_user_ids, notified_user_ids);
                                already_notified_user_ids = _.compact(already_notified_user_ids);
                            }

                            next();
                        })
                        .catch((err) => {
                            console.error(err);
                            next();
                        });
                })
                .error((err) => {
                    reject(err);
                })
                .end((results) => {
                    resolve(already_notified_user_ids);
                });
        });
    },

    /**
     * @param   {Object}  webhook_data
     * @param   {Object}  webhook_data.pullRequest
     * @param   {String}  field_name
     * @param   {String}  [subfield_name]
     * @returns {*}
     */
    getPrField: (webhook_data, field_name, subfield_name) => {
        if (typeof webhook_data.pullRequest !== 'undefined' &&
            typeof webhook_data.pullRequest[field_name] !== 'undefined') {

            let val = webhook_data.pullRequest[field_name];

            if (typeof subfield_name !== 'undefined') {
                if (typeof val[subfield_name] !== 'undefined') {
                    return val[subfield_name];
                } else {
                    return null;
                }
            }

            return val;
        }

        return null;
    },

    /**
     * @param   {Object}  webhook_data
     * @param   {Object}  webhook_data.pullRequest
     * @param   {String}  field
     * @returns {String|undefined}
     */
    getFromRefField: (webhook_data, field) => {
        let toRef = internalBitbucketWebhook.getPrField(webhook_data, 'fromRef');

        if (toRef && typeof toRef[field] !== 'undefined') {
            return toRef[field];
        }

        return undefined;
    },

    /**
     * @param   {Object}  webhook_data
     * @param   {Object}  webhook_data.pullRequest
     * @param   {String}  field
     * @returns {String}
     */
    getFromRepoField: (webhook_data, field) => {
        let repository = internalBitbucketWebhook.getFromRefField(webhook_data, 'repository');

        if (repository && typeof repository[field] !== 'undefined') {
            return repository[field];
        }

        return '';
    },

    /**
     * @param   {Object}  webhook_data
     * @param   {Object}  webhook_data.pullRequest
     * @param   {String}  field
     * @returns {String}
     */
    getFromProjectField: (webhook_data, field) => {
        let project = internalBitbucketWebhook.getFromRepoField(webhook_data, 'project');

        if (project && typeof project[field] !== 'undefined') {
            return project[field];
        }

        return '';
    },

    /**
     * @param   {Object}  webhook_data
     * @param   {Object}  webhook_data.pullRequest
     * @param   {String}  field
     * @returns {String|undefined}
     */
    getToRefField: (webhook_data, field) => {
        let toRef = internalBitbucketWebhook.getPrField(webhook_data, 'toRef');

        if (toRef && typeof toRef[field] !== 'undefined') {
            return toRef[field];
        }

        return undefined;
    },

    /**
     * @param   {Object}  webhook_data
     * @param   {Object}  webhook_data.pullRequest
     * @param   {String}  field
     * @returns {String}
     */
    getToRepoField: (webhook_data, field) => {
        let repository = internalBitbucketWebhook.getToRefField(webhook_data, 'repository');
        if (repository && typeof repository[field] !== 'undefined') {
            return repository[field];
        }

        return '';
    },

    /**
     * @param   {Object}  webhook_data
     * @param   {Object}  webhook_data.pullRequest
     * @param   {String}  field
     * @returns {String}
     */
    getToProjectField: (webhook_data, field) => {
        let project = internalBitbucketWebhook.getToRepoField(webhook_data, 'project');

        if (project && typeof project[field] !== 'undefined') {
            return project[field];
        }

        return '';
    },

    /**
     * @param   {Object}  webhook_data
     * @param   {Object}  webhook_data.pullRequest
     * @param   {String}  field
     * @returns {String}
     */
    getPrOwner: (webhook_data, field) => {
        let author = internalBitbucketWebhook.getPrField(webhook_data, 'author');

        if (author && typeof author.user !== 'undefined' && typeof author.user[field] !== 'undefined') {
            return author.user[field];
        }

        return '';
    },

    /**
     * @param   {Object}  webhook_data
     * @param   {Object}  webhook_data.pullRequest
     * @returns {Object}
     */
    getCommonTemplateData: (webhook_data) => {
        return {
            user:        internalBitbucketWebhook.getPrOwner(webhook_data, 'displayName'),
            prurl:       'http://TODO',
            title:       internalBitbucketWebhook.getPrField(webhook_data, 'title'),
            description: internalBitbucketWebhook.getPrField(webhook_data, 'description'),
            project:     internalBitbucketWebhook.getToProjectField(webhook_data, 'key'),
            repo:        internalBitbucketWebhook.getToRepoField(webhook_data, 'slug'),
            branch:      internalBitbucketWebhook.getToRefField(webhook_data, 'displayId'),
            from:        {
                project: internalBitbucketWebhook.getFromProjectField(webhook_data, 'key'),
                repo:    internalBitbucketWebhook.getFromRepoField(webhook_data, 'slug'),
                branch:  internalBitbucketWebhook.getFromRefField(webhook_data, 'displayId')
            }
        };
    },

    /**
     * @param   {Object}  webhook_data
     * @param   {Object}  webhook_data.actor
     * @param   {Object}  webhook_data.pullRequest
     * @param   {String}  [field]    Defaults to 'name'
     * @returns {*}
     */
    getEventUser: (webhook_data, field) => {
        if (typeof webhook_data.actor !== 'undefined' &&
            typeof webhook_data.actor[field || 'name'] !== 'undefined') {
            return webhook_data.actor[field || 'name'];
        }

        return null;
    },

    /**
     *
     * @param   {Object}  webhook_data
     * @param   {Object}  webhook_data.pullRequest
     * @returns {Array}
     */
    getReviewers: (webhook_data) => {
        let reviewers = [];

        let data = internalBitbucketWebhook.getPrField(webhook_data, 'reviewers');

        if (typeof data !== 'undefined' && data.length) {
            _.map(data, function (reviewer) {
                if (typeof reviewer.user !== 'undefined' && reviewer.role === 'REVIEWER') {
                    reviewers.push(reviewer.user.name);
                }
            });
        }

        return _.uniq(reviewers);
    },

    /**
     * Note, the following events are not handled because they are known not to have a destination user:
     * - pr_opened
     * - pr_merged
     *
     * @param   {String}  event_type
     * @param   {Object}  webhook_data
     * @param   {Object}  webhook_data.pullRequest
     * @returns {String|Array}
     */
    getIncomingServiceUsernameBasedOnEvent: (event_type, webhook_data) => {
        switch (event_type) {
            case 'my_pr_approved':
            case 'my_pr_needs_work':
            case 'my_pr_merged':
            case 'my_pr_declined':
            case 'my_pr_deleted':
            case 'my_pr_comment':
                return internalBitbucketWebhook.getPrOwner(webhook_data, 'name');
                break;

            case 'pr_review_requested':
                // Compile a list of users who are in the reviewers
                return internalBitbucketWebhook.getReviewers(webhook_data);
                break;

            default:
                return null;
                break;
        }
    },

    /**
     * @param   {Object}  conditions
     * @param   {Object}  webhook_data
     * @param   {Object}  webhook_data.pullRequest
     * @returns {Boolean}
     */
    extraConditionsMatch: (conditions, webhook_data) => {
        // default or no conditions means it's ok to go through
        let is_ok = true;

        if (conditions !== {}) {
            _.map(conditions, (value, name) => {
                switch (name) {
                    case 'project':
                        let project = internalBitbucketWebhook.getToProjectField(webhook_data, 'key');
                        if (project && project !== value) {
                            // Project key doesn't match
                            is_ok = false;
                        }
                        break;
                    case 'repo':
                        let repo = internalBitbucketWebhook.getToRepoField(webhook_data, 'slug');
                        if (repo && repo !== value) {
                            // Repo doesn't match
                            is_ok = false;
                        }
                        break;
                }
            });
        }

        return is_ok;
    },

    /**
     * @param   {Object}  webhook_data
     * @param   {Object}  webhook_data.pullRequest
     * @param   {Object}  base_url
     * @returns {String}
     */
    getPrUrl: (webhook_data, base_url) => {
        // https://stash.vision6.com.au/projects/V6/repos/businessbuilder/pull-requests/7540
        return base_url + '/projects/' +
            internalBitbucketWebhook.getToProjectField(webhook_data, 'key') +
            '/repos/' +
            internalBitbucketWebhook.getToRepoField(webhook_data, 'slug') +
            '/pull-requests/' +
            internalBitbucketWebhook.getPrField(webhook_data, 'id');
    },

    /**
     * @param   {String}  event_type
     * @param   {Object}  data
     * @param   {Integer  data.service_id
     * @param   {Object}  webhook_data
     * @param   {Object}  webhook_data.pullRequest
     * @param   {Object}  webhook_data.actor
     * @param   {Array}   already_notified_user_ids
     * @returns {Promise} with array of user_ids who have been notified, so that they don't get notified again
     */
    processRules: (event_type, data, webhook_data, already_notified_user_ids) => {
        already_notified_user_ids = already_notified_user_ids || [];

        logger.bitbucket_webhook('  ❯ Processing Rules for:           ', event_type);

        let incoming_destination_username = internalBitbucketWebhook.getIncomingServiceUsernameBasedOnEvent(event_type, webhook_data);
        logger.bitbucket_webhook('    ❯ destination_incoming_username:', typeof incoming_destination_username === 'object' && incoming_destination_username !== null ? incoming_destination_username.join(', ') : incoming_destination_username);

        let incoming_trigger_username = internalBitbucketWebhook.getEventUser(webhook_data);
        logger.bitbucket_webhook('    ❯ incoming_trigger_username:    ', incoming_trigger_username);

        if (incoming_destination_username && incoming_trigger_username) {
            if (typeof incoming_destination_username === 'string' && incoming_destination_username === incoming_trigger_username) {
                // bail, as the event user and the destination are the same, we don't want to annoy user with their own actions
                return Promise.resolve([]);
            } else if (typeof incoming_destination_username === 'object' && incoming_destination_username.length) {
                // remove trigger user from array if present
                _.pull(incoming_destination_username, incoming_trigger_username);

                if (!incoming_destination_username.length) {
                    incoming_destination_username = null;
                }
            }
        }

        // A list of event types that are allowed to fire without having anyone specific to fire to.
        let anon_event_types = [
            'pr_opened',
            'pr_merged'
        ];

        // This complex query should only get the rules for users where the event type is requested and the incoming service username is defined
        // and where a notification hasn't already been sent to a user for this webhook

        let query = ruleModel
            .query()
            .select('rule.*', 'in_sd.service_username AS in_service_username')
            .joinRaw('INNER JOIN user_has_service_data AS in_sd ON in_sd.user_id = rule.user_id AND in_sd.service_id = rule.in_service_id')
            .where('rule.is_deleted', 0)
            .andWhere('rule.in_service_id', data.service_id)
            .andWhere('in_sd.service_username', '!=', '')
            .andWhere('rule.trigger', event_type)
            .eager('[template, in_service_data]')
            .orderBy('rule.priority_order');

        if (typeof incoming_destination_username === 'string' && incoming_destination_username) {
            query.andWhere('in_sd.service_username', '=', incoming_destination_username);
        } else if (typeof incoming_destination_username === 'object' && incoming_destination_username !== null && incoming_destination_username.length) {
            query.whereIn('in_sd.service_username', incoming_destination_username);
        } else if (anon_event_types.indexOf(event_type) === -1) {
            //
            logger.bitbucket_webhook('    ❯ No valid recipients for this event type');
            return Promise.resolve(already_notified_user_ids);
        }

        if (already_notified_user_ids.length) {
            query.whereNotIn('rule.user_id', already_notified_user_ids);
        }

        let this_already_notified_user_ids = [];

        return query
            .then((rules) => {
                return new Promise((resolve, reject) => {
                    batchflow(rules).sequential()
                        .each((i, rule, next) => {
                            logger.bitbucket_webhook('    ❯ Processing Rule #', rule.id);

                            if (this_already_notified_user_ids.indexOf(rule.id) !== -1) {
                                logger.bitbucket_webhook('      ❯ We have already processed a notification for this user_id:', rule.user_id, 'bailing on this rule');
                                next(0);
                            } else if (!internalBitbucketWebhook.extraConditionsMatch(rule.extra_conditions, webhook_data)) {
                                // extra conditions don't match the event
                                logger.bitbucket_webhook('      ❯ Extra conditions do not match, bailing on this rule');
                                next(0);
                            } else {

                                data.prurl = internalBitbucketWebhook.getPrUrl(webhook_data, rule.in_service_data.data.url);

                                // Debugging data in the payload
                                let debug_data = {
                                    _event_type:  event_type,
                                    _rule_id:     rule.id,
                                    _template_id: rule.out_template_id
                                };

                                let notification_data = {
                                    user_id:    rule.user_id,
                                    rule_id:    rule.id,
                                    service_id: rule.out_service_id,
                                    content:    templateRender(rule.template.content, _.assign({}, rule.template.default_options, rule.out_template_options, data, debug_data)),
                                    status:     'ready'
                                };

                                notificationQueueModel
                                    .query()
                                    .insert(notification_data)
                                    .then(() => {
                                        logger.bitbucket_webhook('      ❯ Notification queue item added');
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
                        .error((err) => {
                            reject(err);
                        })
                        .end((/*results*/) => {
                            logger.bitbucket_webhook('    ❯ Done processing Rules for:    ', event_type);
                            resolve(this_already_notified_user_ids);
                        });
                });
            });
    }
};

module.exports = internalBitbucketWebhook;
