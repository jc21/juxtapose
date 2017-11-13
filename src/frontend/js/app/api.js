'use strict';

import $ from 'jquery';
import _ from 'underscore';

/**
 * @param {String} message
 * @param {*} debug
 * @constructor
 */
const ApiError = function (message, debug, code) {
    let temp  = Error.call(this, message);
    temp.name = this.name = 'ApiError';
    this.stack   = temp.stack;
    this.message = temp.message;
    this.debug   = debug;
    this.code    = code;
};

ApiError.prototype = Object.create(Error.prototype, {
    constructor: {
        value:        ApiError,
        writable:     true,
        configurable: true
    }
});

/**
 *
 * @param {String} verb
 * @param {String} path
 * @param {Object} [data]
 * @param {Object} [options]
 * @returns {Promise}
 */
function fetch (verb, path, data, options) {
    options = options || {};

    return new Promise(function (resolve, reject) {
        let api_url = '/api/';
        let url     = api_url + path;
        let token   = window.localStorage.getItem('juxtapose-token') || null;

        $.ajax({
            url:         url,
            data:        typeof data === 'object' ? JSON.stringify(data) : data,
            type:        verb,
            dataType:    'json',
            contentType: 'application/json; charset=UTF-8',
            crossDomain: true,
            timeout:     (options.timeout ? options.timeout : 15000),
            xhrFields:   {
                withCredentials: true
            },

            beforeSend: function (xhr) {
                xhr.setRequestHeader('Authorization', 'Bearer ' + token);
            },

            success: function (data, textStatus, response) {
                let total = response.getResponseHeader('X-Dataset-Total');
                if (total !== null) {
                    resolve({
                        data:       data,
                        pagination: {
                            total:  parseInt(total, 10),
                            offset: parseInt(response.getResponseHeader('X-Dataset-Offset'), 10),
                            limit:  parseInt(response.getResponseHeader('X-Dataset-Limit'), 10)
                        }
                    });
                } else {
                    resolve(response);
                }
            },

            error: function (xhr, status, error_thrown) {
                let code = 400;

                if (typeof xhr.responseJSON !== 'undefined' && typeof xhr.responseJSON.error !== 'undefined' && typeof xhr.responseJSON.error.message !== 'undefined') {
                    error_thrown = xhr.responseJSON.error.message;
                    code         = xhr.responseJSON.error.code || 500;
                }

                reject(new ApiError(error_thrown, xhr.responseText, code));
            }
        });
    });
}

/**
 *
 * @param {Array} expand
 * @returns {String}
 */
function makeExpansionString (expand) {
    let items = [];
    _.forEach(expand, function (exp) {
        items.push(encodeURIComponent(exp));
    });

    return items.join(',');
}

