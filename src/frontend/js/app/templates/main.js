'use strict';

import Mn from 'backbone.marionette';

const Controller     = require('../controller');
const Api            = require('../api');
const TemplateModel  = require('../../models/template');
const EmptyView      = require('./empty');
const ListView       = require('./list');
const template       = require('./main.ejs');

module.exports = Mn.View.extend({
    template: template,
    id:       'templates',

    ui: {
        list_region:       'div.list-region',
        pagination_region: 'div.pagination',
        add_template:      'a.add-template'
    },

    regions: {
        list_region:       '@ui.list_region',
        pagination_region: '@ui.pagination_region'
    },

    events: {
        'click @ui.add_template': function (e) {
            e.preventDefault();
            Controller.showNewTemplate(new TemplateModel.Model());
        }
    },

    onRender: function () {
        let view = this;

        Api.Templates.getAll()
            .then((response) => {
                if (!view.isDestroyed()) {
                    if (response && response.data && response.data.length) {
                        view.showChildView('list_region', new ListView({
                            collection: new TemplateModel.Collection(response.data)
                        }));
                    } else {
                        view.showChildView('list_region', new EmptyView());
                    }

                    view.trigger('loaded');
                }
            })
            .catch((err) => {
                Controller.showError(err, 'Could not fetch Templates');
                view.trigger('loaded');
            });
    }
});
