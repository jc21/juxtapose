'use strict';

const _                      = require('lodash');
const logger                 = require('../logger');
const internalService        = require('./service');
const batchflow              = require('batchflow');
const slackBots              = require('slackbots');
const notificationQueueModel = require('../models/notification_queue');
//const xmpp                   = require('simple-xmpp').SimpleXMPP;
const xmpp = require('../lib/xmpp');

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

                } else if (internalServiceWorker.services[idx].type === 'jabber') {
                    internalServiceWorker.services[idx].handler.disconnect();
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
            .then(services => {
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

                            } else if (service.type === 'jabber') {
                                internalServiceWorker.initJabber(service)
                                    .then(() => {
                                        started++;
                                        next();
                                    })
                                    .catch(err => {
                                        logger.service_worker('Service #' + service.id + ' ERROR: ' + err.message);
                                        next(err);
                                    });

                            } else if (service.type.match(/(.|\n)*-webhook$/im)) {
                                // can be ignored
                                next();

                            } else {
                                logger.service_worker('Service #' + service.id + ' of type "' + service.type + '" is not yet supported');
                                next();
                            }
                        })
                        .error(err => {
                            reject(err);
                        })
                        .end((/*results*/) => {
                            logger.service_worker(started + ' Services Started');
                            internalServiceWorker.interval = setInterval(internalServiceWorker.checkNotificationQueue, internalServiceWorker.interval_timeout);
                            resolve();
                        });
                });
            })
            .catch(err => {
                logger.error(err);
            });
    },

    /**
     * @param   {Object}  service
     * @returns {Promise}
     */
    initSlack: service => {
        return new Promise((resolve/*, reject*/) => {
            logger.service_worker('Starting Service #' + service.id + ' (slack): ' + service.name);

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
                logger.service_worker('Service #' + service.id + ' (slack) Connected');
            });

            obj.handler.on('close', function () {
                obj.online = false;
                logger.service_worker('Service #' + service.id + ' (slack) Closed');

                // reconnect
                setTimeout(function () {
                    logger.service_worker('Service #' + service.id + ' (slack) reconnecting ...');

                    internalServiceWorker.initSlack(service)
                        .catch(err => {
                            logger.service_worker('Service #' + service.id + ' (slack) ERROR: ' + err.message);
                        });
                }, 2000);
            });

            resolve();
        });
    },

    /**
     * @param   {Object}  service
     * @returns {Promise}
     */
    initJabber: service => {
        return new Promise((resolve, reject) => {
            logger.service_worker('Starting Service #' + service.id + ' (jabber): ' + service.name);

            // Set global
            let obj = internalServiceWorker.services['service-' + service.id] = _.clone(service);
            obj.online  = false;
            obj.handler = new xmpp({
                jid:      service.data.jid,
                password: service.data.password,
                host:     service.data.server,
                port:     service.data.port
            });

            /*
            obj.handler.on('stanza', function(stanza) {
                if (!stanza.is('presence') && !stanza.is('iq')) {
                    logger.info('STANZ:', stanza, stanza.toString());
                }
            });
            */

            obj.handler.on('online', data => {
                logger.service_worker('Service #' + service.id + ' (jabber) Connected with JID: ' + data.jid.user + '@' + data.jid._domain);
                obj.online = true;
            });

            obj.handler.on('close', () => {
                logger.service_worker('Service #' + service.id + ' (jabber) Closed');
                obj.online = false;
                obj.handler.disconnect();

                // reconnect
                setTimeout(function () {
                    logger.service_worker('Service #' + service.id + ' (jabber) reconnecting ...');

                    internalServiceWorker.initJabber(service)
                        .catch(err => {
                            logger.service_worker('Service #' + service.id + ' (jabber) ERROR: ' + err.message);
                        });
                }, 2000);
            });

            obj.handler.on('chat', (from, message) => {
                logger.service_worker('Service #' + service.id + ' (jabber) Chat:', message, from);
                obj.handler.send(from, 'Sorry dude, I\'m not the talkative type.');
            });

            obj.handler.on('error', err => {
                //if (err.name !== 'presence') {
                    logger.error('Service #' + service.id + ' (jabber) ERROR:', err);
                //}
            });

            obj.handler.on('subscribe', from => {
                logger.service_worker('Service #' + service.id + ' (jabber) Accepting subscription from:', from);
                obj.handler.acceptSubscription(from);
            });

            obj.handler.on('roster', roster => {
                logger.service_worker('Service #' + service.id + ' (jabber) Received Roster with ' + roster.length + ' people');
                obj.roster = roster;
            });


            obj.handler.connect();

            resolve();
        });
    },

    /**
     * @param   {Integer}  service_id
     * @returns {null}
     */
    getService: service_id => {
        if (typeof internalServiceWorker.services['service-' + service_id] !== 'undefined') {
            return internalServiceWorker.services['service-' + service_id];
        }

        return null;
    },

    /**
     * @param   {Integer}  service_id
     * @returns {boolean}
     */
    isOnline: service_id => {
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
                                                .catch(err => {
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
                switch (service.type) {
                    case 'slack':
                        let slack_options = {
                            icon_url: service.data.icon_url || 'https://public.jc21.com/juxtapose/icons/default.png'
                        };

                        if (typeof message === 'object') {
                            slack_options = _.assign({}, slack_options, message);
                            message       = '';
                        }

                        service.handler.postMessageToUser(username, message, slack_options)
                            .fail(function (data) {
                                reject(new Error(data.error));
                            })
                            .then(function (data) {
                                resolve(data || true);
                            });
                        break;

                    case 'jabber':
                        service.handler.send(username, message);
                        resolve(true);
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
    getUsers: service_id => {
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

                    case 'jabber':
                        if (typeof service.roster !== 'undefined') {
                            resolve(_.sortBy(service.roster, ['name']));
                        } else {
                            reject(new Error('Roster is not set'));
                        }
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
