'use strict';

import Mn from 'backbone.marionette';

const template   = require('./new.ejs');
const Controller = require('../controller');

module.exports = Mn.View.extend({
    template: template,
    id:       'add-new-service',

    ui: {
        items: '.service-item.selectable'
    },

    events: {
        'click @ui.items': function (e) {
            e.preventDefault();
            let service = $(e.currentTarget).attr('rel');

            switch (service) {
                case 'slack':
                    Controller.showSlackConfig();
                    break;

                case 'jira-webhook':
                    Controller.showJiraWebhookConfig();
                    break;

                case 'bitbucket-webhook':
                    Controller.showBitbucketWebhookConfig();
                    break;

                case 'dockerhub-webhook':
                    Controller.showDockerhubWebhookConfig();
                    break;

                case 'zendesk-webhook':
                    Controller.showZendeskWebhookConfig();
                    break;
            }
        }
    }
});
