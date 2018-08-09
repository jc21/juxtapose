'use strict';

const Mn         = require('backbone.marionette');
const template   = require('./step4.ejs');
const Controller = require('../../controller');

module.exports = Mn.View.extend({
    template: template,
    id:       'add-new-rule4',

    ui: {
        items: '.service-item.selectable'
    },

    events: {
        'click @ui.items': function (e) {
            e.preventDefault();
            this.model.set('out_service_id', parseInt($(e.currentTarget).attr('rel'), 10));

            this.model.set({
                out_service_id:   parseInt($(e.currentTarget).data('service_id'), 10),
                out_service_type: $(e.currentTarget).data('service_type')
            });

            Controller.showNewRule5(this.model);
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
