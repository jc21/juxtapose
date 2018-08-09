'use strict';

const Mn = require('backbone.marionette');

const templates = {
    'zendesk-webhook': require('./zendesk-webhook.ejs'),
    'jenkins-webhook': require('./jenkins-webhook.ejs'),
    'default':         require('./main.ejs')
};

module.exports = Mn.View.extend({
    template: function (data) {
        if (typeof templates[data.type] !== 'undefined') {
            return templates[data.type](data);
        }

        return templates.default(data);
    },

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
        };
    }
});
