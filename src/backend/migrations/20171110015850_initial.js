'use strict';

const migrate_name = 'initial-schema';
const logger       = require('../logger');

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
    logger.migrate('[' + migrate_name + '] Migrating Up...');

    return knex.schema.createTable('auth', (table) => {
        table.increments().primary();
        table.dateTime('created_on').notNull();
        table.dateTime('modified_on').notNull();
        table.integer('user_id').notNull().unsigned();
        table.string('type', 30).notNull();
        table.string('secret').notNull();
        table.json('meta').notNull();
        table.integer('is_deleted').notNull().unsigned().defaultTo(0);
    })
        .then(() => {
            logger.migrate('[' + migrate_name + '] auth Table created');

            return knex.schema.createTable('user', (table) => {
                table.increments().primary();
                table.dateTime('created_on').notNull();
                table.dateTime('modified_on').notNull();
                table.integer('is_deleted').notNull().unsigned().defaultTo(0);
                table.integer('is_disabled').notNull().unsigned().defaultTo(0);
                table.string('email').notNull();
                table.string('name').notNull();
                table.string('nickname').notNull();
                table.string('avatar').notNull();
                table.json('roles').notNull();
            });
        })
        .then(() => {
            logger.migrate('[' + migrate_name + '] user Table created');

            return knex.schema.createTable('service', (table) => {
                table.increments().primary();
                table.dateTime('created_on').notNull();
                table.dateTime('modified_on').notNull();
                table.integer('is_deleted').notNull().unsigned().defaultTo(0);
                table.string('type', 30).notNull();
                table.string('name').notNull();
                table.json('data').notNull();
            });
        })
        .then(() => {
            logger.migrate('[' + migrate_name + '] service Table created');

            return knex.schema.createTable('user_has_service_data', (table) => {
                table.integer('user_id').notNull().unsigned();
                table.integer('service_id').notNull().unsigned();
                table.dateTime('created_on').notNull();
                table.dateTime('modified_on').notNull();
                table.string('service_username').notNull();
                table.json('data').notNull();
                table.primary(['user_id', 'service_id']);
            });
        })
        .then(() => {
            logger.migrate('[' + migrate_name + '] user_has_service_data Table created');

            return knex.schema.createTable('template', (table) => {
                table.increments().primary();
                table.dateTime('created_on').notNull();
                table.dateTime('modified_on').notNull();
                table.integer('is_deleted').notNull().unsigned().defaultTo(0);
                table.string('service_type', 30).notNull();
                table.string('in_service_type', 30).notNull();
                table.string('name').notNull();
                table.json('content').notNull();
                table.json('default_options').notNull();
                table.json('example_data').notNull();
            });
        })
        .then(() => {
            logger.migrate('[' + migrate_name + '] template Table created');

            return knex.schema.createTable('template_has_event', (table) => {
                table.increments().primary();
                table.dateTime('created_on').notNull();
                table.dateTime('modified_on').notNull();
                table.integer('template_id').notNull().unsigned();
                table.string('event_type', 50).notNull();
            });
        })
        .then(() => {
            logger.migrate('[' + migrate_name + '] template_has_event Table created');

            return knex.schema.createTable('rule', (table) => {
                table.increments().primary();
                table.dateTime('created_on').notNull();
                table.dateTime('modified_on').notNull();
                table.integer('is_deleted').notNull().unsigned().defaultTo(0);
                table.integer('user_id').notNull().unsigned();
                table.integer('priority_order').notNull().unsigned();
                table.integer('in_service_id').notNull().unsigned();
                table.string('trigger', 50).notNull();
                table.json('extra_conditions').notNull();
                table.integer('out_service_id').notNull().unsigned();
                table.integer('out_template_id').notNull().unsigned();
                table.json('out_template_options').notNull();
                table.integer('fired_count').notNull().unsigned().defaultTo(0);
            });
        })
        .then(() => {
            logger.migrate('[' + migrate_name + '] rule Table created');

            return knex.schema.createTable('notification_queue', (table) => {
                table.increments().primary();
                table.dateTime('created_on').notNull();
                table.dateTime('modified_on').notNull();
                table.integer('user_id').notNull().unsigned();
                table.integer('rule_id').notNull().unsigned();
                table.integer('service_id').notNull().unsigned();
                table.json('content').notNull();
                table.string('status', 20).notNull();
                table.index(['status'], 'statusIdx');
            });
        })
        .then(() => {
            logger.migrate('[' + migrate_name + '] notification_queue Table created');

            return knex.schema.createTable('jira_issue_status', (table) => {
                table.increments().primary();
                table.dateTime('created_on').notNull();
                table.dateTime('modified_on').notNull();
                table.integer('service_id').notNull().unsigned();
                table.integer('issue_id').notNull().unsigned();
                table.string('issue_key', 20).notNull();
                table.string('assignee_username', 50).notNull();
                table.integer('is_resolved').notNull().unsigned().defaultTo(0);
                table.unique(['service_id', 'issue_id']);
            });
        })
        .then(() => {
            logger.migrate('[' + migrate_name + '] jira_issue_status Table created');

            return knex.schema.createTable('jira_incoming_log', (table) => {
                table.increments().primary();
                table.dateTime('created_on').notNull();
                table.dateTime('modified_on').notNull();
                table.integer('service_id').notNull().unsigned();
                table.json('data').notNull();
            });
        })
        .then(() => {
            logger.migrate('[' + migrate_name + '] jira_incoming_log Table created');

            return knex.schema.createTable('bitbucket_incoming_log', (table) => {
                table.increments().primary();
                table.dateTime('created_on').notNull();
                table.dateTime('modified_on').notNull();
                table.integer('service_id').notNull().unsigned();
                table.json('data').notNull();
            });
        })
        .then(() => {
            logger.migrate('[' + migrate_name + '] bitbucket_incoming_log Table created');

            return knex.schema.createTable('dockerhub_incoming_log', (table) => {
                table.increments().primary();
                table.dateTime('created_on').notNull();
                table.dateTime('modified_on').notNull();
                table.integer('service_id').notNull().unsigned();
                table.json('data').notNull();
            });
        })
        .then(() => {
            logger.migrate('[' + migrate_name + '] dockerhub_incoming_log Table created');
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
    logger.migrate('[' + migrate_name + '] You can\'t migrate down the initial data.');
    return Promise.resolve(true);
};
