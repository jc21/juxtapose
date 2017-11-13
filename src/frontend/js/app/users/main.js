'use strict';

import Mn from 'backbone.marionette';

const Api            = require('../api');
const Cache          = require('../cache');
const Controller     = require('../controller');
const ListView       = require('./list');
const EmptyView      = require('./empty');
const PaginationView = require('../ui/pagination/main');
const UserModel      = require('../../models/user');
const template       = require('./main.ejs');

module.exports = Mn.View.extend({
    template: template,
    id:       'users',

    defaults: {
        sort:   'name.asc',
        offset: 0,
        limit:  100
    },

    ui: {
        list_region:       'div.list-region',
        pagination_region: 'div.pagination',
        add_user:          '.add-user'
    },

    regions: {
        list_region:       '@ui.list_region',
        pagination_region: '@ui.pagination_region'
    },

    events: {
        'click @ui.add_user': function (e) {
            e.preventDefault();
            Controller.showUserForm(new UserModel.Model());
        }
    },

    onRender: function () {
        let view = this;

        Api.Users.getAll(view.options.offset, view.options.limit, view.options.sort, ['services'])
            .then((response) => {
                if (!view.isDestroyed()) {
                    Cache.Session.Users.sort   = view.options.sort;
                    Cache.Session.Users.offset = view.options.offset;
                    Cache.Session.Users.limit  = view.options.limit;

                    if (response && response.data && response.data.length) {
                        view.showChildView('list_region', new ListView({
                            collection: new UserModel.Collection(response.data),
                            pagination: response.pagination,
                            sort:       view.options.sort
                        }));

                        let paginationView = new PaginationView({
                            total:  response.pagination.total,
                            limit:  response.pagination.limit,
                            offset: response.pagination.offset
                        });

                        paginationView.on('page', (offset, limit) => {
                            Controller.showUsers(offset, limit, view.options.sort);
                        });

                        view.showChildView('pagination_region', paginationView);
                    } else {
                        view.showChildView('list_region', new EmptyView());
                    }

                    view.trigger('loaded');
                }
            })
            .catch((err) => {
                Controller.showError(err, 'Could not fetch Users');
                view.trigger('loaded');
            });
    }
});
