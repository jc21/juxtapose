'use strict';

const express = require('express');
const pjson   = require('../../../../package.json');

let router = express.Router({
    caseSensitive: true,
    strict:        true,
    mergeParams:   true
});

/**
 * Health Check
 * GET /api
 */
router.get('/', (req, res/*, next*/) => {
    let version = pjson.version.split('-').shift().split('.');

    res.status(200).send({
        status:  'OK',
        version: {
            major:    parseInt(version.shift(), 10),
            minor:    parseInt(version.shift(), 10),
            revision: parseInt(version.shift(), 10)
        }
    });
});

router.use('/tokens',        require('./tokens'));
router.use('/users',         require('./users'));
router.use('/services',      require('./services'));
router.use('/rules',         require('./rules'));
router.use('/templates',     require('./templates'));
router.use('/notifications', require('./notifications'));

module.exports = router;
