'use strict';

import Mn from 'backbone.marionette';

const template         = require('./step5-item.ejs');
const preview_template = require('../../template/preview/main.ejs');
const Helpers          = require('../../../lib/helpers');

module.exports = Mn.View.extend({
    template: template,

    triggers: {
        'click .panel': 'select:template'
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
    }
});
