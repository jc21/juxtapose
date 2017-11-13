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
                icon_url:    'https://public.jc21.com/jira-notify/apple-icon.png',
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
                    summary:     'VPN Planning and Configuration',
                    issuekey:    'SYS-10839',
                    issueurl:    'http://example.com',
                    issuetype:   'Task',
                    issuestatus: 'In Progress',
                    priority:    'Neutral',
                    reporter:    'Talal Khattak',
                    user:        'John Phillips',
                    project:     'Systems Engineering',
                    resolution:  'Unresolved',
                    assignee:    'Talal Khattak'
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
                    user:        'Jamie Curnow',
                    prurl:       'http://example.com',
                    title:       'PROJ-123 - Added fixme file',
                    description: 'This example fixes and issue I have with testing.',
                    project: 'V6',
                    repo:    'businessbuilder',
                    branch:  'develop',
                    from: {
                        project: 'jcurnow',
                        repo:    'businessbuilder',
                        branch:  'feature/abc123'
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
