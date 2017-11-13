'use strict';

const _                     = require('lodash');
const debug                 = require('debug')('juxtapose:internal:notification');
const notifcationQueueModel = require('../models/notification_queue');

const internalNotification = {

    /**
     * This will only count the notifications
     *
     * @param   {Access}  access
     * @returns {*}
     */
    getCount: (access) => {
        return access.can('notifications:list')
            .then(() => {
                return notifcationQueueModel
                    .query()
                    .where('user_id', access.token.get('attrs').id)
                    .count('id as count')
                    .first('count');
            })
            .then((row) => {
                return parseInt(row.count, 10);
            });
    },

    /**
     * All notifications
     *
     * @param   {Access}  access
     * @param   {Integer} [start]
     * @param   {Integer} [limit]
     * @param   {Array}   [sort]
     * @param   {Array}   [expand]
     * @returns {Promise}
     */
    getAll: (access, start, limit, sort, expand) => {
        return access.can('notifications:list')
            .then(() => {
                let query = notifcationQueueModel
                    .query()
                    .andWhere('user_id', access.token.get('attrs').id)
                    .limit(limit ? limit : 50)
                    .allowEager('[rule.[template, in_service], service]');

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
    }
};

module.exports = internalNotification;
