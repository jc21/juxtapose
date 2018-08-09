'use strict';

const Mn        = require('backbone.marionette');
const _         = require('underscore');
const template  = require('./service-settings.ejs');
const Api       = require('../api');
const App       = require('../main');
const UserModel = require('../../models/user');

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
                return view.getServiceSetting(service_id, option);
            }
        };
    },

    getServiceSetting: function (service_id, option) {
        let view = this;

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
    },

    onRender: function () {
        let view = this;

        _.each(this.getOption('services'), function (service) {
            if (service.type === 'slack') {
                let $select = view.$el.find('select[name="settings[' + service.id + '][username]"]');

                if ($select.length) {
                    Api.Services.getUsers(service.id)
                        .then(users => {
                            $select.empty();
                            $('<option>')
                                .text('Select...')
                                .appendTo($select);

                            let selected_username = view.getServiceSetting(service.id, 'username');

                            _.map(users, user => {
                                $('<option>')
                                    .val(user.name)
                                    .text(user.real_name || user.display_name)
                                    .prop('selected', selected_username === user.name)
                                    .appendTo($select);
                            });
                        })
                        .catch(err => {
                            $select.empty();
                            $('<option>')
                                .text('Error loading users! Try again')
                                .prop('selected', true)
                                .appendTo($select);
                        });
                }
            } else if (service.type === 'jabber') {
                let $select = view.$el.find('select[name="settings[' + service.id + '][username]"]');

                if ($select.length) {
                    Api.Services.getUsers(service.id)
                        .then(users => {
                            $select.empty();
                            $('<option>')
                                .text('Select...')
                                .appendTo($select);

                            let selected_username = view.getServiceSetting(service.id, 'username');

                            _.map(users, user => {
                                $('<option>')
                                    .val(user.jid)
                                    .text(user.name)
                                    .prop('selected', selected_username === user.jid)
                                    .appendTo($select);
                            });
                        })
                        .catch(err => {
                            $select.empty();
                            $('<option>')
                                .text('Error loading users! Try again')
                                .prop('selected', true)
                                .appendTo($select);
                        });
                }
            } else if (service.type === 'gchat') {
                let $select = view.$el.find('select[name="settings[' + service.id + '][username]"]');

                if ($select.length) {
                    Api.Services.getUsers(service.id)
                        .then(spaces => {
                            $select.empty();
                            $('<option>')
                                .text('Select...')
                                .appendTo($select);

                            let selected_username = view.getServiceSetting(service.id, 'username');

                            _.map(spaces, space => {
                                $('<option>')
                                    .val(space.name)
                                    .text(space.displayName + ' (' + space.type + ')')
                                    .prop('selected', selected_username === space.name)
                                    .appendTo($select);
                            });
                        })
                        .catch(err => {
                            $select.empty();
                            $('<option>')
                                .text('Error loading spaces! Try again')
                                .prop('selected', true)
                                .appendTo($select);
                        });
                }
            }
        });
    },

    initialize: function (options) {
        if (typeof options.model === 'undefined' || !options.model) {
            this.model = new UserModel.Model();
        }
    }
});
