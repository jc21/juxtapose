'use strict';

const Mn           = require('backbone.marionette');
const template     = require('./main.ejs');
const Controller   = require('../../controller');
const Api          = require('../../api');
const App          = require('../../main');
const ServiceModel = require('../../../models/service');

require('jquery-serializejson');

module.exports = Mn.View.extend({
    template: template,

    ui: {
        form:    'form',
        buttons: 'form button',
        cancel:  'button.cancel',
        delete:  'button.delete',
        name:    'input[name="name"]'
    },

    events: {
        'click @ui.delete': function (e) {
            e.preventDefault();

            Api.Services.delete(this.model.get('id'))
                .then((/*result*/) => {
                    App.UI.closeModal();
                    Controller.showServices();
                })
                .catch((err) => {
                    alert(err.message);
                    this.ui.buttons.prop('disabled', false).removeClass('btn-disabled');
                });
        },

        'submit @ui.form': function (e) {
            e.preventDefault();
            let view = this;

            this.ui.buttons.prop('disabled', true).addClass('btn-disabled');

            let form_data = this.ui.form.serializeJSON();
            let data      = {
                type: 'pushover',
                name: form_data.name,
                data: {
                    app_token: form_data.app_token
                }
            };

            let method = Api.Services.create;
            let is_new = true;

            if (this.model.get('id')) {
                // edit
                method  = Api.Services.update;
                data.id = this.model.get('id');
                is_new  = false;
            }

            method(data)
                .then(result => {
                    view.model.set(result);
                    App.UI.closeModal();

                    if (is_new) {
                        Controller.showServices();
                    }
                })
                .catch(err => {
                    alert(err.message);
                    this.ui.buttons.prop('disabled', false).removeClass('btn-disabled');
                });
        }
    },

    initialize: function (options) {
        if (typeof options.model === 'undefined' || !options.model) {
            this.model = new ServiceModel.Model();
        }
    }
});
