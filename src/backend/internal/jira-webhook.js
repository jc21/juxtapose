'use strict';

const _                      = require('lodash');
const config                 = require('config');
const batchflow              = require('batchflow');
const logger                 = require('../logger');
const error                  = require('../lib/error');
const serviceModel           = require('../models/service');
const jwt                    = require('jsonwebtoken');
const ruleModel              = require('../models/rule');
const templateRender         = require('../lib/template_render');
const notificationQueueModel = require('../models/notification_queue');
const jiraIssueStatusModel   = require('../models/jira_issue_status');
const jiraIncomingLogModel   = require('../models/jira_incoming_log');
const Helpers                = require('../lib/helpers');
const ALGO                   = 'RS256';

let public_key = null;

const internalJiraWebhook = {

    /**
     * Router use
     *
     * @param   {String}  token
     * @param   {Object}  webhook_data
     * @param   {String}  webhook_data.webhookEvent
     * @param   {Object}  webhook_data.issue
     * @param   {Object}  webhook_data.user
     * @returns {Promise}
     */
    processIncoming: (token, webhook_data) => {
        public_key = config.get('jwt.pub');

        // 1. Verify Token
        return internalJiraWebhook.verifyToken(token)
            .then(token_data => {
                // 2. Make sure service still exists
                return serviceModel
                    .query()
                    .where('is_deleted', 0)
                    .andWhere('id', token_data.s)
                    .andWhere('type', 'jira-webhook')
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
                        logger.jira_webhook('❯ Incoming Webhook for Service #' + service.id + ': ' + service.name);
                        return jiraIncomingLogModel
                            .query()
                            .insert({
                                service_id: service.id,
                                data:       webhook_data
                            })
                            .then(log_row => {
                                logger.jira_webhook('  ❯ Saved in log table as ID #' + log_row.id);
                                return service;
                            });
                    })
                    // 5. Prune log table
                    .then(service => {
                        return jiraIncomingLogModel
                            .query()
                            .delete()
                            .where(jiraIncomingLogModel.raw('`created_on` < DATE_SUB(DATE(NOW()), INTERVAL 2 DAY)'))
                            .then(() => {
                                return service;
                            });
                    })
                    // 6. Process webhook
                    .then(service => {
                        return internalJiraWebhook.process(service.id, webhook_data);
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
     * @param   {String}  webhook_data.webhookEvent
     * @param   {Object}  webhook_data.issue
     * @param   {Object}  webhook_data.user
     * @returns {Promise|Object}
     */
    process: (service_id, webhook_data) => {
        if (typeof webhook_data.webhookEvent === 'string') {
            logger.jira_webhook('  ❯ Webhook Event:                  ', webhook_data.webhookEvent);
            logger.jira_webhook('  ❯ Issue:                          ', internalJiraWebhook.getIssueKey(webhook_data), '(#' + internalJiraWebhook.getIssueId(webhook_data) + ')');
            logger.jira_webhook('  ❯ isResolved:                     ', internalJiraWebhook.isResolved(webhook_data));
            logger.jira_webhook('  ❯ isResolveEvent:                 ', internalJiraWebhook.isResolveEvent(webhook_data));
            logger.jira_webhook('  ❯ isReopenEvent:                  ', internalJiraWebhook.isReopenEvent(webhook_data));
            logger.jira_webhook('  ❯ isCommentUpdate:                ', internalJiraWebhook.isCommentUpdate(webhook_data));

            let process_promises = [];

            switch (webhook_data.webhookEvent) {
                case 'jira:issue_created':
                    process_promises.push(internalJiraWebhook.processIssueCreated);
                    break;

                case 'jira:issue_updated':
                    process_promises.push(internalJiraWebhook.processIssueUpdated);
                    break;
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
                })
                    .then(results => {
                        return internalJiraWebhook.updateJiraIssueStatus(service_id, webhook_data)
                            .then(() => {
                                return results;
                            });
                    });
            }
        }

        return {
            error: 'Unsupported event: ' + webhook_data.webhookEvent
        };
    },

    /**
     * Note, the following events are not handled because they are known not to have a destination user:
     * - logged_unassigned
     * - reopened_unassigned
     * - resolved_all
     *
     * @param   {String}  event_type
     * @param   {Object}  webhook_data
     * @param   {String}  webhook_data.webhookEvent
     * @param   {Object}  webhook_data.issue
     * @param   {Object}  [known_issue_status]
     * @returns {String|Array}
     */
    getIncomingServiceUsernameBasedOnEvent: (event_type, webhook_data, known_issue_status) => {
        switch (event_type) {
            case 'assigned':
            case 'updated':
            case 'comment':
            case 'reopened':
            case 'resolved':
                return internalJiraWebhook.getAssigneeUsername(webhook_data);
                break;
            case 'comment_reported':
            case 'updated_reported':
            case 'resolved_reported':
            case 'reopened_reported':
                return internalJiraWebhook.getReporterUsername(webhook_data);
                break;
            case 'comment_participated':
            case 'updated_participated':
                // Tricky. Compile a list of users who are:
                // reporter
                // assignee
                // commenter
                return _.uniq(_.compact(_.concat(internalJiraWebhook.getCommentAuthors(webhook_data), [internalJiraWebhook.getAssigneeUsername(webhook_data), internalJiraWebhook.getReporterUsername(webhook_data)])));
                break;
            case 'reassigned':
                if (known_issue_status) {
                    return known_issue_status.assignee_username;
                }
                break;

            default:
                return null;
                break;
        }
    },

    /**
     * jira:issue_created
     *
     * Valid event types are:
     *
     * logged_unassigned
     * assigned
     *
     * @param   {Integer} service_id
     * @param   {Object}  webhook_data
     * @param   {String}  webhook_data.webhookEvent
     * @param   {String}  webhook_data.issue
     * @param   {String}  webhook_data.user
     * @param   {Array}   already_notified_user_ids
     * @returns {Promise|Boolean}
     */
    processIssueCreated: (service_id, webhook_data, already_notified_user_ids) => {

        let event_type = null;

        if (internalJiraWebhook.getIssueField(webhook_data, 'assignee') !== null) {
            event_type = 'assigned';
        } else {
            event_type = 'logged_unassigned';
        }

        let template_data = _.assign({service_id: service_id}, internalJiraWebhook.getCommonTemplateData(webhook_data));

        return internalJiraWebhook.processRules(event_type, template_data, webhook_data, already_notified_user_ids);
    },

    /**
     * jira:issue_updated
     *
     * Valid event types are:
     *
     * updated
     * updated_reported
     * updated_participated
     * reopened
     * resolved
     * reassigned
     * resolved_reported
     * updated_participated
     * resolved_all
     * reopened_unassigned
     * reopened_reported
     *
     * and they must all be fired, not exclusive
     *
     * A commented update is determined by having a "comment" item on the base event. If present, it's signified as a pure comment and
     * not an update in terms of our events. So, determining a comment has to be one of the first things we do.
     *
     * @param   {Integer} service_id
     * @param   {Object}  webhook_data
     * @param   {String}  webhook_data.webhookEvent
     * @param   {Object}  webhook_data.user
     * @param   {Object}  webhook_data.issue
     * @param   {Object}  [webhook_data.comment]
     * @param   {Array}   already_notified_user_ids
     * @returns {Promise|Boolean}
     */
    processIssueUpdated: (service_id, webhook_data, already_notified_user_ids) => {
        let event_types = [];

        return internalJiraWebhook.getJiraIssueStatus(service_id, internalJiraWebhook.getIssueId(webhook_data))
            .then((known_issue_status) => {

                //logger.jira_webhook(known_issue_status);

                let assignee    = internalJiraWebhook.getAssigneeUsername(webhook_data);
                let is_resolved = internalJiraWebhook.isResolved(webhook_data);

                // Defer this event if it's a resolution event, which may or may not have a comment added so this needs to go first:
                if (is_resolved && ((known_issue_status && !known_issue_status.is_resolved) || internalJiraWebhook.isResolveEvent(webhook_data))) {
                    return internalJiraWebhook.processIssueResolved(service_id, webhook_data, already_notified_user_ids);

                    // Defer this event if it's a reopen event, which may or may not have a comment added so this needs to go next:
                } else if (!is_resolved && ((known_issue_status && known_issue_status.is_resolved) || internalJiraWebhook.isReopenEvent(webhook_data))) {
                    return internalJiraWebhook.processIssueReopened(service_id, webhook_data, already_notified_user_ids);

                    // Defer this event if it's actually a comment:
                } else if (internalJiraWebhook.isCommentUpdate(webhook_data)) {
                    return internalJiraWebhook.processIssueCommented(service_id, webhook_data, already_notified_user_ids);

                    // Re-assigned away from this user:
                } else if (known_issue_status && known_issue_status.assignee_username && known_issue_status.assignee_username !== assignee) {
                    return internalJiraWebhook.processIssueReassigned(service_id, webhook_data, already_notified_user_ids, known_issue_status);

                } else {
                    if (internalJiraWebhook.getIssueField(webhook_data, 'assignee') !== null) {
                        event_types.push('updated');
                    }

                    event_types.push('updated_reported');
                    event_types.push('updated_participated');
                }

                let template_data = _.assign({service_id: service_id}, internalJiraWebhook.getCommonTemplateData(webhook_data));

                return new Promise((resolve, reject) => {
                    batchflow(event_types).sequential()
                        .each((i, event_type, next) => {
                            internalJiraWebhook.processRules(event_type, template_data, webhook_data, already_notified_user_ids)
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
            });
    },

    /**
     * jira:issue_updated -> comment
     *
     * Valid event types are:
     *
     * comment
     * comment_reported
     * comment_participated
     *
     * and they must all be fired, not exclusive
     *
     * @param   {Integer} service_id
     * @param   {Object}  webhook_data
     * @param   {String}  webhook_data.webhookEvent
     * @param   {Object}  webhook_data.issue
     * @param   {Object}  webhook_data.user
     * @param   {Object}  webhook_data.comment
     * @param   {Array}   already_notified_user_ids
     * @returns {Promise|Boolean}
     */
    processIssueCommented: (service_id, webhook_data, already_notified_user_ids) => {
        let event_types  = [];
        let comment_data = internalJiraWebhook.getCommentData(webhook_data);

        if (internalJiraWebhook.getIssueField(webhook_data, 'assignee') !== null) {
            event_types.push('comment');
        }

        event_types.push('comment_reported');
        event_types.push('comment_participated');

        let template_data = _.assign({
            service_id: service_id,
            comment:    comment_data
        }, internalJiraWebhook.getCommonTemplateData(webhook_data));

        return new Promise((resolve, reject) => {
            batchflow(event_types).sequential()
                .each((i, event_type, next) => {
                    internalJiraWebhook.processRules(event_type, template_data, webhook_data, already_notified_user_ids)
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
     * jira:issue_updated -> comment
     * At this stage we know that the assignee is different from the one we have on record. We have to notify the one we have on record
     * that it's been re-assigned.
     *
     * Valid event types are:
     *
     * reassigned
     *
     * @param   {Integer} service_id
     * @param   {Object}  webhook_data
     * @param   {String}  webhook_data.webhookEvent
     * @param   {Object}  webhook_data.issue
     * @param   {Object}  webhook_data.user
     * @param   {Object}  webhook_data.comment
     * @param   {Array}   already_notified_user_ids
     * @param   {Object}  known_issue_status
     * @returns {Promise}
     */
    processIssueReassigned: (service_id, webhook_data, already_notified_user_ids, known_issue_status) => {
        if (known_issue_status && known_issue_status.assignee_username) {
            let template_data = _.assign({service_id: service_id}, internalJiraWebhook.getCommonTemplateData(webhook_data));

            return internalJiraWebhook.processRules('reassigned', template_data, webhook_data, already_notified_user_ids)
                .then(notified_user_ids => {
                    if (notified_user_ids && notified_user_ids.length) {
                        already_notified_user_ids = _.concat(already_notified_user_ids, notified_user_ids);
                        already_notified_user_ids = _.compact(already_notified_user_ids);
                    }

                    return already_notified_user_ids;
                });
        } else {
            logger.jira_webhook('    ❯ Known Jira Issue doesn\'t have a previous assignee');
            return Promise.resolve(already_notified_user_ids);
        }
    },

    /**
     * jira:issue_updated -> resolved
     *
     * Valid event types are:
     *
     * resolved
     * resolved_reported
     * resolved_all
     *
     * @param   {Integer} service_id
     * @param   {Object}  webhook_data
     * @param   {String}  webhook_data.webhookEvent
     * @param   {Object}  webhook_data.issue
     * @param   {Object}  webhook_data.user
     * @param   {Object}  webhook_data.comment
     * @param   {Array}   already_notified_user_ids
     * @returns {Promise}
     */
    processIssueResolved: (service_id, webhook_data, already_notified_user_ids) => {
        let event_types = [];

        if (internalJiraWebhook.getIssueField(webhook_data, 'assignee') !== null) {
            event_types.push('resolved');
        }

        event_types.push('resolved_reported');
        event_types.push('resolved_all');

        let template_data = _.assign({
            service_id: service_id,
            resolution: internalJiraWebhook.getResolution(webhook_data),
            comment:    internalJiraWebhook.getCommentData(webhook_data)
        }, internalJiraWebhook.getCommonTemplateData(webhook_data));

        return new Promise((resolve, reject) => {
            batchflow(event_types).sequential()
                .each((i, event_type, next) => {
                    internalJiraWebhook.processRules(event_type, template_data, webhook_data, already_notified_user_ids)
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
     * jira:issue_updated -> reopened
     *
     * Valid event types are:
     *
     * reopened
     * reopened_unassigned
     *
     * @param   {Integer} service_id
     * @param   {Object}  webhook_data
     * @param   {String}  webhook_data.webhookEvent
     * @param   {Object}  webhook_data.issue
     * @param   {Object}  webhook_data.user
     * @param   {Object}  webhook_data.comment
     * @param   {Array}   already_notified_user_ids
     * @returns {Promise}
     */
    processIssueReopened: (service_id, webhook_data, already_notified_user_ids) => {
        let event_types = [];

        if (internalJiraWebhook.getIssueField(webhook_data, 'assignee') !== null) {
            event_types.push('reopened');
        } else {
            event_types.push('reopened_unassigned');
        }

        event_types.push('reopened_reported');

        let template_data = _.assign({
            service_id: service_id,
            resolution: internalJiraWebhook.getResolution(webhook_data),
            comment:    internalJiraWebhook.getCommentData(webhook_data)
        }, internalJiraWebhook.getCommonTemplateData(webhook_data));

        return new Promise((resolve, reject) => {
            batchflow(event_types).sequential()
                .each((i, event_type, next) => {
                    internalJiraWebhook.processRules(event_type, template_data, webhook_data, already_notified_user_ids)
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
     * @param   {String}  webhook_data.webhookEvent
     * @param   {Object}  webhook_data.user
     * @param   {String}  [field]    Defaults to 'name'
     * @returns {*}
     */
    getEventUser: (webhook_data, field) => {
        if (typeof webhook_data.user !== 'undefined' &&
            typeof webhook_data.user[field || 'name'] !== 'undefined') {
            return webhook_data.user[field || 'name'];
        }

        return null;
    },

    /**
     * @param   {Object}  webhook_data
     * @param   {String}  webhook_data.webhookEvent
     * @param   {Object}  webhook_data.issue
     * @returns {String}
     */
    getIssueUrl: (webhook_data) => {
        if (typeof webhook_data.issue !== 'undefined' &&
            typeof webhook_data.issue.self !== 'undefined') {
            return webhook_data.issue.self.replace(/(.*)\/rest\/api.*/gim, '$1/browse/') + webhook_data.issue.key;
        }

        return null;
    },

    /**
     * @param   {Object}  webhook_data
     * @param   {String}  webhook_data.webhookEvent
     * @param   {Object}  webhook_data.issue
     * @param   {String}  webhook_data.issue.id
     * @returns {Integer}
     */
    getIssueId: (webhook_data) => {
        if (typeof webhook_data.issue !== 'undefined' &&
            typeof webhook_data.issue.id !== 'undefined') {
            return parseInt(webhook_data.issue.id, 10);
        }

        return null;
    },

    /**
     * @param   {Object}  webhook_data
     * @param   {String}  webhook_data.webhookEvent
     * @param   {Object}  webhook_data.issue
     * @returns {String}
     */
    getIssueKey: (webhook_data) => {
        if (typeof webhook_data.issue !== 'undefined' &&
            typeof webhook_data.issue.key !== 'undefined') {
            return webhook_data.issue.key;
        }

        return null;
    },

    /**
     * @param   {Object}  webhook_data
     * @param   {String}  webhook_data.webhookEvent
     * @param   {Object}  webhook_data.issue
     * @param   {String}  field_name
     * @param   {String}  [subfield_name]
     * @returns {*}
     */
    getIssueField: (webhook_data, field_name, subfield_name) => {
        if (typeof webhook_data.issue !== 'undefined' &&
            typeof webhook_data.issue.fields !== 'undefined' &&
            typeof webhook_data.issue.fields[field_name] !== 'undefined') {

            let val = webhook_data.issue.fields[field_name];

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
     * @param   {String}  webhook_data.webhookEvent
     * @param   {Object}  webhook_data.issue
     * @param   {Integer} [char_length]
     * @returns {String}
     */
    getDescription: (webhook_data, char_length) => {
        char_length = char_length || 200;

        let description = internalJiraWebhook.getIssueField(webhook_data, 'description');
        if (description !== null) {
            return Helpers.trimString(Helpers.compactWhitespace(Helpers.stripHtml(description)), char_length);
        }

        return '';
    },

    /**
     * @param   {Object}  webhook_data
     * @param   {String}  webhook_data.webhookEvent
     * @param   {Object}  webhook_data.issue
     * @returns {String|null}
     */
    getAssigneeName: (webhook_data) => {
        let assignee = internalJiraWebhook.getIssueField(webhook_data, 'assignee');
        if (assignee !== null && typeof assignee.displayName !== 'undefined') {
            return assignee.displayName;
        }

        return null;
    },

    /**
     * @param   {Object}  webhook_data
     * @param   {String}  webhook_data.webhookEvent
     * @param   {Object}  webhook_data.issue
     * @returns {String|null}
     */
    getAssigneeUsername: (webhook_data) => {
        let assignee = internalJiraWebhook.getIssueField(webhook_data, 'assignee');
        if (assignee !== null && typeof assignee.name !== 'undefined') {
            return assignee.name;
        }

        return null;
    },

    /**
     * @param   {Object}  webhook_data
     * @param   {String}  webhook_data.webhookEvent
     * @param   {Object}  webhook_data.issue
     * @returns {String|null}
     */
    getReporterName: (webhook_data) => {
        let reporter = internalJiraWebhook.getIssueField(webhook_data, 'reporter');
        if (reporter !== null && typeof reporter.displayName !== 'undefined') {
            return reporter.displayName;
        }

        return null;
    },

    /**
     * @param   {Object}  webhook_data
     * @param   {String}  webhook_data.webhookEvent
     * @param   {Object}  webhook_data.issue
     * @returns {String|null}
     */
    getReporterUsername: (webhook_data) => {
        let reporter = internalJiraWebhook.getIssueField(webhook_data, 'reporter');
        if (reporter !== null && typeof reporter.name !== 'undefined') {
            return reporter.name;
        }

        return null;
    },

    /**
     * @param   {String}  event_type
     * @param   {Object}  data
     * @param   {Integer  data.service_id
     * @param   {Object}  webhook_data
     * @param   {String}  webhook_data.webhookEvent
     * @param   {Object}  webhook_data.issue
     * @param   {Object}  webhook_data.user
     * @param   {Array}   already_notified_user_ids
     * @param   {Object}  [known_issue_status]
     * @returns {Promise} with array of user_ids who have been notified, so that they don't get notified again
     */
    processRules: (event_type, data, webhook_data, already_notified_user_ids, known_issue_status) => {
        already_notified_user_ids = already_notified_user_ids || [];

        logger.jira_webhook('  ❯ Processing Rules for:           ', event_type);

        let incoming_destination_username = internalJiraWebhook.getIncomingServiceUsernameBasedOnEvent(event_type, webhook_data, known_issue_status);
        logger.jira_webhook('    ❯ destination_incoming_username:', typeof incoming_destination_username === 'object' && incoming_destination_username !== null ? incoming_destination_username.join(', ') : incoming_destination_username);

        let incoming_trigger_username = internalJiraWebhook.getEventUser(webhook_data);
        logger.jira_webhook('    ❯ incoming_trigger_username:    ', incoming_trigger_username);

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
            'logged_unassigned',
            'reopened_unassigned',
            'resolved_all'
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
            .eager('[template]')
            .orderBy('rule.priority_order');

        if (typeof incoming_destination_username === 'string' && incoming_destination_username) {
            query.andWhere('in_sd.service_username', '=', incoming_destination_username);
        } else if (typeof incoming_destination_username === 'object' && incoming_destination_username !== null && incoming_destination_username.length) {
            query.whereIn('in_sd.service_username', incoming_destination_username);
        } else if (anon_event_types.indexOf(event_type) === -1) {
            //
            logger.jira_webhook('    ❯ No valid recipients for this event type');
            return Promise.resolve(already_notified_user_ids);
        }

        if (already_notified_user_ids.length) {
            query.whereNotIn('rule.user_id', already_notified_user_ids);
        }

        let this_already_notified_user_ids = [];

        return query
            .then(rules => {
                return new Promise((resolve, reject) => {
                    batchflow(rules).sequential()
                        .each((i, rule, next) => {
                            logger.jira_webhook('    ❯ Processing Rule #' + rule.id);

                            if (this_already_notified_user_ids.indexOf(rule.id) !== -1) {
                                logger.jira_webhook('      ❯ We have already processed a notification for this user_id:', rule.user_id);
                                next(0);
                            } else if (!internalJiraWebhook.extraConditionsMatch(rule.extra_conditions, webhook_data)) {
                                // extra conditions don't match the event
                                logger.jira_webhook('      ❯ Extra conditions do not match');
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
                                            .insert(notification_data)
                                    })
                                    .then(() => {
                                        logger.jira_webhook('      ❯ Notification queue item added');
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
                            logger.jira_webhook('    ❯ Done processing Rules for:    ', event_type);
                            resolve(this_already_notified_user_ids);
                        });
                });
            });
    },

    /**
     * @param   {Object}  conditions
     * @param   {Object}  webhook_data
     * @param   {String}  webhook_data.webhookEvent
     * @param   {Object}  webhook_data.issue
     * @param   {Object}  webhook_data.user
     * @returns {Boolean}
     */
    extraConditionsMatch: (conditions, webhook_data) => {
        // default or no conditions means it's ok to go through
        let is_ok = true;

        if (conditions !== {}) {
            _.map(conditions, (value, name) => {
                switch (name) {
                    case 'project':
                        let project = internalJiraWebhook.getIssueField(webhook_data, 'project');

                        if (project !== null && typeof project.key !== 'undefined' && value) {
                            // Support comma separated values for project key
                            let valid_keys = value.split(',');
                            is_ok = valid_keys.indexOf(project.key) !== -1;
                        }

                        break;
                }
            });
        }

        return is_ok;
    },

    /**
     * @param   {Integer}  service_id
     * @param   {Integer}  issue_id
     * @returns {Promise|null}
     */
    getJiraIssueStatus: (service_id, issue_id) => {
        if (service_id && issue_id) {
            return jiraIssueStatusModel
                .query()
                .select()
                .where('service_id', service_id)
                .andWhere('issue_id', issue_id)
                .first();
        } else {
            return Promise.resolve(null);
        }
    },

    /**
     * @param   {Integer} service_id
     * @param   {Object}  webhook_data
     * @param   {String}  webhook_data.webhookEvent
     * @param   {Object}  webhook_data.issue
     * @param   {Object}  webhook_data.user
     * @returns {Promise}
     */
    updateJiraIssueStatus: (service_id, webhook_data) => {
        let issue_id    = internalJiraWebhook.getIssueId(webhook_data);
        let key         = internalJiraWebhook.getIssueKey(webhook_data);
        let assignee    = internalJiraWebhook.getAssigneeUsername(webhook_data);
        let is_resolved = internalJiraWebhook.isResolved(webhook_data);

        if (issue_id && key) {
            return jiraIssueStatusModel
                .query()
                .delete()
                .where('service_id', service_id)
                .andWhere('issue_id', issue_id)
                .then(() => {
                    return jiraIssueStatusModel
                        .query()
                        .insert({
                            service_id:        service_id,
                            issue_id:          issue_id,
                            issue_key:         key,
                            assignee_username: assignee || '',
                            is_resolved:       is_resolved ? 1 : 0
                        });
                });
        } else {
            return Promise.resolve();
        }
    },

    /**
     * @param   {Object}  webhook_data
     * @param   {String}  webhook_data.webhookEvent
     * @param   {Object}  webhook_data.issue
     * @param   {Object}  webhook_data.user
     * @returns {Object}
     */
    getCommonTemplateData: (webhook_data) => {
        return {
            user:        internalJiraWebhook.getEventUser(webhook_data, 'displayName'),
            issueurl:    internalJiraWebhook.getIssueUrl(webhook_data),
            issuekey:    internalJiraWebhook.getIssueKey(webhook_data),
            issuetype:   internalJiraWebhook.getIssueField(webhook_data, 'issuetype', 'name'),
            summary:     internalJiraWebhook.getIssueField(webhook_data, 'summary'),
            assignee:    internalJiraWebhook.getAssigneeName(webhook_data) || 'Unassigned',
            reporter:    internalJiraWebhook.getReporterName(webhook_data),
            description: internalJiraWebhook.getDescription(webhook_data),
            fields:      internalJiraWebhook.getChangelogData(webhook_data)
        };
    },

    /**
     * TODO: support showing the previous and new values for changelog in future
     *
     * @param   {Object}  webhook_data
     * @param   {String}  webhook_data.webhookEvent
     * @param   {Object}  webhook_data.changelog
     * @returns {String}
     */
    getChangelogData: (webhook_data) => {
        let fields = [];

        if (typeof webhook_data.changelog !== 'undefined' && typeof webhook_data.changelog.items !== 'undefined' && webhook_data.changelog.items.length) {
            _.map(webhook_data.changelog.items, function (item) {
                fields.push(Helpers.niceVarName(item.field));
            });
        }

        return fields.join(', ');
    },

    /**
     *
     * @param   {Object}  webhook_data
     * @param   {String}  webhook_data.webhookEvent
     * @param   {Object}  webhook_data.issue
     * @returns {Array}
     */
    getCommentAuthors: (webhook_data) => {
        let authors = [];
        if (typeof webhook_data.issue.fields !== 'undefined' && typeof webhook_data.issue.fields.comment !== 'undefined' && webhook_data.issue.fields.comment.comments.length) {
            _.map(webhook_data.issue.fields.comment.comments, function (item) {
                if (typeof item.author !== 'undefined') {
                    authors.push(item.author.name);
                }
            });
        }

        return _.uniq(authors);
    },

    /**
     * @param   {Object}  webhook_data
     * @returns {Boolean}
     */
    isCommentUpdate: (webhook_data) => {
        return typeof webhook_data.comment !== 'undefined' && typeof webhook_data.comment.body !== 'undefined';
    },

    /**
     * @param   {Object}  webhook_data
     * @param   {Object}  webhook_data.comment
     * @param   {Object}  webhook_data.comment.updateAuthor
     * @returns {Object}
     */
    getCommentData: (webhook_data) => {
        if (internalJiraWebhook.isCommentUpdate(webhook_data)) {
            let author = typeof webhook_data.comment.updateAuthor !== 'undefined' && typeof webhook_data.comment.updateAuthor.name !== 'undefined' ? webhook_data.comment.updateAuthor : webhook_data.comment.author;

            return {
                username: author.name,
                name:     author.displayName,
                content:  Helpers.trimString(Helpers.compactWhitespace(Helpers.stripHtml(webhook_data.comment.body)), 150)
            };
        }

        return {};
    },

    /**
     * @param   {Object}  webhook_data
     * @param   {String}  webhook_data.webhookEvent
     * @param   {Object}  webhook_data.issue
     * @returns {Boolean}
     */
    isResolved: (webhook_data) => {
        let resolution = internalJiraWebhook.getIssueField(webhook_data, 'resolution');
        return !!(resolution && typeof resolution.id !== 'undefined' && resolution.id !== null && resolution.id);
    },

    /**
     * @param   {Object}  webhook_data
     * @param   {String}  webhook_data.webhookEvent
     * @param   {Object}  webhook_data.issue
     * @returns {String}
     */
    getResolution: (webhook_data) => {
        let resolution = internalJiraWebhook.getIssueField(webhook_data, 'resolution');
        if (resolution && typeof resolution.id !== 'undefined' && resolution.name !== null && resolution.name) {
            return resolution.name;
        }

        return '';
    },

    /**
     * Smarts to determine if this issue is resolved as part of this event
     *
     * @param   {Object}  webhook_data
     * @param   {String}  webhook_data.webhookEvent
     * @param   {Object}  webhook_data.issue
     * @returns {Boolean}
     */
    isResolveEvent: (webhook_data) => {
        let response = false;

        if (typeof webhook_data.changelog !== 'undefined' && webhook_data.changelog && typeof webhook_data.changelog.items !== 'undefined' && webhook_data.changelog.items.length) {
            _.map(webhook_data.changelog.items, item => {
                if (item.field === 'resolution' && !item.field.from && typeof item.field.to === 'string' && item.field.to.length) {
                    response = true;
                }
            });
        }

        return response;
    },

    /**
     * Smarts to determine if this issue is resolved as part of this event
     *
     * @param   {Object}  webhook_data
     * @param   {String}  webhook_data.webhookEvent
     * @param   {Object}  webhook_data.issue
     * @returns {Boolean}
     */
    isReopenEvent: (webhook_data) => {
        let response = false;

        if (typeof webhook_data.changelog !== 'undefined' && webhook_data.changelog && typeof webhook_data.changelog.items !== 'undefined' && webhook_data.changelog.items.length) {
            _.map(webhook_data.changelog.items, item => {
                if (item.field === 'resolution' && !item.field.to && typeof item.field.from === 'string' && item.field.from.length) {
                    response = true;
                }
            });
        }

        return response;
    }
};

module.exports = internalJiraWebhook;
