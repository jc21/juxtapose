'use strict';

import Mn from 'backbone.marionette';

const Api        = require('../api');
const Cache      = require('../cache');
const Controller = require('../controller');
const ListView   = require('./list');
const EmptyView  = require('./empty');
const RuleModel  = require('../../models/rule');
const template   = require('./main.ejs');
const Muuri      = require('muuri');

module.exports = Mn.View.extend({
    template: template,
    id:       'rules',
    muuri:    null,

    defaults: {
        sort:   'name.asc',
        offset: 0,
        limit:  100
    },

    ui: {
        grid_region:    'div.grid-region',
        add_rule:       '.add-rule',
        current_filter: '.current-filter',
        filter_links:   '.dropdown-menu a'
    },

    regions: {
        grid_region: '@ui.grid_region'
    },

    events: {
        'click @ui.add_rule': function (e) {
            e.preventDefault();
            Controller.showNewRule(new RuleModel.Model({
                user_id: Cache.User.get('id')
            }));
        },

        'click @ui.filter_links': function (e) {
            e.preventDefault();
            let $elm = $(e.target);
            let type = $elm.data('type');
            this.ui.current_filter.text($elm.text());

            if (type) {
                this.muuri.filter('.service-' + type);
            } else {
                // hack to show all items
                this.muuri.filter(function () {
                    return true;
                });
            }
        }
    },

    onRender: function () {
        let view = this;

        Api.Rules.getAll(view.options.offset, view.options.limit, view.options.sort, ['in_service', 'out_service', 'template'])
            .then(response => {
                if (!view.isDestroyed()) {
                    if (response && response.data && response.data.length) {
                        view.showChildView('grid_region', new ListView({
                            collection: new RuleModel.Collection(response.data)
                        }));

                        view.muuri = new Muuri(view.$el.find('.muuri-grid').get(0), {
                            layout: {
                                fillGaps: true,
                                rounding: false
                            }
                        });

                        setTimeout(function () {
                            view.muuri.refreshItems();
                        }, 10);

                    } else {
                        view.showChildView('grid_region', new EmptyView());
                    }

                    view.trigger('loaded');
                }
            })/*
            .catch(err => {
                Controller.showError(err, 'Could not fetch Rules');
                view.trigger('loaded');
            })*/;
    },

    initialize: function () {
        this.listenTo(Cache.User, 'change:services', this.render);
    }
});
