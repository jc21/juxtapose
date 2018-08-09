'use strict';

const Mn            = require('backbone.marionette');
const template      = require('./step5.ejs');
const ListView      = require('./step5-items');
const TemplateModel = require('../../../models/template');

module.exports = Mn.View.extend({
    template: template,
    id:       'add-new-rule5',

    ui: {
        templates_region: 'div.templates-region'
    },

    regions: {
        templates_region: '@ui.templates_region'
    },

    onRender: function () {
        let collection = new TemplateModel.Collection(this.getOption('templates'));

        this.showChildView('templates_region', new ListView({
            collection: collection,
            model:      this.model
        }));
    }
});
