'use strict';

const db      = require('./db');
const logger  = require('./logger');

module.exports = {
    latest: function () {
        return db.migrate.currentVersion()
            .then((version) => {
                logger.migrate('Current database version:', version);
                return db.migrate.latest();
            });
    }
};
