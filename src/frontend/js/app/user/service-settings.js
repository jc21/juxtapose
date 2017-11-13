'use strict';

import Mn from 'backbone.marionette';

const _          = require('underscore');
const template   = require('./service-settings.ejs');
const Api        = require('../api');
const App        = require('../main');
const UserModel  = require('../../models/user');

require('jquery-serializejson');

module.exports = Mn.View.extend({
    template: template,
    id:       'user-service-settings',

    ui: {
        form:    'form',
        buttons: 'form button',
        cancel:  'button.cancel'
    },

    events: {
        'submit @ui.form': function (e) {
            e.preventDefault();
            let data     = this.ui.form.serializeJSON();
            let settings = data.settings;
            let view     = this;

            this.ui.buttons.prop('disabled', true).addClass('btn-disabled');

            Api.Users.saveServiceSettings(this.model.get('id'), settings)
                .then((result) => {
                    view.model.set(result);
                    App.UI.closeModal();
                })
                .catch((err) => {
                    alert(err.message);
                    this.ui.buttons.prop('disabled', false).removeClass('btn-disabled');
                });
        }
    },

    templateContext: function () {
        let view = this;

        return {
            getServices: function () {
                return view.getOption('services');
            },

            getServiceSetting: function (service_id, option) {
                let settings = _.filter(view.model.get('services'), function (item) {
                    return item.id === service_id;
                });

                if (settings && settings.length) {
                    let that = settings.shift();

                    if (option === 'username') {
                        return that.service_username;
                    } else {
                        if (typeof that.data !== 'undefined' && typeof that.data[option] !== 'undefined') {
                            return that.data[option];
                        }
                    }
                }

                return '';
            }
        };
    },

    initialize: function (options) {
        if (typeof options.model === 'undefined' || !options.model) {
            this.model = new UserModel.Model();
        }
    }
});
