'use strict';

const Mn               = require('backbone.marionette');
const template         = require('./item.ejs');
const preview_template = require('../template/preview/main.ejs');
const Controller       = require('../controller');
const Helpers          = require('../../lib/helpers');

module.exports = Mn.View.extend({
    template:  template,
    className: 'template',

    ui: {
        edit: 'a.edit-link'
    },

    events: {
        'click @ui.edit': function (e) {
            e.preventDefault();
            Controller.showGeneralTemplate(this.model);
        }
    },

    templateContext: function () {
        let view = this;

        return {
            getPreview: function () {
                let data       = view.model.attributes;
                data.shortTime = Helpers.shortTime;
                return preview_template(data);
            }
        };
    },

    onRender: function () {
        // This is for the filters
        this.$el.addClass('service-' + this.model.get('in_service_type') + ' service-' + this.model.get('service_type'));
    },

    initialize: function () {
        this.listenTo(this.model, 'change', this.render);
    }
});
