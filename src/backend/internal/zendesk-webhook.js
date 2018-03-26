'use strict';

const _                        = require('lodash');
const config                   = require('config');
const batchflow                = require('batchflow');
const logger                   = require('../logger');
const error                    = require('../lib/error');
const serviceModel             = require('../models/service');
const jwt                      = require('jsonwebtoken');
const ruleModel                = require('../models/rule');
const templateRender           = require('../lib/template_render');
const notificationQueueModel   = require('../models/notification_queue');
const zendeskIncomingLogModel  = require('../models/zendesk_incoming_log');
const zendeskTicketStatusModel = require('../models/zendesk_ticket_status');
const ALGO                     = 'RS256';

let public_key = null;

const internalZendeskWebhook = {

    /**
     * Router use
     *
     * @param   {String}  token
     * @param   {Object}  webhook_data
     * @param   {Object}  webhook_data.ticket
     * @param   {Object}  webhook_data.current_user
     * @param   {Object}  webhook_data.satisfaction
     * @returns {Promise}
     */
    processIncoming: (token, webhook_data) => {
        public_key = config.get('jwt.pub');

        webhook_data = internalZendeskWebhook.sanitizePayload(webhook_data);

        // 1. Verify Token
        return internalZendeskWebhook.verifyToken(token)
            .then(token_data => {
                // 2. Make sure service still exists
                return serviceModel
                    .query()
                    .where('is_deleted', 0)
                    .andWhere('id', token_data.s)
                    .andWhere('type', 'zendesk-webhook')
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
                        logger.zendesk_webhook('❯ Incoming Webhook for Service #' + service.id + ': ' + service.name);
                        return zendeskIncomingLogModel
                            .query()
                            .insert({
                                service_id: service.id,
                                data:       webhook_data
                            })
                            .then(log_row => {
                                logger.zendesk_webhook('  ❯ Saved in log table as ID #' + log_row.id);
                                return service;
                            });
                    })
                    // 5. Prune log table
                    .then(service => {
                        return zendeskIncomingLogModel
                            .query()
                            .delete()
                            .where(zendeskIncomingLogModel.raw('`created_on` < DATE_SUB(DATE(NOW()), INTERVAL 2 DAY)'))
                            .then(() => {
                                return service;
                            });
                    })
                    // 6. Process webhook
                    .then(service => {
                        return internalZendeskWebhook.process(service.id, webhook_data)
                            .then(result => {
                                // Save the current state of the ticket
                                return zendeskTicketStatusModel
                                    .query()
                                    .delete()
                                    .where('service_id', service.id)
                                    .andWhere('ticket_id', webhook_data.ticket.id)
                                    .then(() => {
                                        return zendeskTicketStatusModel
                                            .query()
                                            .insert({
                                                service_id: service.id,
                                                ticket_id:  webhook_data.ticket.id,
                                                data:       webhook_data
                                            });
                                    })
                                    .then(() => {
                                        return result;
                                    });
                            });
                    });
            })
            .catch(err => {
                logger.error(err, webhook_data);
                throw err;
            });
    },

    /**
     * @param   {Object}  webhook_data
     * @param   {Object}  webhook_data.ticket
     * @param   {Object}  webhook_data.current_user
     * @param   {Object}  webhook_data.satisfaction
     * @returns {Object}
     */
    sanitizePayload: webhook_data => {
        let sanitize = val => {
            return _.unescape(val.replace(/[\u{0080}-\u{FFFF}]/gu, ''));
        };

        // Remove special emoji characters and crap from the content so it doesn't mess up the notifications. We don't need smileys anyway
        if (typeof webhook_data.ticket !== 'undefined') {
            if (typeof webhook_data.ticket.summary === 'string') {
                webhook_data.ticket.summary = sanitize(webhook_data.ticket.summary);
            }

            if (typeof webhook_data.ticket.description === 'string') {
                webhook_data.ticket.description = sanitize(webhook_data.ticket.description);
            }

            if (typeof webhook_data.ticket.latest_comment !== 'undefined' && typeof webhook_data.ticket.latest_comment.value === 'string') {
                webhook_data.ticket.latest_comment.value = sanitize(webhook_data.ticket.latest_comment.value);
            }
        }

        if (typeof webhook_data.satisfaction !== 'undefined') {
            if (typeof webhook_data.satisfaction.current_rating === 'string') {
                webhook_data.satisfaction.current_rating = sanitize(webhook_data.satisfaction.current_rating);
            }

            if (typeof webhook_data.satisfaction.current_comment === 'string') {
                webhook_data.satisfaction.current_comment = sanitize(webhook_data.satisfaction.current_comment).replace(/^"+|"+$/g, '');
            }
        }

        return webhook_data;
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
     * @param   {Object}  webhook_data.ticket
     * @param   {Object}  webhook_data.current_user
     * @param   {Object}  webhook_data.satisfaction
     * @returns {Promise|Object}
     */
    process: (service_id, webhook_data) => {
        logger.zendesk_webhook('  ❯ Ticket ID:                      ', internalZendeskWebhook.getTicketField(webhook_data, 'id'));
        logger.zendesk_webhook('  ❯ Title:                          ', internalZendeskWebhook.getTicketField(webhook_data, 'title'));
        logger.zendesk_webhook('  ❯ Link:                           ', internalZendeskWebhook.getTicketField(webhook_data, 'link'));

        // Get existing ticket details
        return zendeskTicketStatusModel.query()
            .where('ticket_id', webhook_data.ticket.id)
            .andWhere('service_id', service_id)
            .first()
            .then(existing_ticket_row => {
                let event_types = internalZendeskWebhook.determineEventsFromPayload(webhook_data, existing_ticket_row);

                if (event_types.length) {
                    return new Promise((resolve, reject) => {
                        let already_notified_user_ids = [];

                        batchflow(event_types).sequential()
                            .each((i, event_type, next) => {
                                internalZendeskWebhook.processTheseEventTypes(event_type, service_id, webhook_data, existing_ticket_row, already_notified_user_ids)
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
            });
    },

    /**
     * Zendesk is .. pretty shit at webhooks. By making the setup process easy for the user,
     * it makes it hard for us to determine the events to trigger because we don't have a
     * "event type" given to us like other services. We just get a dump of the ticket data
     * and have to compare what we have on file to get a list of what's changed, then
     * compile event types based on the changed data.
     *
     * ticket_logged        - Any Ticket is logged without an Assignee
     * ticket_rated         - Any Ticket is rated
     * my_ticket_assigned   - A Ticket is assigned to you
     * my_ticket_updated    - A Ticket assigned to you is updated
     * my_ticket_reassigned - A Ticket assigned to you is re-assigned
     * my_ticket_commented  - A comment is made on on your Ticket
     * my_ticket_rated      - A rating is made on your Ticket
     *
     * @param   {Object}  webhook_data
     * @param   {Object}  existing_ticket_row
     * @returns {Array}
     */
    determineEventsFromPayload: (webhook_data, existing_ticket_row) => {
        let event_types = [];

        if (!existing_ticket_row) {
            // We have nothing on record, so we'll assume that this is a new ticket
            if (!internalZendeskWebhook.isAssigned(webhook_data)) {
                // Unassigned
                event_types.push('ticket_logged');
            } else {
                // Assigned to someone. We'll assume this is an update since we've never seen it before.
                event_types.push('my_ticket_updated');

                if (internalZendeskWebhook.isRated(webhook_data)) {
                    event_types.push('my_ticket_rated');
                }
            }

            if (internalZendeskWebhook.hasComment(webhook_data)) {
                event_types.push('my_ticket_commented');
            }

            if (internalZendeskWebhook.isRated(webhook_data)) {
                event_types.push('ticket_rated');
            }

        } else {
            // Existing ticket on file. We need to check what's changed
            let ticket = existing_ticket_row.data.ticket;

            if (internalZendeskWebhook.isAssigned(webhook_data)) {
                // my_ticket_assigned - A Ticket is assigned to you
                if (!ticket.assignee) {
                    event_types.push('my_ticket_assigned');
                }

                // my_ticket_reassigned - A Ticket assigned to you is re-assigned
                if (ticket.assignee && typeof ticket.assignee.id !== 'undefined' && ticket.assignee.id !== webhook_data.ticket.assignee.id) {
                    if (event_types.indexOf('my_ticket_assigned') === -1) {
                        event_types.push('my_ticket_assigned');
                    }

                    event_types.push('my_ticket_reassigned');
                }

                // my_ticket_rated - A rating is made on your Ticket
                if (internalZendeskWebhook.isRated(webhook_data) && (!existing_ticket_row.data.satisfaction || !existing_ticket_row.data.satisfaction.current_rating)) {
                    event_types.push('ticket_rated');
                }

                // my_ticket_commented  - A comment is made on on your Ticket
                if (ticket.latest_comment && webhook_data.ticket.latest_comment && ticket.latest_comment.id !== webhook_data.ticket.latest_comment.id) {
                    event_types.push('my_ticket_commented');
                }

                // my_ticket_updated - A Ticket assigned to you is updated
                event_types.push('my_ticket_updated');
            }
        }

        return [event_types];
    },

    /**
     * @param   {Array}   event_types
     * @param   {Integer} service_id
     * @param   {Object}  webhook_data
     * @param   {Object}  webhook_data.ticket
     * @param   {Object}  webhook_data.current_user
     * @param   {Object}  webhook_data.satisfaction
     * @param   {Object}  existing_ticket_row
     * @param   {Array}   already_notified_user_ids
     * @returns {Promise}
     */
    processTheseEventTypes: (event_types, service_id, webhook_data, existing_ticket_row, already_notified_user_ids) => {
        let template_data = _.assign({service_id: service_id}, webhook_data);

        return new Promise((resolve, reject) => {
            batchflow(event_types).sequential()
                .each((i, event_type, next) => {
                    internalZendeskWebhook.processRules(event_type, template_data, webhook_data, existing_ticket_row, already_notified_user_ids)
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
     * @param   {Object}  webhook_data.ticket
     * @param   {String}  field_name
     * @param   {String}  [subfield_name]
     * @returns {*}
     */
    getTicketField: (webhook_data, field_name, subfield_name) => {
        if (typeof webhook_data.ticket !== 'undefined' && typeof webhook_data.ticket[field_name] !== 'undefined') {
            let val = webhook_data.ticket[field_name];

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
     * @param   {Object} webhook_data
     * @returns {Boolean}
     */
    isAssigned: webhook_data => {
        return typeof webhook_data.ticket !== 'undefined' &&
            typeof webhook_data.ticket.assignee !== 'undefined' &&
            webhook_data.ticket.assignee &&
            typeof webhook_data.ticket.assignee.id !== 'undefined' &&
            typeof webhook_data.ticket.assignee.id;
    },

    /**
     * @param   {Object} webhook_data
     * @returns {Boolean}
     */
    isRated: webhook_data => {
        return typeof webhook_data.satisfaction !== 'undefined' &&
            typeof webhook_data.satisfaction.current_rating !== 'undefined' &&
            webhook_data.satisfaction.current_rating;
    },

    /**
     * @param   {Object} webhook_data
     * @returns {Boolean}
     */
    hasComment: webhook_data => {
        // Due to the way that Zendesk adds the ticket description as a comment, we have to determine if the ticket's
        // last comment is not the same as the description. We strip all whitespace when comparing.
        if (typeof webhook_data.ticket.latest_comment !== 'undefined' && webhook_data.ticket.latest_comment) {
            return !webhook_data.ticket.latest_comment.is_public || webhook_data.ticket.description.replace(/(\r|\n| )/gi, '').indexOf(webhook_data.ticket.latest_comment.value.replace(/(\r|\n| )/gi, '')) === -1;
        }

        return false;
    },

    /**
     * @param   {Object}  webhook_data
     * @param   {Object}  webhook_data.current_user
     * @param   {String}  [field]    Defaults to 'email'
     * @returns {*}
     */
    getEventUser: (webhook_data, field) => {
        if (typeof webhook_data.current_user !== 'undefined' &&
            typeof webhook_data.current_user[field || 'email'] !== 'undefined') {
            return webhook_data.current_user[field || 'email'];
        }

        return null;
    },

    /**
     * Note, the following events are not handled because they are known not to have a destination user:
     * - ticket_logged
     * - ticket_rated
     *
     * @param   {String}  event_type
     * @param   {Object}  webhook_data
     * @param   {Object}  webhook_data.ticket
     * @param   {Object}  webhook_data.current_user
     * @param   {Object}  webhook_data.satisfaction
     * @param   {Object}  existing_ticket_row
     * @returns {String|Array}
     */
    getIncomingServiceEmailBasedOnEvent: (event_type, webhook_data, existing_ticket_row) => {
        switch (event_type) {
            case 'my_ticket_assigned':
            case 'my_ticket_updated':
            case 'my_ticket_commented':
            case 'my_ticket_rated':
                return internalZendeskWebhook.getAssignee(webhook_data, 'email').toLowerCase();
                break;

            case 'my_ticket_reassigned':
                if (existing_ticket_row) {
                    return internalZendeskWebhook.getAssignee(existing_ticket_row.data, 'email').toLowerCase();
                }
                break;
        }

        return null;
    },

    /**
     * @param   {Object}  webhook_data
     * @param   {Object}  webhook_data.ticket
     * @param   {Object}  webhook_data.current_user
     * @param   {Object}  webhook_data.satisfaction
     * @param   {String}  field
     * @returns {String}
     */
    getAssignee: (webhook_data, field) => {
        let assignee = internalZendeskWebhook.getTicketField(webhook_data, 'assignee');

        if (assignee && typeof assignee[field] !== 'undefined') {
            return assignee[field];
        }

        return '';
    },

    /**
     * @param   {Object}  conditions
     * @param   {Object}  webhook_data
     * @param   {Object}  webhook_data.ticket
     * @param   {Object}  webhook_data.current_user
     * @param   {Object}  webhook_data.satisfaction
     * @returns {Boolean}
     */
    extraConditionsMatch: (conditions, webhook_data) => {
        // default or no conditions means it's ok to go through
        let is_ok = true;

        if (conditions !== {}) {
            _.map(conditions, (value, name) => {
                if (value) {
                    switch (name) {
                        case 'status':
                            let status = internalZendeskWebhook.getTicketField(webhook_data, 'status');
                            if (status && status.toLowerCase() !== value.toLowerCase()) {
                                // status doesn't match
                                is_ok = false;
                            }
                            break;
                        case 'group_name':
                            let group_name = internalZendeskWebhook.getTicketField(webhook_data, 'group_name');
                            if (group_name && group_name.toLowerCase() !== value.toLowerCase()) {
                                // group_name doesn't match
                                is_ok = false;
                            }
                            break;
                    }
                }
            });
        }

        return is_ok;
    },

    /**
     * @param   {String}  event_type
     * @param   {Object}  data
     * @param   {Integer  data.service_id
     * @param   {Object}  webhook_data
     * @param   {Object}  webhook_data.ticket
     * @param   {Object}  webhook_data.current_user
     * @param   {Object}  webhook_data.satisfaction
     * @param   {Object}  existing_ticket_row
     * @param   {Array}   already_notified_user_ids
     * @returns {Promise} with array of user_ids who have been notified, so that they don't get notified again
     */
    processRules: (event_type, data, webhook_data, existing_ticket_row, already_notified_user_ids) => {
        already_notified_user_ids = already_notified_user_ids || [];

        logger.zendesk_webhook('  ❯ Processing Rules for:           ', event_type);

        let incoming_destination_email = internalZendeskWebhook.getIncomingServiceEmailBasedOnEvent(event_type, webhook_data, existing_ticket_row);
        logger.zendesk_webhook('    ❯ incoming_destination_email:   ', typeof incoming_destination_email === 'object' && incoming_destination_email !== null ? incoming_destination_email.join(', ') : incoming_destination_email);

        let incoming_trigger_user_email = internalZendeskWebhook.getEventUser(webhook_data, 'email').toLowerCase();
        logger.zendesk_webhook('    ❯ incoming_trigger_user_email:  ', incoming_trigger_user_email);

        if (incoming_destination_email && incoming_trigger_user_email) {
            if (typeof incoming_destination_email === 'string' && incoming_destination_email === incoming_trigger_user_email) {
                // bail, as the event user and the destination are the same, we don't want to annoy user with their own actions
                return Promise.resolve([]);
            } else if (incoming_destination_email !== null && typeof incoming_destination_email === 'object' && incoming_destination_email.length) {
                // remove trigger user from array if present
                _.pull(incoming_destination_email, incoming_trigger_user_email);

                if (!incoming_destination_email.length) {
                    incoming_destination_email = null;
                }
            }
        }

        // A list of event types that are allowed to fire without having anyone specific to fire to.
        let anon_event_types = [
            'ticket_logged',
            'ticket_rated'
        ];

        // This complex query should only get the rules for users where the event type is requested and the incoming service username is defined
        // and where a notification hasn't already been sent to a user for this webhook
        // Note: the table's `service_username` here should be the Zendesk Email Address, lowercased.

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

        if (typeof incoming_destination_email === 'string' && incoming_destination_email) {
            query.andWhere('in_sd.service_username', '=', incoming_destination_email);
        } else if (typeof incoming_destination_email === 'object' && incoming_destination_email !== null && incoming_destination_email.length) {
            query.whereIn('in_sd.service_username', incoming_destination_email);
        } else if (anon_event_types.indexOf(event_type) === -1) {
            logger.zendesk_webhook('    ❯ No valid recipients for this event type');
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
                            logger.zendesk_webhook('    ❯ Processing Rule #' + rule.id);

                            if (this_already_notified_user_ids.indexOf(rule.id) !== -1) {
                                logger.zendesk_webhook('      ❯ We have already processed a notification for this user_id:', rule.user_id);
                                next(0);
                            } else if (!internalZendeskWebhook.extraConditionsMatch(rule.extra_conditions, webhook_data)) {
                                // extra conditions don't match the event
                                logger.zendesk_webhook('      ❯ Extra conditions do not match');
                                next(0);
                            } else {
                                // Debugging data in the payload
                                let debug_data = {
                                    _event_type:  event_type,
                                    _rule_id:     rule.id,
                                    _template_id: rule.out_template_id
                                };

                                // special case, clean the rating comment from being an empty string
                                if (typeof data.satisfaction !== 'undefined' && typeof data.satisfaction.current_comment === 'string') {
                                    data.satisfaction.current_comment = data.satisfaction.current_comment.trim();
                                }

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
                                        logger.zendesk_webhook('      ❯ Notification queue item added');
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
                            logger.zendesk_webhook('    ❯ Done processing Rules for:    ', event_type);
                            resolve(this_already_notified_user_ids);
                        });
                });
            });
    }
};

module.exports = internalZendeskWebhook;
