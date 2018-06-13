'use strict';

import Backbone from 'backbone';

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
        let content;
        let default_options = {};

        // Jira Default Data
        if (this.get('in_service_type') === 'jira-webhook') {

            if (this.get('service_type') === 'slack') {
                content = JSON.stringify({
                    icon_url:    '{{ icon_url }}',
                    text:        '{{ user }} has assigned an issue to you',
                    attachments: [
                        {
                            title: '<{{ issueurl }}|{{ issuekey }} - {{ summary }}>',
                            color: '{{ panel_color }}'
                        }
                    ]
                }, null, 2);

                default_options = {
                    icon_url:    'https://public.jc21.com/juxtapose/icons/default.png',
                    panel_color: '#0090ff'
                };

            } else if (this.get('service_type') === 'gchat') {
                content = JSON.stringify({
                    cards: [
                        {
                            sections: [
                                {
                                    widgets: [
                                        {
                                            keyValue: {
                                                topLabel:         '{{ user }} has assigned an issue to you',
                                                content:          '{{ summary }}',
                                                contentMultiline: 'true',
                                                bottomLabel:      '{{ issuetype }} - {{ issuestatus }}',
                                                onClick:          {
                                                    openLink: {
                                                        url: '{{ issueurl }}'
                                                    }
                                                }
                                            }
                                        },
                                        {
                                            textParagraph: {
                                                text: '{{ description }}'
                                            }
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }, null, 2);

            } else {
                content = '{{ user }} has assigned {{ issuekey }} to you: {{ issueurl }}';
            }

            this.set({
                content:         content,
                default_options: default_options,
                example_data:    {
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
                    assignee:    'Joe Citizen',
                    description: 'At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et.'
                }
            });

            // Bitbucket Default Data
        } else if (this.get('in_service_type') === 'bitbucket-webhook') {

            if (this.get('service_type') === 'slack') {
                content = JSON.stringify({
                    icon_url:    '{{ icon_url }}',
                    text:        '{{ user }} has opened a PR',
                    attachments: [
                        {
                            title: '<{{ prurl }}|{{ title }}>',
                            color: '{{ panel_color }}'
                        }
                    ]
                }, null, 2);

                default_options = {
                    icon_url:    'https://public.jc21.com/juxtapose/icons/orange.png',
                    panel_color: '#ffbf00'
                };
            } else {
                content = '{{ user }} has opened a PR: {{ prurl }}';
            }

            this.set({
                content:         content,
                default_options: default_options,
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

            if (this.get('service_type') === 'slack') {
                content = JSON.stringify({
                    icon_url:    '{{ icon_url }}',
                    text:        'Docker Repository <{{ url }}|{{ repo }}> updated by {{ pusher }}',
                    attachments: [
                        {
                            color:  '{{ panel_color }}',
                            fields: [
                                {
                                    title: 'Tag',
                                    value: '{{ tag }}',
                                    short: true
                                },
                                {
                                    title: 'Star Count',
                                    value: '{{ star_count }}',
                                    short: true
                                }
                            ]
                        }
                    ]
                }, null, 2);

                default_options = {
                    icon_url:    'https://public.jc21.com/juxtapose/icons/red.png',
                    panel_color: '#114c6d'
                };
            } else {
                content = 'Docker Repository updated by {{ pusher }}: {{ url }}';
            }

            this.set({
                content:         content,
                default_options: default_options,
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

            // Zendesk Webhook
        } else if (this.get('in_service_type') === 'zendesk-webhook') {
            this.set({
                content:         JSON.stringify({
                    icon_url:    '{{ icon_url }}',
                    text:        'Ticket <{{ ticket.link }}|#{{ ticket.id }}> has been assigned to you by {{ current_user.name }}',
                    attachments: [
                        {
                            color:  '{{ panel_color }}',
                            fields: [
                                {
                                    title: '<{{ ticket.link }}|{{ ticket.title }}>',
                                    value: '{{ ticket.requester.name }} ({{ ticket.requester.email }})'
                                },
                                {
                                    title: 'Status',
                                    value: '{{ ticket.status }}',
                                    short: true
                                },
                                {
                                    title: 'Via',
                                    value: '{{ ticket.via }}',
                                    short: true
                                }
                            ]
                        }
                    ]
                }, null, 2),
                default_options: {
                    icon_url:    'https://public.jc21.com/juxtapose/icons/green.png',
                    panel_color: '#18ce00'
                },
                example_data:    {
                    ticket:       {
                        id:        57506,
                        title:     'Billy Box has submitted a website enquiry',
                        link:      'https://example.zendesk.com/agent/tickets/57506',
                        via:       'Mail',
                        status:    'Pending',
                        requester: {
                            email: 'billybob@example.com',
                            name:  'Billy Bob'
                        }
                    },
                    current_user: {
                        name: 'Joe Citizen'
                    }
                }
            });
        } else if (this.get('in_service_type') === 'jenkins-webhook') {
            this.set({
                content:         JSON.stringify({
                    icon_url:    '{{ icon_url }}',
                    text:        'A build has succeeded',
                    attachments: [
                        {
                            color:  '{{ panel_color }}',
                            text:   '<{{ project.url }}/{{ build.number }}/|{{ project.full_name }} #{{ build.number }}>',
                            fields: [
                                {
                                    title: 'Cause',
                                    value: '{{ build.cause | jsonescape }}',
                                    short: true
                                },
                                {
                                    title: 'Duration',
                                    value: '{{ build.duration_string }}',
                                    short: true
                                }
                            ]
                        }
                    ]
                }, null, 2),
                default_options: {
                    icon_url:    'https://public.jc21.com/juxtapose/icons/orange.png',
                    panel_color: '#18ce00'
                },
                example_data:    {
                    project: {
                        url:          'https://ci.example.com/job/Docker/job/docker-node/job/master/',
                        name:         'master',
                        full_name:    'Docker/docker-node/master',
                        display_name: 'master'
                    },
                    build:   {
                        number:          5,
                        display_name:    '#5',
                        url:             'job/Docker/job/docker-node/job/master/5/',
                        duration:        0,
                        duration_string: '30 min',
                        start_time_ms:   1527776303554,
                        time_ms:         1527776303542,
                        has_artifacts:   false,
                        cause:           'Push event to branch master',
                        log:             '[...truncated 56.79 KB...]\n2c78bad31e9c: Pushed\n145b89be85f1: Pushed\n18cabbd35713: Pushed\n3c93376a81c2: Pushed'
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
