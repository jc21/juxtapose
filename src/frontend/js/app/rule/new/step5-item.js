'use strict';

import Mn from 'backbone.marionette';

const template         = require('./step5-item.ejs');
const preview_template = require('../../template/preview/main.ejs');

module.exports = Mn.View.extend({
    template:  template,

    triggers: {
        'click .panel': 'select:template'
    },

    templateContext: function () {
        let view = this;

        return {
            getPreview: function () {
                return preview_template(view.model.attributes);
            }
        };
    }
});
