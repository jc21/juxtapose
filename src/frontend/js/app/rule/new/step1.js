'use strict';

const Mn         = require('backbone.marionette');
const template   = require('./step1.ejs');
const Controller = require('../../controller');

module.exports = Mn.View.extend({
    template: template,
    id:       'add-new-rule',

    ui: {
        items: '.service-item.selectable'
    },

    events: {
        'click @ui.items': function (e) {
            e.preventDefault();
            this.model.set({
                in_service_id:   parseInt($(e.currentTarget).data('service_id'), 10),
                in_service_type: $(e.currentTarget).data('service_type')
            });

            Controller.showNewRule2(this.model);
        }
    },

    templateContext: function () {
        let view = this;

        return {
            getServices: function () {
                return view.getOption('services');
            }
        };
    }
});
