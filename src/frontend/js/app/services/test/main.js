'use strict';

import Mn from 'backbone.marionette';

const template = require('./main.ejs');
const Api      = require('../../api');
const App      = require('../../main');

require('jquery-serializejson');

module.exports = Mn.View.extend({
    template: template,

    ui: {
        form:             'form',
        buttons:          'form button',
        username_options: 'select[name="username"]'
    },

    events: {
        'submit @ui.form': function (e) {
            e.preventDefault();
            this.ui.buttons.prop('disabled', true).addClass('btn-disabled');

            Api.Services.test(this.model.get('id'), this.ui.form.serializeJSON())
                .then((/*result*/) => {
                    App.UI.closeModal();
                })
                .catch(err => {
                    alert(err.message);
                    this.ui.buttons.prop('disabled', false).removeClass('btn-disabled');
                });
        }
    },

    onRender: function () {
        let view = this;

        if (this.model.get('type') === 'jabber') {
            Api.Services.getUsers(this.model.get('id'))
                .then(users => {
                    view.ui.username_options.empty();
                    $('<option>')
                        .val('')
                        .text('Select...')
                        .appendTo(view.ui.username_options);

                    _.map(users, user => {
                        $('<option>')
                            .val(user.jid)
                            .text(user.name)
                            .appendTo(view.ui.username_options);
                    });
                })
                .catch(err => {
                    view.ui.username_options.empty();
                    $('<option>')
                        .val('')
                        .text('Error loading users! Try again')
                        .prop('selected', true)
                        .appendTo(view.ui.username_options);
                });
        }
    }
});
