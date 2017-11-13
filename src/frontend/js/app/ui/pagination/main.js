'use strict';

import Mn from 'backbone.marionette';
import $ from 'jquery';

const template = require('./main.ejs');

module.exports = Mn.View.extend({

    template: template,

    defaults: {
        total:  0,
        offset: 0,
        limit:  20
    },

    ui: {
        buttons: 'button'
    },

    templateContext: function () {
        let view = this;

        return {
            getTotal: function () {
                return view.options.total;
            },

            getOffset: function () {
                return view.options.offset;
            },

            getLimit: function () {
                return view.options.limit;
            }
        };
    },

    events: {
        'click @ui.buttons': function (e) {
            e.preventDefault();
            let offset = parseInt($(e.currentTarget).data('offset'), 10);
            this.trigger('page', offset, this.options.limit);
        }
    }
});
