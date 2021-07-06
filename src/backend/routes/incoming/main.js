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
router.use('/gerrit-webhook',    require('./gerrit-webhook'));
router.use('/gchat',             require('./gchat-bot'));
router.use('/jenkins-webhook',   require('./jenkins-webhook'));
router.use('/zendesk-webhook',   require('./zendesk-webhook'));

module.exports = router;
