'use strict';

import Mn from 'backbone.marionette';

const template   = require('./main.ejs');
const Controller = require('../../controller');
const Cache      = require('../../cache');

module.exports = Mn.View.extend({
    template: template,

    ui: {
        links: 'a[href^="#"]'
    },

    events: {
        'click @ui.links': function (e) {
            e.preventDefault();

            let href = e.target.href.replace(/[^#]*#/g, '');

            switch (href) {
                case 'rules':
                    Controller.showRules();
                    break;

                case 'users':
                    Controller.showUsers();
                    break;

                case 'services':
                    Controller.showServices();
                    break;

                case 'templates':
                    Controller.showTemplates();
                    break;

                case 'notifications':
                    Controller.showNotifications();
                    break;
            }
        }
    },

    templateContext: {
        isAdmin: function () {
            return Cache.User.isAdmin();
        }
    }
});
