'use strict';

const Mn         = require('backbone.marionette');
const template   = require('./step2.ejs');
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
            let service = $(e.currentTarget).attr('rel');

            this.model.set({service_type: service});
            this.model.setDefaultByServiceTypes();

            Controller.showGeneralTemplate(this.model);
        }
    }
});
