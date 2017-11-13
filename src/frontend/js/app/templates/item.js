'use strict';

import Mn from 'backbone.marionette';

const template         = require('./item.ejs');
const preview_template = require('../template/preview/main.ejs');
const Controller       = require('../controller');

module.exports = Mn.View.extend({
    template:  template,
    className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 template',

    ui: {
        edit: 'a.edit'
    },

    events: {
        'click @ui.edit': function (e) {
            e.preventDefault();

            switch (this.model.get('service_type')) {
                case 'slack':
                    Controller.showSlackTemplate(this.model);
                    break;
            }
        }
    },

    templateContext: function () {
        let view = this;

        return {
            getPreview: function () {
                return preview_template(view.model.attributes);
            }
        };
    },

    initialize: function () {
        this.listenTo(this.model, 'change', this.render);
    }
});
