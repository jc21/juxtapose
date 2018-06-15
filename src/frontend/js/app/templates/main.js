'use strict';

import Mn from 'backbone.marionette';

const Controller    = require('../controller');
const Api           = require('../api');
const TemplateModel = require('../../models/template');
const EmptyView     = require('./empty');
const ListView      = require('./list');
const template      = require('./main.ejs');
const Muuri         = require('muuri');

module.exports = Mn.View.extend({
    template: template,
    id:       'templates',
    muuri:    null,

    ui: {
        grid_region:    'div.grid-region',
        add_template:   'a.add-template',
        current_filter: '.current-filter',
        filter_links:   '.dropdown-menu a'
    },

    regions: {
        grid_region: '@ui.grid_region'
    },

    events: {
        'click @ui.add_template': function (e) {
            e.preventDefault();
            Controller.showNewTemplate(new TemplateModel.Model());
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

        Api.Templates.getAll()
            .then(response => {
                if (!view.isDestroyed()) {
                    if (response && response.data && response.data.length) {
                        view.showChildView('grid_region', new ListView({
                            collection: new TemplateModel.Collection(response.data)
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
            })
            .catch(err => {
                Controller.showError(err, 'Could not fetch Templates');
                view.trigger('loaded');
            });
    }
});
