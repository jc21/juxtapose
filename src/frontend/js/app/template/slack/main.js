'use strict';

import Mn from 'backbone.marionette';

const template      = require('./main.ejs');
const Controller    = require('../../controller');
const Api           = require('../../api');
const App           = require('../../main');
const TemplateModel = require('../../../models/template');
const RuleModel     = require('../../../models/rule');

require('jquery-serializejson');

module.exports = Mn.View.extend({
    template: template,

    ui: {
        form:      'form',
        buttons:   'form button',
        cancel:    'button.cancel',
        delete:    'button.delete',
        name:      'input[name="name"]',
        api_token: 'input[name="api_token"]',
        tab1:      '.nav-tabs a:eq(0)',
        tab2:      '.nav-tabs a:eq(1)',
        tab3:      '.nav-tabs a:eq(2)',
        tab4:      '.nav-tabs a:eq(3)'
    },

    events: {
        'click @ui.delete': function (e) {
            e.preventDefault();

            Api.Templates.delete(this.model.get('id'))
                .then((/*result*/) => {
                    App.UI.closeModal();
                    Controller.showTemplates();
                })
                .catch((err) => {
                    alert(err.message);
                    this.ui.buttons.prop('disabled', false).removeClass('btn-disabled');
                });
        },

        'submit @ui.form': function (e) {
            e.preventDefault();
            let view      = this;
            let form_data = this.ui.form.serializeJSON();

            try {
                form_data.content = JSON.parse(form_data.content);
            } catch (err) {
                view.ui.tab1.tab('show');
                alert('Content has invalid JSON');
                return;
            }

            try {
                form_data.default_options = JSON.parse(form_data.default_options);
            } catch (err) {
                view.ui.tab2.tab('show');
                alert('Default Options has invalid JSON');
                return;
            }

            try {
                form_data.example_data = JSON.parse(form_data.example_data);
            } catch (err) {
                view.ui.tab3.tab('show');
                alert('Example Data has invalid JSON');
                return;
            }

            if (typeof form_data.event_types === 'undefined' || !form_data.event_types.length) {
                view.ui.tab4.tab('show');
                alert('Select at least 1 event type');
                return;
            }

            this.ui.buttons.prop('disabled', true).addClass('btn-disabled');
            let method = Api.Templates.create;
            let is_new = true;

            if (this.model.get('id')) {
                // edit
                method       = Api.Templates.update;
                is_new       = false;
                form_data.id = this.model.get('id');
            } else {
                form_data.service_type    = this.model.get('service_type');
                form_data.in_service_type = this.model.get('in_service_type');
            }

            method(form_data)
                .then((result) => {
                    view.model.set(result);
                    App.UI.closeModal();

                    if (is_new) {
                        Controller.showTemplates();
                    }
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
            getTriggers: () => {
                return RuleModel.Model.prototype.getTriggerHierarchy(view.model.get('in_service_type'));
            }
        };
    }
});
