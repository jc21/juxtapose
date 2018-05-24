'use strict';

const migrate_name = 'zendesk';
const logger       = require('../logger').migrate;

/**
 * Migrate
 *
 * @see http://knexjs.org/#Schema
 *
 * @param   {Object}  knex
 * @param   {Promise} Promise
 * @returns {Promise}
 */
exports.up = function (knex/*, Promise*/) {
    logger.info('[' + migrate_name + '] Migrating Up...');

    return knex.schema.createTable('zendesk_incoming_log', table => {
        table.increments().primary();
        table.dateTime('created_on').notNull();
        table.dateTime('modified_on').notNull();
        table.integer('service_id').notNull().unsigned();
        table.json('data').notNull();
    })
        .then(() => {
            logger.info('[' + migrate_name + '] zendesk_incoming_log Table created');

            return knex.schema.createTable('zendesk_ticket_status', table => {
                table.increments().primary();
                table.dateTime('created_on').notNull();
                table.dateTime('modified_on').notNull();
                table.integer('service_id').notNull().unsigned();
                table.integer('ticket_id').notNull().unsigned();
                table.json('data').notNull();
                table.unique(['service_id', 'ticket_id']);
            });
        })
        .then(() => {
            logger.info('[' + migrate_name + '] zendesk_ticket_status Table created');
        });
};

/**
 * Undo Migrate
 *
 * @param   {Object}  knex
 * @param   {Promise} Promise
 * @returns {Promise}
 */
exports.down = function (knex, Promise) {
    logger.warn('[' + migrate_name + '] You can\'t migrate down this one.');
    return Promise.resolve(true);
};
