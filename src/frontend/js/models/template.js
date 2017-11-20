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
                icon_url: '<%= icon_url %>',
                text:     'Enter Message Here'
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
                    icon_url:    '<%= icon_url %>',
                    text:        '<%= user %> has assigned an issue to you',
                    attachments: [
                        {
                            title: '<<%= issueurl %>|<%= issuekey %> - <%= summary %>>',
                            color: '<%= panel_color %>'
                        }
                    ]
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
                content:         {
                    icon_url:    '<%= icon_url %>',
                    text:        '<%= user %> has opened a PR',
                    attachments: [
                        {
                            title: '<<%= prurl %>|<%= title %>>',
                            color: '<%= panel_color %>'
                        }
                    ]
                },
                default_options: {
                    icon_url:    'https://public.jc21.com/juxtapose/icons/orange.png',
                    panel_color: '#ffbf00'
                },
                example_data:    {
                    user:           'Billy Bob',
                    prurl:          'http://example.com',
                    title:          'FEAT-1234 - Enable Feature x for Customer y',
                    description:    'Customer y now has this feature.',
                    project:        'PROD',
                    repo:           'application',
                    branch:         'master',
                    approval_count: 1,
                    from:           {
                        project: 'billybob',
                        repo:    'application',
                        branch:  'feature/1234'
                    }
                }
            });

            // Docker Hub Default Data
        } else if (this.get('in_service_type') === 'dockerhub-webhook') {
            this.set({
                content:         {
                    icon_url:    '<%= icon_url %>',
                    text:        'Docker Repository <<%= url %>|<%= repo %>> updated by <%= pusher %>',
                    attachments: [
                        {
                            color:  '<%= panel_color %>',
                            fields: [
                                {
                                    title: 'Tag',
                                    value: '<%- tag %>',
                                    short: true
                                },
                                {
                                    title: 'Star Count',
                                    value: '<%- star_count %>',
                                    short: true
                                }
                            ]
                        }
                    ]
                },
                default_options: {
                    icon_url:    'https://public.jc21.com/juxtapose/icons/red.png',
                    panel_color: '#114c6d'
                },
                example_data:    {
                    pusher:        'jc21',
                    owner:         'jc21',
                    repo:          'jc21\/juxtapose',
                    name:          'juxtapose',
                    tag:           'latest',
                    namespace:     'jc21',
                    description:   'Juxtapose is a self-hosted web app to send notifications from incoming services.',
                    url:           'https:\/\/hub.docker.com\/r\/jc21\/juxtapose',
                    star_count:    1234,
                    comment_count: 0
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
