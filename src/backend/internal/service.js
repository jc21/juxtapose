'use strict';

const _            = require('lodash');
const config       = require('config');
const error        = require('../lib/error');
const serviceModel = require('../models/service');
const batchflow    = require('batchflow');
const crypto       = require('crypto');
const jwt          = require('jsonwebtoken');

function omissions () {
    return ['is_deleted'];
}

const internalService = {

    /**
     * @param   {Access}  access
     * @param   {Object}  data
     * @returns {Promise}
     */
    create: (access, data) => {
        if (typeof data.is_disabled !== 'undefined') {
            data.is_disabled = data.is_disabled ? 1 : 0;
        }

        return access.can('services', data)
            .then(() => {
                return serviceModel
                    .query()
                    .omit(omissions())
                    .insertAndFetch(data);
            })
            .then(service => {
                if (service.type === 'slack' || service.type === 'jabber') {
                    const internalServiceWorker = require('./service_worker');
                    internalServiceWorker.restart();
                } else if (service.type.match(/(.|\n)*-webhook$/im)) {
                    return internalService.generateEndpointToken(service)
                        .then(token => {
                            service.data.token = token;
                            return serviceModel
                                .query()
                                .patchAndFetchById(service.id, {data: service.data});
                        });
                } else {
                    return data;
                }
            })
            .then(service => {
                return _.omit(service, omissions());
            });
    },

    /**
     * @param  {Access}  access
     * @param  {Object}  data
     * @param  {Integer} data.id
     * @param  {String}  [data.name]
     * @return {Promise}
     */
    update: (access, data) => {
        return access.can('services', data.id)
            .then(() => {
                if (data.type.match(/(.|\n)*-webhook$/im)) {
                    return internalService.generateEndpointToken(data)
                        .then(token => {
                            data.data.token = token;
                            return data;
                        });
                } else {
                    return data;
                }
            })
            .then(row_data => {
                return serviceModel
                    .query()
                    .omit(omissions())
                    .patchAndFetchById(row_data.id, row_data)
                    .then(service => {
                        if (service.type === 'slack' || service.type === 'jabber') {
                            const internalServiceWorker = require('./service_worker');
                            internalServiceWorker.restart();
                        }

                        return _.omit(service, omissions());
                    });
            });
    },

    /**
     * @param  {Access}   access
     * @param  {Object}   data
     * @param  {Integer}  data.id
     * @param  {Array}    [data.expand]
     * @param  {Array}    [data.omit]
     * @return {Promise}
     */
    get: (access, data) => {
        return access.can('services', data.id)
            .then(() => {
                let query = serviceModel
                    .query()
                    .where('id', data.id)
                    .first();

                // Custom omissions
                if (typeof data.omit !== 'undefined' && data.omit !== null) {
                    query.omit(data.omit);
                }

                if (typeof data.expand !== 'undefined' && data.expand !== null) {
                    query.eager('[' + data.expand.join(', ') + ']');
                }

                return query;
            })
            .then((row) => {
                if (row) {
                    return _.omit(row, omissions());
                } else {
                    throw new error.ItemNotFoundError(data.id);
                }
            });
    },

    /**
     * @param   {Access}  access
     * @param   {Object}  data
     * @param   {Integer} data.id
     * @returns {Promise}
     */
    delete: (access, data) => {
        return access.can('services', data.id)
            .then(() => {
                return internalService.get(access, {id: data.id});
            })
            .then(service => {
                if (!service) {
                    throw new error.ItemNotFoundError(data.id);
                }

                return serviceModel
                    .query()
                    .where('id', service.id)
                    .patch({
                        is_deleted: 1
                    })
                    .then(() => {
                        if (service.type === 'slack' || service.type === 'jabber') {
                            const internalServiceWorker = require('./service_worker');
                            internalServiceWorker.restart();
                        }

                        return true;
                    });
            });
    },

    /**
     * This will only count the services
     *
     * @param {Access}  access
     * @param {String}  [search_query]
     * @returns {*}
     */
    getCount: (access, search_query) => {
        return access.can('services')
            .then(() => {
                let query = serviceModel
                    .query()
                    .count('id as count')
                    .first('count');

                // Query is used for searching
                if (typeof search_query === 'string') {
                    query.where(function () {
                        this.where('service.name', 'like', '%' + search_query + '%')
                            .orWhere('service.data', 'like', '%' + search_query + '%');
                    });
                }

                return query;
            })
            .then((row) => {
                return parseInt(row.count, 10);
            });
    },

    /**
     * All services
     *
     * @param   {Access}  access
     * @param   {Integer} [start]
     * @param   {Integer} [limit]
     * @param   {Array}   [sort]
     * @param   {Array}   [expand]
     * @param   {String}  [search_query]
     * @returns {Promise}
     */
    getAll: (access, start, limit, sort, expand, search_query) => {
        return access.can('services')
            .then(() => {
                let query = serviceModel
                    .query()
                    .where('is_deleted', 0)
                    .limit(limit ? limit : 100)
                    .omit(['is_deleted']);

                if (typeof start !== 'undefined' && start !== null) {
                    query.offset(start);
                }

                if (typeof sort !== 'undefined' && sort !== null) {
                    _.map(sort, (item) => {
                        query.orderBy(item.field, item.dir);
                    });
                } else {
                    query.orderBy('name', 'DESC');
                }

                // Query is used for searching
                if (typeof search_query === 'string') {
                    query.where(function () {
                        this.where('service.name', 'like', '%' + search_query + '%')
                            .orWhere('service.data', 'like', '%' + search_query + '%');
                    });
                }

                if (typeof expand !== 'undefined' && expand !== null) {
                    query.eager('[' + expand.join(', ') + ']');
                }

                return query;
            })
            .then((services) => {
                return new Promise((resolve/*, reject*/) => {
                    const internalServiceWorker = require('./service_worker');

                    batchflow(services).parallel()
                        .each((i, service, done) => {
                            if (service.type.match(/(.|\n)*-webhook$/im)) {
                                service.online = true;
                            } else {
                                service.online = internalServiceWorker.isOnline(service.id);
                            }

                            done(service);
                        })
                        .end(function (results) {
                            resolve(results);
                        });
                });
            });
    },

    /**
     * @param  {Access}  access
     * @param  {Object}  data
     * @param  {Integer} data.id
     * @param  {String}  data.username
     * @param  {String}  data.message
     * @return {Promise}
     */
    test: (access, data) => {
        const internalServiceWorker = require('./service_worker');

        return access.can('services', data.id)
            .then(() => {
                return internalServiceWorker.sendMessage(data.id, data.username, data.message);
            });
    },

    /**
     *
     * @param {Access}  access
     * @param {Integer} service_id
     */
    getUsers: (access, service_id) => {
        const internalServiceWorker = require('./service_worker');

        return access.can('services:users')
            .then(() => {
                return internalServiceWorker.getUsers(service_id);
            });
    },

    /**
     * @param {Access} access
     */
    getAvailable: (access) => {
        return access.can('services:available')
            .then(() => {
                return serviceModel
                    .query()
                    .where('is_deleted', 0)
                    .omit(['is_deleted', 'data', 'created_on', 'modified_on']);
            });
    },

    /**
     * Internal service worker use only
     *
     * TODO: Active state on services?
     */
    getActiveServices: () => {
        return serviceModel
            .query()
            .where('is_deleted', 0);
    },

    /**
     * Internal use
     *
     * @param  {Object}  row
     * @param  {Integer} row.id
     * @param  {Object}  row.data
     * @param  {String}  row.data.validation_key
     * @return {Promise}
     */
    generateEndpointToken: (row) => {
        let private_key = config.get('jwt.key');
        let options     = {algorithm: 'RS256'};

        let payload = {
            s: row.id,                  // Service ID
            k: row.data.validation_key  // Validation Key
        };

        payload.jti = crypto.randomBytes(12)
            .toString('base64')
            .substr(-8);

        return new Promise((resolve, reject) => {
            if (!row.data.validation_key) {
                reject(new Error('Validation Key not defined!'));
            } else {
                jwt.sign(payload, private_key, options, (err, token) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(token);
                    }
                });
            }
        });
    }
};

module.exports = internalService;
