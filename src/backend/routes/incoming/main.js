'use strict';

const express = require('express');

let router = express.Router({
    caseSensitive: true,
    strict:        true,
    mergeParams:   true
});

router.use('/jira-webhook',      require('./jira-webhook'));
router.use('/bitbucket-webhook', require('./bitbucket-webhook'));
router.use('/dockerhub-webhook', require('./dockerhub-webhook'));
router.use('/zendesk-webhook',   require('./zendesk-webhook'));
router.use('/jenkins-webhook',   require('./jenkins-webhook'));

module.exports = router;
