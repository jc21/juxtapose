'use strict';

const _                      = require('lodash');
const logger                 = require('../logger');
const internalService        = require('./service');
const batchflow              = require('batchflow');
const slackBots              = require('slackbots');
const notificationQueueModel = require('../models/notification_queue');

const internalServiceWorker = {

    services:            {},
    interval_timeout:    5000,
    interval:            null,
    interval_processing: false,

    /**
     *
     */
    start: () => {
        logger.service_worker('Starting');
        internalServiceWorker.init();
    },

    /**
     *
     */
    restart: () => {
        logger.service_worker('Restarting');

        if (internalServiceWorker.interval) {
            clearInterval(internalServiceWorker.interval);
            internalServiceWorker.interval_processing = false;
        }

        _.map(internalServiceWorker.services, (unused, idx) => {
            if (typeof internalServiceWorker.services[idx].handler !== 'undefined') {
                if (internalServiceWorker.services[idx].type === 'slack') {
                    internalServiceWorker.services[idx].handler.ws.close();
                }

                internalServiceWorker.services[idx].handler = null;
            }
        });

        internalServiceWorker.services = null;
        internalServiceWorker.init();
    },

    /**
     * Initialise configured services by loading them from the database and doing whatever needs to be done
     */
    init: () => {
        internalServiceWorker.services = {};

        let started = 0;

        return internalService.getActiveServices()
            .then((services) => {
                return new Promise((resolve, reject) => {
                    batchflow(services).sequential()
                        .each((i, service, next) => {
                            if (service.type === 'slack') {
                                internalServiceWorker.initSlack(service)
                                    .then(() => {
                                        started++;
                                        next();
                                    })
                                    .catch(err => {
                                        logger.service_worker('Service #' + service.id + ' ERROR: ' + err.message);
                                        next(err);
                                    });
                            } else if (service.type === 'jira-webhook' || service.type === 'bitbucket-webhook') {
                                // can be ignored
                                next();
                            } else {
                                logger.service_worker('Service #' + service.id + ' of type "' + service.type + '" is not yet supported');
                                next();
                            }
                        })
                        .error((err) => {
                            reject(err);
                        })
                        .end((/*results*/) => {
                            logger.service_worker(started + ' Services Started');
                            internalServiceWorker.interval = setInterval(internalServiceWorker.checkNotificationQueue, internalServiceWorker.interval_timeout);
                            resolve();
                        });
                });
            })
            .catch((err) => {
                logger.error(err);
            });
    },

    /**
     * @param   {Object}  service
     * @returns {Promise}
     */
    initSlack: (service) => {
        return new Promise((resolve, reject) => {
            logger.service_worker('Starting Slack Service #' + service.id + ': ' + service.name);

            // Set global
            let obj = internalServiceWorker.services['service-' + service.id] = _.clone(service);
            obj.online = false;

            // create a bot
            obj.handler = new slackBots({
                token: service.data.api_token,
                name:  service.name
            });

            obj.handler.on('start', function () {
                obj.online = true;
            });

            /*
            obj.handler.on('message', function () {
                debug('#' + service.id + ' Slack Message:', arguments);
            });
            */

            obj.handler.on('close', function () {
                obj.online = false;
            });

            resolve();
        });
    },

    /**
     * @param   {Integer}  service_id
     * @returns {null}
     */
    getService: (service_id) => {
        if (typeof internalServiceWorker.services['service-' + service_id] !== 'undefined') {
            return internalServiceWorker.services['service-' + service_id];
        }

        return null;
    },

    /**
     * @param   {Integer}  service_id
     * @returns {boolean}
     */
    isOnline: (service_id) => {
        let service = internalServiceWorker.getService(service_id);
        if (service && typeof service.online !== 'undefined') {
            return service.online;
        }

        return false;
    },

    /**
     * Checks for queue items ready to process and processes them
     */
    checkNotificationQueue: function () {
        //logger.service_worker('Interval fired');

        if (!internalServiceWorker.interval_processing) {
            internalServiceWorker.interval_processing = true;

            notificationQueueModel
                .query()
                .select()
                .where('status', 'ready')
                .eager('[user.services]')
                .then(notifications => {
                    return new Promise((resolve, reject) => {
                        batchflow(notifications).sequential()
                            .each((i, notification, next) => {
                                //debug('notification:', notification);

                                // update row with processing
                                notificationQueueModel
                                    .query()
                                    .patch({
                                        status: 'processing'
                                    })
                                    .where('id', notification.id)
                                    .then(() => {
                                        // Determine the service username for this notification
                                        let service_settings = null;

                                        _.map(notification.user.services, (service) => {
                                            if (service.id === notification.service_id && service.service_username) {
                                                service_settings = _.clone(service);
                                            }
                                        });

                                        if (service_settings) {
                                            // Send
                                            logger.service_worker('Sending notification #' + notification.id + ' to @' + service_settings.service_username + ' at ' + service_settings.type + ' service #' + notification.service_id);

                                            internalServiceWorker.sendMessage(notification.service_id, service_settings.service_username, notification.content)
                                                .then(() => {
                                                    // update row with error
                                                    return notificationQueueModel
                                                        .query()
                                                        .patch({
                                                            status: 'completed'
                                                        })
                                                        .where('id', notification.id);
                                                })
                                                .catch((err) => {
                                                    // update row with error
                                                    return notificationQueueModel
                                                        .query()
                                                        .patch({
                                                            status: 'error'
                                                        })
                                                        .where('id', notification.id);
                                                })
                                                .then(() => {
                                                    next();
                                                });
                                        } else {
                                            logger.service_worker('Could not send notification #' + notification.id + ' because destination username was not configured');

                                            // update row with error
                                            notificationQueueModel
                                                .query()
                                                .patch({
                                                    status: 'error'
                                                })
                                                .where('id', notification.id)
                                                .then(() => {
                                                    next();
                                                });
                                        }

                                    });
                            })
                            .error(err => {
                                reject(err);
                            })
                            .end((/*results*/) => {
                                resolve();
                            });
                    });
                })
                .then(() => {
                    internalServiceWorker.interval_processing = false;
                })
                .catch(err => {
                    console.error(err);
                    internalServiceWorker.interval_processing = false;
                });
        }
    },

    /**
     * @param   {Integer} service_id
     * @param   {String}  username
     * @param   {String}  message
     * @returns {Promise}
     */
    sendMessage: (service_id, username, message) => {
        return new Promise((resolve, reject) => {
            let service = internalServiceWorker.getService(service_id);
            if (service) {

                let slack_options = {
                    icon_url: service.data.icon_url || 'https://public.jc21.com/jira-notify/apple-icon.png'
                };

                switch (service.type) {
                    case 'slack':
                        //debug('SLACK MESSAGE:', username, message, slack_options);

                        if (typeof message === 'object') {
                            slack_options = _.assign({}, slack_options, message);
                            message       = '';
                        }

                        service.handler.postMessageToUser(username, message, slack_options)
                            .fail(function (data) {
                                //data = { ok: false, error: 'user_not_found' }
                                reject(new Error(data.error));
                            })
                            .then(function (data) {
                                resolve(data || true);
                            });
                        break;
                    default:
                        reject(new Error('Service type "' + service.type + '" is not yet supported'));
                        break;
                }
            } else {
                reject(new Error('Could not find Service for #' + service_id));
            }
        });
    },

    /**
     * @param   {Integer}  service_id
     * @returns {Promise}
     */
    getUsers: (service_id) => {
        return new Promise((resolve, reject) => {
            let service = internalServiceWorker.getService(service_id);
            if (service) {
                switch (service.type) {
                    case 'slack':
                        service.handler.getUsers()
                            .fail(function (data) {
                                reject(new Error(data.error));
                            })
                            .then(function (data) {
                                if (typeof data.members !== 'undefined') {
                                    let real_users = _.filter(data.members, function (m) {
                                        return !m.is_bot && !m.deleted && m.id !== 'USLACKBOT';
                                    });

                                    let users = [];
                                    _.map(real_users, real_user => {
                                        users.push({
                                            id:           real_user.id,
                                            name:         real_user.name,
                                            real_name:    real_user.profile.real_name,
                                            display_name: real_user.profile.display_name,
                                            avatar:       real_user.profile.image_24
                                        });
                                    });

                                    resolve(_.sortBy(users, ['real_name', 'display_name', 'name']));
                                } else {
                                    reject(new Error('Invalid response from service'));
                                }
                            });
                        break;
                    default:
                        reject(new Error('Service type "' + service.type + '" is not yet supported'));
                        break;
                }
            } else {
                reject(new Error('Could not find Service for #' + service_id));
            }
        });
    }

};

module.exports = internalServiceWorker;
