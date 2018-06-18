'use strict';

import Mn from 'backbone.marionette';

const template   = require('./list-item.ejs');
const Controller = require('../controller');
const Api        = require('../api');
const Cache      = require('../cache');
const Tokens     = require('../tokens');

module.exports = Mn.View.extend({
    template: template,
    tagName:  'tr',

    ui: {
        user:             'a.user-link',
        edit:             '.btn-edit',
        password:         '.btn-password',
        service_settings: '.btn-service-settings',
        copy_rules:       '.btn-copy-rules',
        login:            '.btn-login'
    },

    events: {
        'click @ui.user': function (e) {
            e.preventDefault();
            Controller.showUserForm(this.model);
        },

        'click @ui.edit': function (e) {
            e.preventDefault();
            Controller.showUserForm(this.model);
        },

        'click @ui.password': function (e) {
            e.preventDefault();
            Controller.showUserPasswordForm(this.model);
        },

        'click @ui.service_settings': function (e) {
            e.preventDefault();
            let view = this;

            this.ui.service_settings.prop('disabled', true).addClass('btn-disabled');

            Api.Services.getAvailable()
                .then(services => {
                    if (!view.isDestroyed()) {
                        Controller.showUserServiceSettingsForm(this.model, services);
                        this.ui.service_settings.prop('disabled', false).removeClass('btn-disabled');
                    }
                })
                .catch(err => {
                    Controller.showError(err, 'Could not fetch available services');
                    this.ui.service_settings.prop('disabled', false).removeClass('btn-disabled');
                });
        },

        'click @ui.copy_rules': function (e) {
            e.preventDefault();
            let view = this;

            this.ui.copy_rules.prop('disabled', true).addClass('btn-disabled');

            Api.Users.getAll()
                .then(users => {
                    if (!view.isDestroyed()) {
                        Controller.showUserCopyRules(this.model, users.data);
                        this.ui.copy_rules.prop('disabled', false).removeClass('btn-disabled');
                    }
                })
                .catch(err => {
                    Controller.showError(err, 'Could not fetch Users');
                    this.ui.copy_rules.prop('disabled', false).removeClass('btn-disabled');
                });
        },

        'click @ui.login': function (e) {
            e.preventDefault();
            this.ui.login.prop('disabled', true).addClass('btn-disabled');
            Api.Users.loginAs(this.model.get('id'))
                .then(res => {
                    Tokens.addToken(res.token, res.user.nickname || res.user.name);
                    window.location = '/';
                    window.location.reload();
                })
                .catch(err => {
                    alert(err.message);
                    this.ui.login.prop('disabled', false).removeClass('btn-disabled');
                });
        }
    },

    templateContext: function () {
        let view = this;

        return {
            getAvatar: function () {
                return view.model.get('avatar') || '//d105my0i9v4ibf.cloudfront.net/c/live/2.11.277-83f1b21/img/default-avatar.jpg';
            },

            isSelf: function () {
                return Cache.User.get('id') === view.model.get('id');
            }
        };
    },

    initialize: function () {
        this.listenTo(this.model, 'change', this.render);
    }
});
