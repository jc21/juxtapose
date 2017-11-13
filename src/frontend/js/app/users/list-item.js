'use strict';

import Mn from 'backbone.marionette';

const template   = require('./list-item.ejs');
const Controller = require('../controller');
const Api        = require('../api');

module.exports = Mn.View.extend({
    template: template,
    tagName:  'tr',

    ui: {
        user:             'a.user-link',
        edit:             '.btn-edit',
        password:         '.btn-password',
        service_settings: '.btn-service-settings'
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
                .then((services) => {
                    if (!view.isDestroyed()) {
                        Controller.showUserServiceSettingsForm(this.model, services);
                        this.ui.service_settings.prop('disabled', false).removeClass('btn-disabled');
                    }
                })
                .catch((err) => {
                    Controller.showError(err, 'Could not fetch available services');
                    this.ui.service_settings.prop('disabled', false).removeClass('btn-disabled');
                });
        }
    },

    templateContext: function () {
        let view = this;

        return {
            getAvatar: function () {
                return view.model.get('avatar') || '//d105my0i9v4ibf.cloudfront.net/c/live/2.11.277-83f1b21/img/default-avatar.jpg';
            }
        };
    },

    initialize: function () {
        this.listenTo(this.model, 'change', this.render)
    }
});
