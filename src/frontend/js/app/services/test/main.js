'use strict';

import Mn from 'backbone.marionette';

const template = require('./main.ejs');
const Api      = require('../../api');
const App      = require('../../main');

require('jquery-serializejson');

module.exports = Mn.View.extend({
    template: template,

    ui: {
        form:     'form',
        buttons:  'form button',
        cancel:   'button.cancel',
        username: 'input[name="username"]',
        message:  'input[name="message"]'
    },

    events: {
        'submit @ui.form': function (e) {
            e.preventDefault();
            this.ui.buttons.prop('disabled', true).addClass('btn-disabled');

            Api.Services.test(this.model.get('id'), this.ui.form.serializeJSON())
                .then((/*result*/) => {
                    App.UI.closeModal();
                })
                .catch((err) => {
                    alert(err.message);
                    this.ui.buttons.prop('disabled', false).removeClass('btn-disabled');
                });
        }
    }
});
