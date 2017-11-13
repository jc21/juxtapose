'use strict';

const Mn         = require('../lib/marionette');
const Controller = require('./controller');

module.exports = Mn.AppRouter.extend({
    appRoutes: {
        login:         'showLogin',
        users:         'showUsers',
        rules:         'showRules',
        services:      'showServices',
        templates:     'showTemplates',
        notifications: 'showNotifications',
        '*default':    'showRules'
    },

    initialize: function () {
        this.controller = Controller;
    }
});
