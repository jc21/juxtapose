'use strict';

import Mn from 'backbone.marionette';

const template   = require('./item.ejs');
const Controller = require('../controller');

module.exports = Mn.View.extend({
    template:  template,
    className: 'col-lg-4 col-md-4 col-sm-4 col-xs-6 service',

    ui: {
        edit:     'a.edit',
        test:     'a.test',
        endpoint: 'a.endpoint'
    },

    events: {
        'click @ui.edit': function (e) {
            e.preventDefault();

            switch (this.model.get('type')) {
                case 'slack':
                    Controller.showSlackConfig(this.model);
                    break;

                case 'jira-webhook':
                    Controller.showJiraWebhookConfig(this.model);
                    break;

                case 'bitbucket-webhook':
                    Controller.showBitbucketWebhookConfig(this.model);
                    break;
            }
        },

        'click @ui.test': function (e) {
            e.preventDefault();
            if (this.model.get('type') === 'slack') {
                Controller.showServiceTest(this.model);
            }
        },

        'click @ui.endpoint': function (e) {
            e.preventDefault();
            if (this.model.get('type') === 'jira-webhook' || this.model.get('type') === 'bitbucket-webhook') {
                Controller.showServiceEndpoint(this.model);
            }
        }
    },

    initialize: function () {
        this.listenTo(this.model, 'change', this.render)
    }
});
