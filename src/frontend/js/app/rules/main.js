'use strict';

import Mn from 'backbone.marionette';

const Api            = require('../api');
const Cache          = require('../cache');
const Controller     = require('../controller');
const ListView       = require('./list');
const EmptyView      = require('./empty');
const PaginationView = require('../ui/pagination/main');
const RuleModel      = require('../../models/rule');
const template       = require('./main.ejs');

module.exports = Mn.View.extend({
    template: template,
    id:       'rules',

    defaults: {
        sort:   'name.asc',
        offset: 0,
        limit:  100
    },

    ui: {
        list_region:       'div.list-region',
        pagination_region: 'div.pagination',
        add_rule:          '.add-rule'
    },

    regions: {
        list_region:       '@ui.list_region',
        pagination_region: '@ui.pagination_region'
    },

    events: {
        'click @ui.add_rule': function (e) {
            e.preventDefault();
            Controller.showNewRule(new RuleModel.Model({
                user_id: Cache.User.get('id')
            }));
        }
    },

    onRender: function () {
        let view = this;

        Api.Rules.getAll(view.options.offset, view.options.limit, view.options.sort, ['in_service', 'out_service', 'template'])
            .then((response) => {
                if (!view.isDestroyed()) {
                    Cache.Session.Rules.sort   = view.options.sort;
                    Cache.Session.Rules.offset = view.options.offset;
                    Cache.Session.Rules.limit  = view.options.limit;

                    if (response && response.data && response.data.length) {
                        view.showChildView('list_region', new ListView({
                            collection: new RuleModel.Collection(response.data),
                            pagination: response.pagination,
                            sort:       view.options.sort
                        }));

                        let paginationView = new PaginationView({
                            total:  response.pagination.total,
                            limit:  response.pagination.limit,
                            offset: response.pagination.offset
                        });

                        paginationView.on('page', (offset, limit) => {
                            Controller.showRules(offset, limit, view.options.sort);
                        });

                        view.showChildView('pagination_region', paginationView);
                    } else {
                        view.showChildView('list_region', new EmptyView());
                    }

                    view.trigger('loaded');
                }
            })
            .catch((err) => {
                Controller.showError(err, 'Could not fetch Rules');
                view.trigger('loaded');
            });
    },

    initialize: function () {
        this.listenTo(Cache.User, 'change:services', this.render);
    }
});
