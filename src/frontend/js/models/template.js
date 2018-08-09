'use strict';

const Backbone                  = require('backbone');
const jiraTemplateDefaults      = require('./template_defaults/jira');
const bitbucketTemplateDefaults = require('./template_defaults/bitbucket');
const zendeskTemplateDefaults   = require('./template_defaults/zendesk');
const dockerhubTemplateDefaults = require('./template_defaults/dockerhub');
const jenkinsTemplateDefaults   = require('./template_defaults/jenkins');

const model = Backbone.Model.extend({
    idAttribute: 'id',

    defaults: function () {
        return {
            service_type:    '',
            in_service_type: '',
            name:            '',
            content:         JSON.stringify({
                icon_url: '{{ icon_url }}',
                text:     'Enter Message Here'
            }, null, 2),
            default_options: {},
            example_data:    {},
            event_types:     [],
            render_engine:   'liquid'
        };
    },

    setDefaultByServiceTypes: function () {
        switch (this.get('in_service_type')) {
            case 'jira-webhook':
                this.set(jiraTemplateDefaults(this.get('service_type')));
                break;

            case 'bitbucket-webhook':
                this.set(bitbucketTemplateDefaults(this.get('service_type')));
                break;

            case 'zendesk-webhook':
                this.set(zendeskTemplateDefaults(this.get('service_type')));
                break;

            case 'dockerhub-webhook':
                this.set(dockerhubTemplateDefaults(this.get('service_type')));
                break;

            case 'jenkins-webhook':
                this.set(jenkinsTemplateDefaults(this.get('service_type')));
                break;
        }
    }
});

module.exports = {
    Model:      model,
    Collection: Backbone.Collection.extend({
        model: model
    })
};
