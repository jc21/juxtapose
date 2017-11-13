'use strict';

import Mn from 'backbone.marionette';

const template = require('./main.ejs');

module.exports = Mn.View.extend({
    template: template,

    templateContext: function () {
        let view = this;

        return {
            getEndpoint: function () {
                return window.location.protocol + '//' + window.location.host + window.location.pathname + 'incoming/' + view.model.get('type') + '?t=' + view.model.get('data').token;
            }
        }
    }
});
