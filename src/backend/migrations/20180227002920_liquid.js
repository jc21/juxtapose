'use strict';

const migrate_name  = 'liquid';
const logger        = require('../logger').migrate;
const templateModel = require('../models/template');
const batchflow     = require('batchflow');

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

    return knex.schema.table('template', function (table) {
        // This might already exist if coming from a blank database
        table.string('render_engine', '15').notNull().defaultTo('');
    })
        .then(() => {
            logger.info('[' + migrate_name + '] template Table updated');
        })
        .catch(ex => {
            logger.info('[' + migrate_name + '] template Table already up to date');
        })
        .then(() => {
            // Find all templates without a render engine set, and update their content and render_engine
            return templateModel
                .query()
                .where({render_engine: ''})
                .then(rows => {

                    return new Promise((resolve, reject) => {
                        batchflow(rows).sequential()
                            .each((i, row, next) => {
                                let content = row.content.replace(/<%(-|=)/gi, '{{').replace(/%>/gi, '}}');
                                content     = JSON.stringify(JSON.parse(content), null, 2);

                                templateModel
                                    .query()
                                    .patch({
                                        content:       content,
                                        render_engine: 'liquid'
                                    })
                                    .where('id', row.id)
                                    .then(next)
                                    .catch(next);
                            })
                            .error(err => {
                                reject(err);
                            })
                            .end((/*results*/) => {
                                resolve(true);
                            });
                        });
                });
        })
        .then(() => {
            logger.info('[' + migrate_name + '] template Table data updated');
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
