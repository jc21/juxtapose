'use strict';

const Mn         = require('backbone.marionette');
const template   = require('./main.ejs');
const Controller = require('../../controller');
const Cache      = require('../../cache');
const Api        = require('../../api');
const Tokens     = require('../../tokens');

module.exports = Mn.View.extend({
    template: template,

    ui: {
        logo:          '.navbar-brand',
        profile_link:  '.profile-link',
        services_link: '.services-link',
        password_link: '.password-link',
        logout_link:   '.logout-link'
    },

    events: {
        'click @ui.logo': function (e) {
            e.preventDefault();
            Controller.showRules();
        },

        'click @ui.profile_link': function (e) {
            e.preventDefault();
            Controller.showUserForm(Cache.User);
        },

        'click @ui.password_link': function (e) {
            e.preventDefault();
            Controller.showUserPasswordForm(Cache.User);
        },

        'click @ui.services_link': function (e) {
            e.preventDefault();

            let view = this;

            Api.Services.getAvailable()
                .then(services => {
                    if (!view.isDestroyed()) {
                        Controller.showUserServiceSettingsForm(Cache.User, services);
                    }
                })
                .catch(err => {
                    alert('Could not fetch available services: ' + err.message);
                });
        },

        'click @ui.logout_link': function (e) {
            e.preventDefault();
            Controller.logout();
        }
    },

    templateContext: function () {
        return {
            getAvatar: function () {
                return Cache.User.get('avatar') || '//d105my0i9v4ibf.cloudfront.net/c/live/2.11.277-83f1b21/img/default-avatar.jpg';
            },

            getName: function () {
                return Cache.User.get('nickname') || Cache.User.get('name');
            },

            hasOtherLogin: function () {
                return Tokens.getTokenCount() > 1;
            },

            getLogoutText: function () {
                if (Tokens.getTokenCount() > 1) {
                    return 'Log back in as ' + Tokens.getNextTokenName();
                }

                return 'Logout';
            }
        };
    },

    initialize: function () {
        this.listenTo(Cache.User, 'change', function () {
            this.render();
        });
    }
});
