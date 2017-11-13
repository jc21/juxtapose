'use strict';

import Mn from 'backbone.marionette';

const template   = require('./step1.ejs');
const Controller = require('../../controller');

module.exports = Mn.View.extend({
    template: template,
    id:       'add-new-template',

    ui: {
        items: '.service-item.selectable'
    },

    events: {
        'click @ui.items': function (e) {
            e.preventDefault();
            this.model.set({
                in_service_type: $(e.currentTarget).data('service_type')
            });

            this.model.setDefaultByInServiceType();

            Controller.showNewTemplate2(this.model);
        }
    }
});
