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

                case 'jabber':
                    Controller.showJabberConfig(this.model);
                    break;

                case 'gchat':
                    Controller.showGoogleChatConfig(this.model);
                    break;

                case 'jira-webhook':
                    Controller.showJiraWebhookConfig(this.model);
                    break;

                case 'bitbucket-webhook':
                    Controller.showBitbucketWebhookConfig(this.model);
                    break;

                case 'dockerhub-webhook':
                    Controller.showDockerhubWebhookConfig(this.model);
                    break;

                case 'zendesk-webhook':
                    Controller.showZendeskWebhookConfig(this.model);
                    break;

                case 'jenkins-webhook':
                    Controller.showJenkinsWebhookConfig(this.model);
                    break;
            }
        },

        'click @ui.test': function (e) {
            e.preventDefault();
            Controller.showServiceTest(this.model);
        },

        'click @ui.endpoint': function (e) {
            e.preventDefault();
            let type = this.model.get('type');
            if (type.match(/(.|\n)*-webhook$/im) || type === 'gchat') {
                Controller.showServiceEndpoint(this.model);
            }
        }
    },

    initialize: function () {
        this.listenTo(this.model, 'change', this.render)
    }
});
