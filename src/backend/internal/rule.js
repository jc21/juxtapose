'use strict';

const _         = require('lodash');
const error     = require('../lib/error');
const ruleModel = require('../models/rule');
const batchflow = require('batchflow');

function omissions () {
    return ['is_deleted'];
}

const internalRule = {

    /**
     * @param   {Access}  access
     * @param   {Object}  data
     * @returns {Promise}
     */
    create: (access, data) => {
        // Define some defaults if they were not set
        if (typeof data.user_id === 'undefined' || !data.user_id) {
            data.user_id = access.token.get('attrs').id;
        }

        if (typeof data.priority_order === 'undefined') {
            data.priority_order = 0;
        }

        if (typeof data.extra_conditions === 'undefined') {
            data.extra_conditions = {};
        }

        if (typeof data.out_template_options === 'undefined') {
            data.out_template_options = {};
        }

        return access.can('rules:create', data.user_id)
            .then(() => {
                return ruleModel
                    .query()
                    .omit(omissions())
                    .insertAndFetch(data);
            })
            .then(rule => {
                return _.omit(rule, omissions());
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
        //debug('Updating rule record', data);

        return access.can('rules:update', data.id)
            .then(() => {
                return ruleModel
                    .query()
                    .omit(omissions())
                    .patchAndFetchById(data.id, data)
                    .then(rule => {
                        return _.omit(rule, omissions());
                    });
            });
    },

    /**
     * @param   {Access}  access
     * @param   {Object}  data
     * @param   {Integer} data.id
     * @returns {Promise}
     */
    delete: (access, data) => {
        //debug('Deleting Rule record', data);

        return access.can('rules:delete', data.id)
            .then(() => {
                return internalRule.get(access, {id: data.id});
            })
            .then(rule => {
                if (!rule) {
                    throw new error.ItemNotFoundError(data.id);
                }

                return ruleModel
                    .query()
                    .where('id', rule.id)
                    .patch({
                        is_deleted: 1
                    })
                    .then(() => {
                        return true;
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
        return access.can('rules:get', data.id)
            .then(() => {
                let query = ruleModel
                    .query()
                    .where('id', data.id)
                    .allowEager('[user, in_service, out_service, template]')
                    .first();

                // Custom omissions
                if (typeof data.omit !== 'undefined' && data.omit !== null) {
                    query.omit(data.omit);
                }

                if (typeof data.expand !== 'undefined' && data.expand !== null) {
                    //debug('Rule Eager Loading', '[' + data.expand.join(', ') + ']');
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
     * This will only count the rules
     *
     * @param {Access}  access
     * @returns {*}
     */
    getCount: (access) => {
        return access.can('rules:list')
            .then(() => {
                return ruleModel
                    .query()
                    .where('user_id', access.token.get('attrs').id)
                    .andWhere('is_deleted', 0)
                    .count('id as count')
                    .first('count');
            })
            .then((row) => {
                return parseInt(row.count, 10);
            });
    },

    /**
     * All rules
     *
     * @param   {Access}  access
     * @param   {Integer} [start]
     * @param   {Integer} [limit]
     * @param   {Array}   [sort]
     * @param   {Array}   [expand]
     * @returns {Promise}
     */
    getAll: (access, start, limit, sort, expand) => {
        return access.can('rules:list')
            .then(() => {
                let query = ruleModel
                    .query()
                    .where('is_deleted', 0)
                    .andWhere('user_id', access.token.get('attrs').id)
                    .limit(limit ? limit : 100)
                    .omit(omissions())
                    .allowEager('[user, in_service, out_service, template]');

                if (typeof start !== 'undefined' && start !== null) {
                    query.offset(start);
                }

                if (typeof sort !== 'undefined' && sort !== null) {
                    _.map(sort, (item) => {
                        query.orderBy(item.field, item.dir);
                    });
                } else {
                    query.orderBy('created_on', 'DESC');
                }

                if (typeof expand !== 'undefined' && expand !== null) {
                    query.eager('[' + expand.join(', ') + ']');
                }

                return query;
            });
    },

    /**
     * Set Rule Order - not currently in use
     *
     * @param {Access}  access
     * @param {Array}   orders
     */
    setOrder: (access, orders) => {
        return access.can('rules:order')
            .then(() => {
                return new Promise((resolve, reject) => {
                    batchflow(orders).sequential()
                        .each((i, obj, next) => {
                            ruleModel
                                .query()
                                .patch({priority_order: obj.order})
                                .where('user_id', access.token.get('attrs').id)
                                .andWhere('id', obj.rule_id)
                                .then((res) => {
                                    next(_.assign({}, obj, {updated: res}));
                                });
                        })
                        .error(err => {
                            reject(err);
                        })
                        .end(results => {
                            resolve(results);
                        });
                });
            })
            .then(() => {
                return true;
            });
    },

    /**
     * Copy rules from one account to another
     *
     * @param {Access}   access
     * @param {Object}   data
     * @param {Integer}  data.from
     * @param {Integer}  data.to
     */
    copy: (access, data) => {
        return access.can('rules:copy')
            .then(() => {
                if (data.from === data.to) {
                    throw new error.ValidationError('Cannot copy rules to the same person');
                }

                // 1. Select rules from user
                return ruleModel
                    .query()
                    .where('is_deleted', 0)
                    .andWhere('user_id', data.from);
            })
            .then(rules => {
                // 2. Insert modified rules for a user
                return new Promise((resolve, reject) => {
                    batchflow(rules).sequential()
                        .each((i, rule, next) => {
                            let new_rule = _.omit(rule, ['fired_count', 'user_id', 'id']);
                            new_rule.user_id = data.to;

                            ruleModel
                                .query()
                                .insert(new_rule)
                                .then(() => {
                                    next();
                                })
                                .catch(err => {
                                    console.error(err);
                                    next(err);
                                });
                        })
                        .error(err => {
                            reject(err);
                        })
                        .end((/*results*/) => {
                            resolve(true);
                        });
                });
            });
    }
};

module.exports = internalRule;
