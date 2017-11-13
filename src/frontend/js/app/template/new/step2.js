'use strict';

import Mn from 'backbone.marionette';

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

            switch (service) {
                case 'slack':
                    Controller.showSlackTemplate(this.model);
                    break;

                default:
                    alert('This service type is not supported: ' + service);
                    break;
            }
        }
    }
});
