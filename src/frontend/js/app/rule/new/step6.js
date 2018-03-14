'use strict';

import Mn from 'backbone.marionette';

const _          = require('underscore');
const template   = require('./step6.ejs');
const Controller = require('../../controller');
const App        = require('../../main');
const Api        = require('../../api');

require('jquery-serializejson');

module.exports = Mn.View.extend({
    template: template,
    id:       'add-new-rule6',

    ui: {
        form:    'form',
        buttons: 'form button'
    },

    events: {
        'submit @ui.form': function (e) {
            e.preventDefault();
            let data = this.ui.form.serializeJSON();

            // Sanitize empty vals
            _.map(this.getOption('templateModel').get('default_options'), (val, key) => {
                if (typeof data[key] !== 'undefined' && !data[key]) {
                    delete data[key];
                }
            });

            this.model.set('out_template_options', data);

            let create_data = _.pick(this.model.attributes, [
                'user_id',
                'priority_order',
                'in_service_id',
                'trigger',
                'extra_conditions',
                'out_service_id',
                'out_template_id',
                'out_template_options'
            ]);

            Api.Rules.create(create_data)
                .then((/*result*/) => {
                    App.UI.closeModal();
                    Controller.showRules();
                })
                .catch(err => {
                    alert(err.message);
                    this.ui.buttons.prop('disabled', false).removeClass('btn-disabled');
                });

        }
    },

    templateContext: function () {
        let view = this;

        return {
            getTemplate: function () {
                return view.getOption('templateModel').attributes;
            }
        };
    }
});
