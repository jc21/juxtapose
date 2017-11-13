'use strict';

import Mn from 'backbone.marionette';

const Api               = require('../api');
const Cache             = require('../cache');
const Controller        = require('../controller');
const ListView          = require('./list');
const EmptyView         = require('./empty');
const PaginationView    = require('../ui/pagination/main');
const NotificationModel = require('../../models/notification');
const template          = require('./main.ejs');

module.exports = Mn.View.extend({
    template: template,
    id:       'notifications',

    defaults: {
        sort:   'created_on.desc',
        offset: 0,
        limit:  50
    },

    ui: {
        list_region:       'div.list-region',
        pagination_region: 'div.pagination'
    },

    regions: {
        list_region:       '@ui.list_region',
        pagination_region: '@ui.pagination_region'
    },

    onRender: function () {
        let view = this;

        Api.Notifications.getAll(view.options.offset, view.options.limit, view.options.sort, ['rule.[template, in_service]', 'service'])
            .then((response) => {
                if (!view.isDestroyed()) {
                    Cache.Session.Notifications.sort   = view.options.sort;
                    Cache.Session.Notifications.offset = view.options.offset;
                    Cache.Session.Notifications.limit  = view.options.limit;

                    if (response && response.data && response.data.length) {
                        view.showChildView('list_region', new ListView({
                            collection: new NotificationModel.Collection(response.data),
                            pagination: response.pagination,
                            sort:       view.options.sort
                        }));

                        let paginationView = new PaginationView({
                            total:  response.pagination.total,
                            limit:  response.pagination.limit,
                            offset: response.pagination.offset
                        });

                        paginationView.on('page', (offset, limit) => {
                            Controller.showNotifications(offset, limit, view.options.sort);
                        });

                        view.showChildView('pagination_region', paginationView);
                    } else {
                        view.showChildView('list_region', new EmptyView());
                    }

                    view.trigger('loaded');
                }
            })
            .catch((err) => {
                Controller.showError(err, 'Could not fetch Notifications');
                view.trigger('loaded');
            });
    },

    initialize: function () {
        this.listenTo(Cache.User, 'change:services', this.render);
    }
});
