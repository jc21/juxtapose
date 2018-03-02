'use strict';

import Mn from 'backbone.marionette';

const template   = require('./password.ejs');
const Controller = require('../controller');
const Api        = require('../api');
const App        = require('../main');
const Cache      = require('../cache');

require('jquery-serializejson');

module.exports = Mn.View.extend({
    template: template,

    ui: {
        form:    'form',
        buttons: 'form button',
        cancel:  'button.cancel'
    },

    events: {
        'submit @ui.form': function (e) {
            e.preventDefault();
            let form = this.ui.form.serializeJSON();

            if (form.new_password1 !== form.new_password2) {
                alert('Passwords do not match!');
                return;
            }

            let data = {
                type:    'password',
                current: form.current_password,
                secret:  form.new_password1
            };

            this.ui.buttons.prop('disabled', true).addClass('btn-disabled');
            Api.Users.setPassword(this.model.get('id'), data)
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

    isSelf: function () {
        return Cache.User.get('id') === this.model.get('id');
    },

    templateContext: function () {
        return {
            isSelf: this.isSelf.bind(this)
        };
    }
});
