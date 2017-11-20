'use strict';

import _ from 'underscore';
import Mn from 'backbone.marionette';

const template         = require('./item.ejs');
const Controller       = require('../controller');
const Api              = require('../api');
const Cache            = require('../cache');
const preview_template = require('../template/preview/main.ejs');

module.exports = Mn.View.extend({
    template:  template,
    className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rule',

    ui: {
        del:      'a.delete-link',
        settings: '.warning-bubble'
    },

    events: {
        'click @ui.settings': function (e) {
            e.preventDefault();
            let view = this;

            Api.Services.getAvailable()
                .then((services) => {
                    if (!view.isDestroyed()) {
                        Controller.showUserServiceSettingsForm(Cache.User, services);
                    }
                })
                .catch((err) => {
                    alert('Could not fetch available services: ' + err.message);
                });
        },

        'click @ui.del': function (e) {
            e.preventDefault();
            Api.Rules.delete(this.model.get('id'))
                .then(() => {
                    Controller.showRules();
                })
                .catch((err) => {
                    alert('Could not delete rule: ' + err.message);
                });
        }
    },

    templateContext: function () {
        let view = this;

        return {
            getTriggerName: function () {
                return view.model.getTriggerName(view.model.get('in_service').type, view.model.get('trigger'));
            },

            getPreview: function () {
                let template     = view.model.get('template');
                template.preview = view.model.get('preview');
                template.bot_name = view.model.get('out_service').name;

                return preview_template(template);
            },

            isUserSetup: function () {
                if (view.model.get('in_service').type !== 'dockerhub-webhook') {
                    // Checks if the user has the services listed in this rule set up correctly
                    let services = Cache.User.get('services');

                    let in_service_config = _.find(services, function (o) {
                        return o.id === view.model.get('in_service_id');
                    });

                    let out_service_config = _.find(services, function (o) {
                        return o.id === view.model.get('out_service_id');
                    });

                    return in_service_config && out_service_config && in_service_config.service_username && out_service_config.service_username;
                }

                return true;
            },

            hasConditions: function () {
                let conditions = view.model.get('extra_conditions');
                let count = 0;

                _.map(conditions, function (val, key) {
                    if (typeof val !== 'string' || (typeof val === 'string' && val)) {
                        count++;
                    }
                });

                return count > 0;
            }
        };
    },

    initialize: function () {
        this.listenTo(this.model, 'change', this.render);
    }
});
