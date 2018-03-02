'use strict';

import Mn from 'backbone.marionette';

const template   = require('./copy_rules.ejs');
const Controller = require('../controller');
const Api        = require('../api');
const App        = require('../main');

module.exports = Mn.View.extend({
    template: template,

    ui: {
        form:         'form',
        buttons:      'form button',
        cancel:       'button.cancel',
        from_user_id: 'select[name="from_user_id"]',
        service_type: 'select[name="service_type"]'
    },

    events: {
        'submit @ui.form': function (e) {
            e.preventDefault();
            let from_user_id = parseInt(this.ui.from_user_id.val(), 10);

            this.ui.buttons.prop('disabled', true).addClass('btn-disabled');
            Api.Rules.copy(from_user_id, this.model.get('id'), this.ui.service_type.val())
                .then(() => {
                    App.UI.closeModal();
                    Controller.showUsers();
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
            getUsers: function () {
                return view.getOption('users');
            }
        };
    }
});
