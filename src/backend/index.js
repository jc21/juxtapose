#!/usr/bin/env node

'use strict';

const app           = require('./app');
const logger        = require('./logger');
const config        = require('config');
const migrate       = require('./migrate');
const setup         = require('./setup');
const apiValidator  = require('./lib/validator/api');
const serviceWorker = require('./internal/service_worker');

let port = process.env.PORT || 80;

if (config.has('port')) {
    port = config.get('port');
}

migrate.latest()
    .then(() => {
        return setup();
    })
    .then(() => {
        return apiValidator.loadSchemas;
    })
    .then(() => {
        const server = app.listen(port, () => {
            logger.info('PID ' + process.pid + ' listening on port ' + port + ' ...');

            serviceWorker.start();

            process.on('SIGTERM', () => {
                logger.info('PID ' + process.pid + ' received SIGTERM');
                server.close(() => {
                    logger.info('Stopping.');
                    process.exit(0);
                });
            });
        });
    })
    .catch((err) => {
        logger.error(err);
        process.exit(1);
    });
