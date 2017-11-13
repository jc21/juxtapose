'use strict';

const migrate_name = 'identifier_for_migrate';
const logger       = require('../src/backend/logger');

/**
 * Migrate
 *
 * @see http://knexjs.org/#Schema
 *
 * @param {Object} knex
 * @param {Promise} Promise
 * @returns {Promise}
 */
exports.up = function (knex, Promise) {

    logger.migrate('[' + migrate_name + '] Migrating Up...');

    // Create Table example:

    /*return knex.schema.createTable('notification', (table) => {
         table.increments().primary();
         table.string('name').notNull();
         table.string('type').notNull();
         table.integer('created_on').notNull();
         table.integer('modified_on').notNull();
     })
     .then(function () {
        logger.migrate('[' + migrate_name + '] Notification Table created');
     });*/

    logger.migrate('[' + migrate_name + '] Migrating Up Complete');

    return Promise.resolve(true);
};

/**
 * Undo Migrate
 *
 * @param {Object} knex
 * @param {Promise} Promise
 * @returns {Promise}
 */
exports.down = function (knex, Promise) {
    logger.migrate('[' + migrate_name + '] Migrating Down...');

    // Drop table example:

    /*return knex.schema.dropTable('notification')
     .then(() => {
        logger.migrate('[' + migrate_name + '] Notification Table dropped');
     });*/

    logger.migrate('[' + migrate_name + '] Migrating Down Complete');

    return Promise.resolve(true);
};
