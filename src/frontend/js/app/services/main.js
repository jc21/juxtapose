'use strict';

const Mn             = require('backbone.marionette');
const Controller     = require('../controller');
const Api            = require('../api');
const Cache          = require('../cache');
const ServiceModel   = require('../../models/service');
const EmptyView      = require('./empty');
const PaginationView = require('../ui/pagination/main');
const ListView       = require('./list');
const template       = require('./main.ejs');

module.exports = Mn.View.extend({
    template: template,
    id:       'services',

    defaults: {
        sort:   'name.asc',
        offset: 0,
        limit:  100
    },

    ui: {
        list_region:       'div.list-region',
        pagination_region: 'div.pagination',
        add_service:       'a.add-service',
        restart:           'a.restart-services'
    },

    regions: {
        list_region:       '@ui.list_region',
        pagination_region: '@ui.pagination_region'
    },

    events: {
        'click @ui.add_service': function (e) {
            e.preventDefault();
            Controller.showNewService();
        },

        'click @ui.restart': function (e) {
            e.preventDefault();
            let view = this;

            this.ui.restart.prop('disabled', true).addClass('btn-disabled');

            Api.Services.restart()
                .then(() => {
                    view.ui.restart.prop('disabled', false).removeClass('btn-disabled');
                    Controller.showServices();
                });
        }
    },

    onRender: function () {
        let view = this;

        Api.Services.getAll(view.options.offset, view.options.limit, view.options.sort)
            .then((response) => {
                if (!view.isDestroyed()) {
                    Cache.Session.Services.sort   = view.options.sort;
                    Cache.Session.Services.offset = view.options.offset;
                    Cache.Session.Services.limit  = view.options.limit;

                    if (response && response.data && response.data.length) {
                        view.showChildView('list_region', new ListView({
                            collection: new ServiceModel.Collection(response.data),
                            pagination: response.pagination,
                            sort:       view.options.sort
                        }));

                        let paginationView = new PaginationView({
                            total:  response.pagination.total,
                            limit:  response.pagination.limit,
                            offset: response.pagination.offset
                        });

                        paginationView.on('page', (offset, limit) => {
                            Controller.showServices(offset, limit, view.options.sort);
                        });

                        view.showChildView('pagination_region', paginationView);
                    } else {
                        view.showChildView('list_region', new EmptyView());
                    }

                    view.trigger('loaded');
                }
            })
            .catch((err) => {
                Controller.showError(err, 'Could not fetch Services');
                view.trigger('loaded');
            });
    }
});