module.exports = {
    status: function () {
        return fetch('get', '');
    },

    Tokens: {

        /**
         * @param {String} identity
         * @param {String} secret
         * @returns {Promise}
         */
        login: function (identity, secret) {
            return fetch('post', 'tokens', {identity: identity, secret: secret})
                .then(function (response) {
                    if (response.token) {
                        // Set storage token
                        window.localStorage.setItem('juxtapose-token', response.token);
                        return response.token;
                    } else {
                        window.localStorage.removeItem('juxtapose-token');
                    }

                    throw(new Error('No token returned'));
                });
        },

        /**
         * @returns {Promise}
         */
        refresh: function () {
            return fetch('get', 'tokens')
                .then(function (response) {
                    if (response.token) {
                        window.localStorage.setItem('juxtapose-token', response.token);
                        return response.token;
                    } else {
                        window.localStorage.removeItem('juxtapose-token');
                    }

                    throw(new Error('No token returned'));
                });
        }
    },

    Users: {

        /**
         * @param   {Integer|String}  user_id
         * @param   {Array}           [expand]
         * @returns {Promise}
         */
        getById: function (user_id, expand) {
            return fetch('get', 'users/' + user_id + (typeof expand === 'object' && expand.length ? '?expand=' + makeExpansionString(expand) : ''));
        },

        /**
         * @param   {Integer}  [offset]
         * @param   {Integer}  [limit]
         * @param   {String}   [sort]
         * @param   {Array}    [expand]
         * @param   {String}   [query]
         * @returns {Promise}
         */
        getAll: function (offset, limit, sort, expand, query) {
            return fetch('get', 'users?offset=' + (offset ? offset : 0) + '&limit=' + (limit ? limit : 20) + (sort ? '&sort=' + sort : '') +
                (typeof expand === 'object' && expand !== null && expand.length ? '&expand=' + makeExpansionString(expand) : '') +
                (typeof query === 'string' ? '&query=' + query : ''));
        },

        /**
         * @param   {Object}  data
         * @returns {Promise}
         */
        create: function (data) {
            return fetch('post', 'users', data);
        },

        /**
         * @param   {Object}   data
         * @param   {Integer}  data.id
         * @returns {Promise}
         */
        update: function (data) {
            let id = data.id;
            delete data.id;
            return fetch('put', 'users/' + id, data);
        },

        /**
         * @param   {Integer}  id
         * @returns {Promise}
         */
        delete: function (id) {
            return fetch('delete', 'users/' + id);
        },

        /**
         *
         * @param   {Integer}  id
         * @param   {Object}   auth
         * @returns {Promise}
         */
        setPassword: function (id, auth) {
            return fetch('put', 'users/' + id + '/auth', auth);
        },

        /**
         * @param   {Integer}  id
         * @param   {Object}   settings
         * @returns {Promise}
         */
        saveServiceSettings: function (id, settings) {
            return fetch('post', 'users/' + id + '/services', {settings: settings});
        }
    },

    Services: {

        /**
         * This is different to getAll in that it is not paginatable, it is available to
         * all users and it doesn't return configuration info.
         */
        getAvailable: function () {
            return fetch('get', 'services/available');
        },

        /**
         * @param   {Integer}  [offset]
         * @param   {Integer}  [limit]
         * @param   {String}   [sort]
         * @param   {Array}    [expand]
         * @param   {String}   [query]
         * @returns {Promise}
         */
        getAll: function (offset, limit, sort, expand, query) {
            return fetch('get', 'services?offset=' + (offset ? offset : 0) + '&limit=' + (limit ? limit : 20) + (sort ? '&sort=' + sort : '') +
                (typeof expand === 'object' && expand !== null && expand.length ? '&expand=' + makeExpansionString(expand) : '') +
                (typeof query === 'string' ? '&query=' + query : ''));
        },

        /**
         * @param   {Object}  data
         * @returns {Promise}
         */
        create: function (data) {
            return fetch('post', 'services', data);
        },

        /**
         * @param   {Object}   data
         * @param   {Integer}  data.id
         * @returns {Promise}
         */
        update: function (data) {
            let id = data.id;
            delete data.id;
            return fetch('put', 'services/' + id, data);
        },

        /**
         * @param   {Integer}  id
         * @returns {Promise}
         */
        delete: function (id) {
            return fetch('delete', 'services/' + id);
        },

        /**
         * @param   {Integer}  id
         * @param   {Object}   data
         * @returns {Promise}
         */
        test: function (id, data) {
            return fetch('post', 'services/' + id + '/test', data);
        },

        /**
         * @returns {Promise}
         */
        restart: function () {
            return fetch('post', 'services/restart');
        }
    },

    Rules: {

        /**
         * @param   {Object}  data
         * @returns {Promise}
         */
        create: function (data) {
            return fetch('post', 'rules', data);
        },

        /**
         * @param   {Integer}  id
         * @returns {Promise}
         */
        delete: function (id) {
            return fetch('delete', 'rules/' + id);
        },

        /**
         * @param   {Integer}  rule_id
         * @param   {Array}    [expand]
         * @returns {Promise}
         */
        getById: function (rule_id, expand) {
            return fetch('get', 'rules/' + rule_id + (typeof expand === 'object' && expand.length ? '?expand=' + makeExpansionString(expand) : ''));
        },

        /**
         * @param   {Integer}  [offset]
         * @param   {Integer}  [limit]
         * @param   {String}   [sort]
         * @param   {Array}    [expand]
         * @returns {Promise}
         */
        getAll: function (offset, limit, sort, expand) {
            return fetch('get', 'rules?offset=' + (offset ? offset : 0) + '&limit=' + (limit ? limit : 20) + (sort ? '&sort=' + sort : '') +
                (typeof expand === 'object' && expand !== null && expand.length ? '&expand=' + makeExpansionString(expand) : ''));
        },

        /**
         * @param   {Array}  order
         * @returns {Promise}
         */
        setOrder: function (order) {
            return fetch('post', 'rules/order', order);
        }
    },

    Notifications: {

        /**
         * @param   {Integer}  [offset]
         * @param   {Integer}  [limit]
         * @param   {String}   [sort]
         * @param   {Array}    [expand]
         * @returns {Promise}
         */
        getAll: function (offset, limit, sort, expand) {
            return fetch('get', 'notifications?offset=' + (offset ? offset : 0) + '&limit=' + (limit ? limit : 20) + (sort ? '&sort=' + sort : '') +
                (typeof expand === 'object' && expand !== null && expand.length ? '&expand=' + makeExpansionString(expand) : ''));
        }
    },

    Templates: {

        /**
         * @param   {Integer}  [offset]
         * @param   {Integer}  [limit]
         * @param   {String}   [sort]
         * @param   {Array}    [expand]
         * @param   {String}   [query]
         * @param   {String}   [service_type]
         * @param   {String}   [event_type]
         * @returns {Promise}
         */
        getAll: function (offset, limit, sort, expand, query, service_type, event_type) {
            return fetch('get', 'templates?offset=' + (offset ? offset : 0) + '&limit=' + (limit ? limit : 200) + (sort ? '&sort=' + sort : '') +
                (typeof expand === 'object' && expand !== null && expand.length ? '&expand=' + makeExpansionString(expand) : '') +
                (typeof query === 'string' ? '&query=' + query : '') +
                (typeof service_type === 'string' ? '&service_type=' + service_type : '') +
                (typeof event_type === 'string' ? '&event_type=' + event_type : '')
            );
        },

        /**
         * @param {Object}  data
         * @returns {Promise}
         */
        create: function (data) {
            return fetch('post', 'templates', data);
        },

        /**
         * @param   {Object}   data
         * @param   {Integer}  data.id
         * @returns {Promise}
         */
        update: function (data) {
            let id = data.id;
            delete data.id;
            return fetch('put', 'templates/' + id, data);
        },

        /**
         * @param   {Integer}  id
         * @returns {Promise}
         */
        delete: function (id) {
            return fetch('delete', 'templates/' + id);
        }
    }
};
