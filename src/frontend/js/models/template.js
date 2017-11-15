'use strict';

import Backbone from 'backbone';

const model = Backbone.Model.extend({
    idAttribute: 'id',

    defaults: function () {
        return {
            service_type:    '',
            in_service_type: '',
            name:            '',
            content:         {
                icon_url:     '<%= icon_url %>',
                text:         'Enter Message Here',
                unfurl_links: false,
                unfurl_media: false
            },
            default_options: {
                icon_url:    'https://public.jc21.com/juxtapose/icons/default.png',
                panel_color: '#0090ff'
            },
            example_data:    {},
            event_types:     []
        };
    },

    setDefaultByInServiceType: function () {

        // Jira Default Data
        if (this.get('in_service_type') === 'jira-webhook') {
            this.set({
                content:      {
                    icon_url:     '<%= icon_url %>',
                    text:         '<%= user %> has assigned an issue to you',
                    attachments:  [
                        {
                            title: '<<%= issueurl %>|<%= issuekey %> - <%= summary %>>',
                            color: '<%= panel_color %>'
                        }
                    ],
                    unfurl_links: false,
                    unfurl_media: false
                },
                example_data: {
                    summary:     'Enable Feature x for Customer y',
                    issuekey:    'FEAT-1234',
                    issueurl:    'http://example.com',
                    issuetype:   'Task',
                    issuestatus: 'In Progress',
                    priority:    'Neutral',
                    reporter:    'Joe Citizen',
                    user:        'Billy Bob',
                    project:     'Web Application',
                    resolution:  'Unresolved',
                    assignee:    'Joe Citizen'
                }
            });

            // Bitbucket Default Data
        } else if (this.get('in_service_type') === 'bitbucket-webhook') {
            this.set({
                content:      {
                    icon_url:     '<%= icon_url %>',
                    text:         '<%= user %> has opened a PR',
                    attachments:  [
                        {
                            title: '<<%= prurl %>|<%= title %>>',
                            color: '<%= panel_color %>'
                        }
                    ],
                    unfurl_links: false,
                    unfurl_media: false
                },
                example_data: {
                    user:        'Billy Bob',
                    prurl:       'http://example.com',
                    title:       'FEAT-1234 - Enable Feature x for Customer y',
                    description: 'Customer y now has this feature.',
                    project:     'PROD',
                    repo:        'application',
                    branch:      'master',
                    from:        {
                        project: 'billybob',
                        repo:    'application',
                        branch:  'feature/1234'
                    }
                }
            });
        }
    }
});

module.exports = {
    Model:      model,
    Collection: Backbone.Collection.extend({
        model: model
    })
};
