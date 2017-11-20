'use strict';

import Mn from 'backbone.marionette';

const template = require('./main.ejs');

module.exports = Mn.View.extend({
    template: template,

    templateContext: function () {
        let view = this;

        return {
            getEndpoint: function () {
                let base_url = window.location.protocol + '//' + window.location.host + window.location.pathname + 'incoming/' + view.model.get('type');

                // Dockerhub has a 254 character limit so we can't use JWT's
                if (view.model.get('type') === 'dockerhub-webhook') {
                    return base_url + '?s=' + view.model.get('id') + '&k=' + view.model.get('data').validation_key;
                }

                return base_url + '?t=' + view.model.get('data').token;
            }
        }
    }
});
