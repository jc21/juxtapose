'use strict';

const migrate_name     = 'templates';
const logger           = require('../logger');
const batchflow        = require('batchflow');
const internalTemplate = require('../internal/template');

const common_values = {
    icon_url_default:       'https://public.jc21.com/juxtapose/icons/default.png',
    icon_url_orange:        'https://public.jc21.com/juxtapose/icons/orange.png',
    icon_url_red:           'https://public.jc21.com/juxtapose/icons/red.png',
    service_type_slack:     'slack',
    service_type_jira:      'jira-webhook',
    service_type_bitbucket: 'bitbucket-webhook',
    service_type_dockerhub: 'dockerhub-webhook'
};

/**
 * Initial Templates
 *
 * @type {Array}
 */
const templates = [
    /**
     * Jira 1: Assigned Issue To You Minimal
     */
    {
        service_type:    common_values.service_type_slack,
        in_service_type: common_values.service_type_jira,
        name:            'Assigned Issue To You Minimal',
        content:         '{\n' +
                         '  "icon_url": "{{ icon_url }}",\n' +
                         '  "text": "{{ user }} has assigned an issue to you",\n' +
                         '  "attachments": [\n' +
                         '    {\n' +
                         '      "title": "<{{ issueurl }}|{{ issuekey }} - {{ summary }}>",\n' +
                         '      "color": "{{ panel_color }}"\n' +
                         '    }\n' +
                         '  ]\n' +
                         '}',
        default_options: {
            icon_url:    common_values.icon_url_default,
            panel_color: '#bdd81d'
        },
        example_data:    {
            user:     'Billy Bob',
            summary:  'Enable Feature x for Customer y',
            issuekey: 'FEAT-1234',
            issueurl: 'http://example.com'
        },
        event_types:     ['assigned'],
        render_engine:   'liquid'
    },

    /**
     * Jira 2: Assigned Issue To You w/ Description
     */
    {
        service_type:    common_values.service_type_slack,
        in_service_type: common_values.service_type_jira,
        name:            'Assigned Issue To You w/ Description',
        content:         '{\n' +
                         '  "icon_url": "{{ icon_url }}",\n' +
                         '  "text": "{{ user }} has assigned {{ issuetype }} <{{ issueurl }}|{{ issuekey }}> to you",\n' +
                         '  "attachments": [\n' +
                         '    {\n' +
                         '      "title": "<{{ issueurl }}|{{ summary }}>",\n' +
                         '      "text": "{{ description | unescape }}",\n' +
                         '      "color": "{{ panel_color }}"\n' +
                         '    }\n' +
                         '  ]\n' +
                         '}',
        default_options: {
            icon_url:    common_values.icon_url_default,
            panel_color: '#bdd81d'
        },
        example_data:    {
            user:        'Billy Bob',
            summary:     'Enable Feature x for Customer y',
            description: 'Customer y wants this feature because of reason z.',
            issuekey:    'FEAT-1234',
            issueurl:    'http://example.com',
            issuetype:   'Task'
        },
        event_types:     ['assigned'],
        render_engine:   'liquid'
    },

    /**
     * Jira 3: Comment Added #1
     */
    {
        service_type:    common_values.service_type_slack,
        in_service_type: common_values.service_type_jira,
        name:            'Comment Added #1',
        content:         '{\n' +
                         '  "icon_url": "{{ icon_url }}",\n' +
                         '  "text": "New comment added to {{ issuetype }} <{{ issueurl }}|{{ issuekey }}> by {{ comment.name }}",\n' +
                         '  "attachments": [\n' +
                         '    {\n' +
                         '      "title": "<{{ issueurl }}|{{ summary }}>",\n' +
                         '      "text": "{{ comment.content }}",\n' +
                         '      "color": "{{ panel_color }}"\n' +
                         '    }\n' +
                         '  ]\n' +
                         '}',
        default_options: {
            icon_url:    common_values.icon_url_default,
            panel_color: '#22d6d4'
        },
        example_data:    {
            summary:   'Enable Feature x for Customer y',
            issuekey:  'FEAT-1234',
            issueurl:  'http://example.com',
            issuetype: 'Task',
            comment:   {
                name:    'Billy Bob',
                content: 'This has been done, just waiting on some confirmation.'
            }
        },
        event_types:     ['comment_participated', 'comment', 'comment_reported'],
        render_engine:   'liquid'
    },

    /**
     * Jira 4: Comment Added #2
     */
    {
        service_type:    common_values.service_type_slack,
        in_service_type: common_values.service_type_jira,
        name:            'Comment Added #2',
        content:         '{\n' +
                         '  "icon_url": "{{ icon_url }}",\n' +
                         '  "text": "{{ comment.name }} has comment an issue assigned to you",\n' +
                         '  "attachments": [\n' +
                         '    {\n' +
                         '      "title": "<{{ issueurl }}|{{ issuekey }} - {{ summary }}>",\n' +
                         '      "color": "{{ panel_color }}",\n' +
                         '      "fields": [\n' +
                         '        {\n' +
                         '          "value": "{{ comment.content }}"\n' +
                         '        }\n' +
                         '      ]\n' +
                         '    }\n' +
                         '  ]\n' +
                         '}',
        default_options: {
            icon_url:    common_values.icon_url_default,
            panel_color: '#22d6d4'
        },
        example_data:    {
            summary:  'Enable Feature x for Customer y',
            issuekey: 'FEAT-1234',
            issueurl: 'http://example.com',
            comment:  {
                name:    'Billy Bob',
                content: 'This has been done, just waiting on some confirmation.'
            }
        },
        event_types:     ['comment'],
        render_engine:   'liquid'
    },

    /**
     * Jira 5: Comment Added on Reported
     */
    {
        service_type:    common_values.service_type_slack,
        in_service_type: common_values.service_type_jira,
        name:            'Comment Added on Reported',
        content:         '{\n' +
                         '  "icon_url": "{{ icon_url }}",\n' +
                         '  "text": "{{ comment.name }} has commented on an issue you reported",\n' +
                         '  "attachments": [\n' +
                         '    {\n' +
                         '      "title": "<{{ issueurl }}|{{ issuekey }} - {{ summary }}>",\n' +
                         '      "color": "{{ panel_color }}",\n' +
                         '      "fields": [\n' +
                         '        {\n' +
                         '          "value": "{{ comment.content }}"\n' +
                         '        }\n' +
                         '      ]\n' +
                         '    }\n' +
                         '  ]\n' +
                         '}',
        default_options: {
            icon_url:    common_values.icon_url_default,
            panel_color: '#22d6d4'
        },
        example_data:    {
            summary:  'Enable Feature x for Customer y',
            issuekey: 'FEAT-1234',
            issueurl: 'http://example.com',
            comment:  {
                name:    'Billy Bob',
                content: 'This has been done, just waiting on some confirmation.'
            }
        },
        event_types:     ['comment_reported'],
        render_engine:   'liquid'
    },

    /**
     * Jira 6: Logged Issue Minimal
     */
    {
        service_type:    common_values.service_type_slack,
        in_service_type: common_values.service_type_jira,
        name:            'Logged Issue Minimal',
        content:         '{\n' +
                         '  "icon_url": "{{ icon_url }}",\n' +
                         '  "text": "{{ user }} has logged an issue",\n' +
                         '  "attachments": [\n' +
                         '    {\n' +
                         '      "title": "<{{ issueurl }}|{{ issuekey }} - {{ summary }}>",\n' +
                         '      "color": "{{ panel_color }}"\n' +
                         '    }\n' +
                         '  ]\n' +
                         '}',
        default_options: {
            icon_url:    common_values.icon_url_default,
            panel_color: '#d81d39'
        },
        example_data:    {
            user:     'Billy Bob',
            summary:  'Enable Feature x for Customer y',
            issuekey: 'FEAT-1234',
            issueurl: 'http://example.com'
        },
        event_types:     ['logged_unassigned'],
        render_engine:   'liquid'
    },

    /**
     * Jira 7: Logged Issue w/ Description
     */
    {
        service_type:    common_values.service_type_slack,
        in_service_type: common_values.service_type_jira,
        name:            'Logged Issue w/ Description',
        content:         '{\n' +
                         '  "icon_url": "{{ icon_url }}",\n' +
                         '  "text": "{{ user }} has logged {{ issuetype }} <{{ issueurl }}|{{ issuekey }}>",\n' +
                         '  "attachments": [\n' +
                         '    {\n' +
                         '      "title": "<{{ issueurl }}|{{ summary }}>",\n' +
                         '      "text": "{{ description | unescape }}",\n' +
                         '      "color": "{{ panel_color }}"\n' +
                         '    }\n' +
                         '  ]\n' +
                         '}',
        default_options: {
            icon_url:    common_values.icon_url_default,
            panel_color: '#d81d39'
        },
        example_data:    {
            user:        'Billy Bob',
            summary:     'Enable Feature x for Customer y',
            description: 'Customer y wants this feature because of reason z.',
            issuekey:    'FEAT-1234',
            issueurl:    'http://example.com',
            issuetype:   'Task'
        },
        event_types:     ['logged_unassigned'],
        render_engine:   'liquid'
    },

    /**
     * Jira 8: Re-assigned Away From You Minimal
     */
    {
        service_type:    common_values.service_type_slack,
        in_service_type: common_values.service_type_jira,
        name:            'Re-assigned Away From You Minimal',
        content:         '{\n' +
                         '  "icon_url": "{{ icon_url }}",\n' +
                         '  "text": "{{ user }} has re-assigned an issue away from you",\n' +
                         '  "attachments": [\n' +
                         '    {\n' +
                         '      "title": "<{{ issueurl }}|{{ issuekey }} - {{ summary }}>",\n' +
                         '      "text": "New Asignee: {{ assignee }}",\n' +
                         '      "color": "{{ panel_color }}"\n' +
                         '    }\n' +
                         '  ]\n' +
                         '}',
        default_options: {
            icon_url:    common_values.icon_url_default,
            panel_color: '#0090ff'
        },
        example_data:    {
            summary:   'Enable Feature x for Customer y',
            issuekey:  'FEAT-1234',
            issueurl:  'http://example.com',
            issuetype: 'Task',
            user:      'Billy Bob',
            assignee:  'Joe Citizen'
        },
        event_types:     ['reassigned'],
        render_engine:   'liquid'
    },

    /**
     * Jira 9: Re-opened Unassigned
     */
    {
        service_type:    common_values.service_type_slack,
        in_service_type: common_values.service_type_jira,
        name:            'Re-opened Unassigned',
        content:         '{\n' +
                         '  "icon_url": "{{ icon_url }}",\n' +
                         '  "text": "{{ user }} has re-opened an Unassigned issue",\n' +
                         '  "attachments": [\n' +
                         '    {\n' +
                         '      "title": "<{{ issueurl }}|{{ issuekey }} - {{ summary }}>",\n' +
                         '      "color": "{{ panel_color }}"\n' +
                         '    }\n' +
                         '  ]\n' +
                         '}',
        default_options: {
            icon_url:    common_values.icon_url_default,
            panel_color: '#ffae00'
        },
        example_data:    {
            user:     'Billy Bob',
            summary:  'Enable Feature x for Customer y',
            issuekey: 'FEAT-1234',
            issueurl: 'http://example.com'
        },
        event_types:     ['reopened_unassigned'],
        render_engine:   'liquid'
    },

    /**
     * Jira 10: Re-opened Your Issue Minimal
     */
    {
        service_type:    common_values.service_type_slack,
        in_service_type: common_values.service_type_jira,
        name:            'Re-opened Your Issue Minimal',
        content:         '{\n' +
                         '  "icon_url": "{{ icon_url }}",\n' +
                         '  "text": "{{ user }} has re-opened an issue assigned to you",\n' +
                         '  "attachments": [\n' +
                         '    {\n' +
                         '      "title": "<{{ issueurl }}|{{ issuekey }} - {{ summary }}>",\n' +
                         '      "color": "{{ panel_color }}"\n' +
                         '    }\n' +
                         '  ]\n' +
                         '}',
        default_options: {
            icon_url:    common_values.icon_url_default,
            panel_color: '#ffae00'
        },
        example_data:    {
            user:     'Billy Bob',
            summary:  'Enable Feature x for Customer y',
            issuekey: 'FEAT-1234',
            issueurl: 'http://example.com'
        },
        event_types:     ['reopened'],
        render_engine:   'liquid'
    },

    /**
     * Jira 11: Re-opened Your Issue w/ Description
     */
    {
        service_type:    common_values.service_type_slack,
        in_service_type: common_values.service_type_jira,
        name:            'Re-opened Your Issue w/ Description',
        content:         '{\n' +
                         '  "icon_url": "{{ icon_url }}",\n' +
                         '  "text": "{{ user }} has re-opened {{ issuetype }} <{{ issueurl }}|{{ issuekey }}> assigned to you",\n' +
                         '  "attachments": [\n' +
                         '    {\n' +
                         '      "title": "<{{ issueurl }}|{{ summary }}>",\n' +
                         '      "text": "{{ description | unescape }}",\n' +
                         '      "color": "{{ panel_color }}"\n' +
                         '    }\n' +
                         '  ]\n' +
                         '}',
        default_options: {
            icon_url:    common_values.icon_url_default,
            panel_color: '#ffae00'
        },
        example_data:    {
            summary:     'Enable Feature x for Customer y',
            issuekey:    'FEAT-1234',
            issueurl:    'http://example.com',
            issuetype:   'Task',
            user:        'Billy Bob',
            description: 'Customer y wants this feature because of reason z.'
        },
        event_types:     ['reopened'],
        render_engine:   'liquid'
    },

    /**
     * Jira 12: Re-opened Your Reported Issue Minimal
     */
    {
        service_type:    common_values.service_type_slack,
        in_service_type: common_values.service_type_jira,
        name:            'Re-opened Your Reported Issue Minimal',
        content:         '{\n' +
                         '  "icon_url": "{{ icon_url }}",\n' +
                         '  "text": "{{ user }} has re-opened an issue you reported",\n' +
                         '  "attachments": [\n' +
                         '    {\n' +
                         '      "title": "<{{ issueurl }}|{{ issuekey }} - {{ summary }}>",\n' +
                         '      "color": "{{ panel_color }}"\n' +
                         '    }\n' +
                         '  ]\n' +
                         '}',
        default_options: {
            icon_url:    common_values.icon_url_default,
            panel_color: '#ffae00'
        },
        example_data:    {
            summary:  'Enable Feature x for Customer y',
            issuekey: 'FEAT-1234',
            issueurl: 'http://example.com',
            user:     'Billy Bob'
        },
        event_types:     ['reopened_reported'],
        render_engine:   'liquid'
    },

    /**
     * Jira 13: Re-opened Your Reported Issue w/ Description
     */
    {
        service_type:    common_values.service_type_slack,
        in_service_type: common_values.service_type_jira,
        name:            'Re-opened Your Reported Issue w/ Description',
        content:         '{\n' +
                         '  "icon_url": "{{ icon_url }}",\n' +
                         '  "text": "{{ user }} has re-opened {{ issuetype }} <{{ issueurl }}|{{ issuekey }}> you reported",\n' +
                         '  "attachments": [\n' +
                         '    {\n' +
                         '      "title": "<{{ issueurl }}|{{ summary }}>",\n' +
                         '      "text": "{{ description | unescape }}",\n' +
                         '      "color": "{{ panel_color }}"\n' +
                         '    }\n' +
                         '  ]\n' +
                         '}',
        default_options: {
            icon_url:    common_values.icon_url_default,
            panel_color: '#ffae00'
        },
        example_data:    {
            summary:     'Enable Feature x for Customer y',
            issuekey:    'FEAT-1234',
            issueurl:    'http://example.com',
            issuetype:   'Task',
            user:        'Billy Bob',
            description: 'Customer y wants this feature because of reason z.'
        },
        event_types:     ['reopened_reported'],
        render_engine:   'liquid'
    },

    /**
     * Jira 14: Resolved Issue Generic Minimal
     */
    {
        service_type:    common_values.service_type_slack,
        in_service_type: common_values.service_type_jira,
        name:            'Resolved Issue Generic Minimal',
        content:         '{\n' +
                         '  "icon_url": "{{ icon_url }}",\n' +
                         '  "text": "{{ user }} has resolved an issue as {{ resolution }}",\n' +
                         '  "attachments": [\n' +
                         '    {\n' +
                         '      "title": "<{{ issueurl }}|{{ issuekey }} - {{ summary }}>",\n' +
                         '      "color": "{{ panel_color }}"\n' +
                         '    }\n' +
                         '  ]\n' +
                         '}',
        default_options: {
            icon_url:    common_values.icon_url_default,
            panel_color: '#d62398'
        },
        example_data:    {
            user:       'Billy Bob',
            summary:    'Enable Feature x for Customer y',
            issuekey:   'FEAT-1234',
            issueurl:   'http://example.com',
            resolution: 'Completed'
        },
        event_types:     ['resolved_all', 'resolved_reported', 'resolved'],
        render_engine:   'liquid'
    },

    /**
     * Jira 15: Resolved Issue Generic w/ Description
     */
    {
        service_type:    common_values.service_type_slack,
        in_service_type: common_values.service_type_jira,
        name:            'Resolved Issue Generic w/ Description',
        content:         '{\n' +
                         '  "icon_url": "{{ icon_url }}",\n' +
                         '  "text": "{{ user }} has resolved {{ issuetype }} <{{ issueurl }}|{{ issuekey }}> as {{ resolution }}",\n' +
                         '  "attachments": [\n' +
                         '    {\n' +
                         '      "title": "<{{ issueurl }}|{{ issuekey }} - {{ summary }}>",\n' +
                         '      "text": "{{ description | unescape }}",\n' +
                         '      "color": "{{ panel_color }}"\n' +
                         '    }\n' +
                         '  ]\n' +
                         '}',
        default_options: {
            icon_url:    common_values.icon_url_default,
            panel_color: '#d62398'
        },
        example_data:    {
            summary:     'Enable Feature x for Customer y',
            issuekey:    'FEAT-1234',
            description: 'Customer y wants this feature because of reason z.',
            issueurl:    'http://example.com',
            issuetype:   'Task',
            user:        'Billy Bob',
            resolution:  'Completed'
        },
        event_types:     ['resolved_reported', 'resolved_all', 'resolved'],
        render_engine:   'liquid'
    },

    /**
     * Jira 16: Resolved Reported Issue Minimal
     */
    {
        service_type:    common_values.service_type_slack,
        in_service_type: common_values.service_type_jira,
        name:            'Resolved Reported Issue Minimal',
        content:         '{\n' +
                         '  "icon_url": "{{ icon_url }}",\n' +
                         '  "text": "{{ user }} has resolved an issue you reported as {{ resolution }}",\n' +
                         '  "attachments": [\n' +
                         '    {\n' +
                         '      "title": "<{{ issueurl }}|{{ issuekey }} - {{ summary }}>",\n' +
                         '      "color": "{{ panel_color }}"\n' +
                         '    }\n' +
                         '  ]\n' +
                         '}',
        default_options: {
            icon_url:    common_values.icon_url_default,
            panel_color: '#d62398'
        },
        example_data:    {
            user:       'Billy Bob',
            summary:    'Enable Feature x for Customer y',
            issuekey:   'FEAT-1234',
            issueurl:   'http://example.com',
            resolution: 'Completed'
        },
        event_types:     ['resolved_reported'],
        render_engine:   'liquid'
    },

    /**
     * Jira 17: Resolved Reported Issue w/ Assignee
     */
    {
        service_type:    common_values.service_type_slack,
        in_service_type: common_values.service_type_jira,
        name:            'Resolved Reported Issue w/ Assignee',
        content:         '{\n' +
                         '  "icon_url": "{{ icon_url }}",\n' +
                         '  "text": "{{ user }} has resolved {{ issuetype }} <{{ issueurl }}|{{ issuekey }}> you reported",\n' +
                         '  "attachments": [\n' +
                         '    {\n' +
                         '      "title": "<{{ issueurl }}|{{ issuekey }} - {{ summary }}>",\n' +
                         '      "text": "{{ description | unescape }}",\n' +
                         '      "color": "{{ panel_color }}",\n' +
                         '      "fields": [\n' +
                         '        {\n' +
                         '          "title": "Assigned To",\n' +
                         '          "value": "{{ assignee }}",\n' +
                         '          "short": true\n' +
                         '        },\n' +
                         '        {\n' +
                         '          "title": "Resolution",\n' +
                         '          "value": "{{ resolution }}",\n' +
                         '          "short": true\n' +
                         '        }\n' +
                         '      ]\n' +
                         '    }\n' +
                         '  ]\n' +
                         '}',
        default_options: {
            icon_url:    common_values.icon_url_default,
            panel_color: '#d62398'
        },
        example_data:    {
            summary:     'Enable Feature x for Customer y',
            issuekey:    'FEAT-1234',
            description: 'Customer y wants this feature because of reason z.',
            issueurl:    'http://example.com',
            issuetype:   'Task',
            user:        'Billy Bob',
            assignee:    'Joe Citizen',
            resolution:  'Done'
        },
        event_types:     ['resolved_all', 'resolved_reported'],
        render_engine:   'liquid'
    },

    /**
     * Jira 18: Resolved Your Issue Minimal
     */
    {
        service_type:    common_values.service_type_slack,
        in_service_type: common_values.service_type_jira,
        name:            'Resolved Your Issue Minimal',
        content:         '{\n' +
                         '  "icon_url": "{{ icon_url }}",\n' +
                         '  "text": "{{ user }} has resolved an issue assigned to you",\n' +
                         '  "attachments": [\n' +
                         '    {\n' +
                         '      "title": "<{{ issueurl }}|{{ issuekey }} - {{ summary }}>",\n' +
                         '      "color": "{{ panel_color }}"\n' +
                         '    }\n' +
                         '  ]\n' +
                         '}',
        default_options: {
            icon_url:    common_values.icon_url_default,
            panel_color: '#d62398'
        },
        example_data:    {
            user:     'Billy Bob',
            summary:  'Enable Feature x for Customer y',
            issuekey: 'FEAT-1234',
            issueurl: 'http://example.com'
        },
        event_types:     ['resolved'],
        render_engine:   'liquid'
    },

    /**
     * Jira 19: Resolved Your Issue w/ Description
     */
    {
        service_type:    common_values.service_type_slack,
        in_service_type: common_values.service_type_jira,
        name:            'Resolved Your Issue w/ Description',
        content:         '{\n' +
                         '  "icon_url": "{{ icon_url }}",\n' +
                         '  "text": "{{ user }} has resolved {{ issuetype }} <{{ issueurl }}|{{ issuekey }}> assigned to you",\n' +
                         '  "attachments": [\n' +
                         '    {\n' +
                         '      "title": "<{{ issueurl }}|{{ issuekey }} - {{ summary }}>",\n' +
                         '      "text": "{{ description | unescape }}",\n' +
                         '      "color": "{{ panel_color }}"\n' +
                         '    }\n' +
                         '  ]\n' +
                         '}',
        default_options: {
            icon_url:    common_values.icon_url_default,
            panel_color: '#d62398'
        },
        example_data:    {
            user:        'Billy Bob',
            summary:     'Enable Feature x for Customer y',
            issuekey:    'FEAT-1234',
            description: 'Customer y wants this feature because of reason z.',
            issueurl:    'http://example.com',
            issuetype:   'Task'
        },
        event_types:     ['resolved'],
        render_engine:   'liquid'
    },

    /**
     * Jira 20: Updated Issue Generic Minimal
     */
    {
        service_type:    common_values.service_type_slack,
        in_service_type: common_values.service_type_jira,
        name:            'Updated Issue Generic Minimal',
        content:         '{\n' +
                         '  "icon_url": "{{ icon_url }}",\n' +
                         '  "text": "{{ user }} has updated an issue",\n' +
                         '  "attachments": [\n' +
                         '    {\n' +
                         '      "title": "<{{ issueurl }}|{{ issuekey }} - {{ summary }}>",\n' +
                         '      "color": "{{ panel_color }}"\n' +
                         '    }\n' +
                         '  ]\n' +
                         '}',
        default_options: {
            icon_url:    common_values.icon_url_default,
            panel_color: '#0090ff'
        },
        example_data:    {
            user:        'Billy Bob',
            summary:     'Enable Feature x for Customer y',
            description: 'Customer y wants this feature because of reason z.',
            issuekey:    'FEAT-1234',
            issueurl:    'http://example.com',
            issuetype:   'Task'
        },
        event_types:     ['updated_participated', 'updated', 'updated_reported'],
        render_engine:   'liquid'
    },

    /**
     * Jira 21: Updated Issue Generic w/ Description
     */
    {
        service_type:    common_values.service_type_slack,
        in_service_type: common_values.service_type_jira,
        name:            'Updated Issue Generic w/ Description',
        content:         '{\n' +
                         '  "icon_url": "{{ icon_url }}",\n' +
                         '  "text": "{{ user }} has updated {{ issuetype }} <{{ issueurl }}|{{ issuekey }}>",\n' +
                         '  "attachments": [\n' +
                         '    {\n' +
                         '      "title": "<{{ issueurl }}|{{ summary }}>",\n' +
                         '      "text": "{{ description | unescape }}",\n' +
                         '      "color": "{{ panel_color }}"\n' +
                         '    }\n' +
                         '  ]\n' +
                         '}',
        default_options: {
            icon_url:    common_values.icon_url_default,
            panel_color: '#0090ff'
        },
        example_data:    {
            user:        'Billy Bob',
            summary:     'Enable Feature x for Customer y',
            description: 'Customer y wants this feature because of reason z.',
            issuekey:    'FEAT-1234',
            issueurl:    'http://example.com',
            issuetype:   'Task'
        },
        event_types:     ['updated_participated', 'updated_reported', 'updated'],
        render_engine:   'liquid'
    },

    /**
     * Jira 22: Updated Issue Generic w/ Fields
     */
    {
        service_type:    common_values.service_type_slack,
        in_service_type: common_values.service_type_jira,
        name:            'Updated Issue Generic w/ Fields',
        content:         '{\n' +
                         '  "icon_url": "{{ icon_url }}",\n' +
                         '  "text": "{{ user }} has updated {{ issuetype }} <{{ issueurl }}|{{ issuekey }}>",\n' +
                         '  "attachments": [\n' +
                         '    {\n' +
                         '      "title": "<{{ issueurl }}|{{ summary }}>",\n' +
                         '      "text": "{{ description | unescape }}",\n' +
                         '      "color": "{{ panel_color }}",\n' +
                         '      "fields": [\n' +
                         '        {\n' +
                         '          "title": "Updated Fields",\n' +
                         '          "value": "{{ fields }}"\n' +
                         '        }\n' +
                         '      ]\n' +
                         '    }\n' +
                         '  ]\n' +
                         '}',
        default_options: {
            icon_url:    common_values.icon_url_default,
            panel_color: '#0090ff'
        },
        example_data:    {
            user:        'Billy bob',
            summary:     'Enable Feature x for Customer y',
            description: 'Customer y wants this feature because of reason z.',
            issuekey:    'FEAT-1234',
            issueurl:    'http://example.com',
            issuetype:   'Task',
            fields:      'Rank, Summary'
        },
        event_types:     ['updated_reported', 'updated_participated', 'updated'],
        render_engine:   'liquid'
    },

    /**
     * Jira 23: Updated Reported Issue Minimal
     */
    {
        service_type:    common_values.service_type_slack,
        in_service_type: common_values.service_type_jira,
        name:            'Updated Reported Issue Minimal',
        content:         '{\n' +
                         '  "icon_url": "{{ icon_url }}",\n' +
                         '  "text": "{{ user }} has updated an issue you reported",\n' +
                         '  "attachments": [\n' +
                         '    {\n' +
                         '      "title": "<{{ issueurl }}|{{ issuekey }} - {{ summary }}>",\n' +
                         '      "color": "{{ panel_color }}"\n' +
                         '    }\n' +
                         '  ]\n' +
                         '}',
        default_options: {
            icon_url:    common_values.icon_url_default,
            panel_color: '#0090ff'
        },
        example_data:    {
            user:      'Billy Bob',
            summary:   'Enable Feature x for Customer y',
            issuekey:  'FEAT-1234',
            issueurl:  'http://example.com',
            issuetype: 'Task'
        },
        event_types:     ['updated_reported'],
        render_engine:   'liquid'
    },

    /**
     * Jira 24: Updated Reported Issue w/ Fields
     */
    {
        service_type:    common_values.service_type_slack,
        in_service_type: common_values.service_type_jira,
        name:            'Updated Reported Issue w/ Fields',
        content:         '{\n' +
                         '  "icon_url": "{{ icon_url }}",\n' +
                         '  "text": "{{ user }} has updated {{ issuetype }} <{{ issueurl }}|{{ issuekey }}> you reported",\n' +
                         '  "attachments": [\n' +
                         '    {\n' +
                         '      "title": "<{{ issueurl }}|{{ issuekey }} - {{ summary }}>",\n' +
                         '      "color": "{{ panel_color }}",\n' +
                         '      "fields": [\n' +
                         '        {\n' +
                         '          "title": "Updated Fields",\n' +
                         '          "value": "{{ fields }}",\n' +
                         '          "short": true\n' +
                         '        },\n' +
                         '        {\n' +
                         '          "title": "Assigned To",\n' +
                         '          "value": "{{ assignee }}",\n' +
                         '          "short": true\n' +
                         '        }\n' +
                         '      ]\n' +
                         '    }\n' +
                         '  ]\n' +
                         '}',
        default_options: {
            icon_url:    common_values.icon_url_default,
            panel_color: '#0090ff'
        },
        example_data:    {
            user:      'Billy Bob',
            summary:   'Enable Feature x for Customer y',
            issuekey:  'FEAT-1234',
            issueurl:  'http://example.com',
            issuetype: 'Task',
            assignee:  'Joe Citizen',
            fields:    'Summary, Description'
        },
        event_types:     ['updated_reported'],
        render_engine:   'liquid'
    },

    /**
     * Jira 25: Updated Your Issue Minimal
     */
    {
        service_type:    common_values.service_type_slack,
        in_service_type: common_values.service_type_jira,
        name:            'Updated Your Issue Minimal',
        content:         '{\n' +
                         '  "icon_url": "{{ icon_url }}",\n' +
                         '  "text": "{{ user }} has updated an issue assigned to you",\n' +
                         '  "attachments": [\n' +
                         '    {\n' +
                         '      "title": "<{{ issueurl }}|{{ issuekey }} - {{ summary }}>",\n' +
                         '      "color": "{{ panel_color }}"\n' +
                         '    }\n' +
                         '  ]\n' +
                         '}',
        default_options: {
            icon_url:    common_values.icon_url_default,
            panel_color: '#0090ff'
        },
        example_data:    {
            user:     'Billy Bob',
            summary:  'Enable Feature x for Customer y',
            issuekey: 'FEAT-1234',
            issueurl: 'http://example.com'
        },
        event_types:     ['updated'],
        render_engine:   'liquid'
    },

    /**
     * Jira 26: Updated Your Issue w/ Description
     */
    {
        service_type:    common_values.service_type_slack,
        in_service_type: common_values.service_type_jira,
        name:            'Updated Your Issue w/ Description',
        content:         '{\n' +
                         '  "icon_url": "{{ icon_url }}",\n' +
                         '  "text": "{{ user }} has updated {{ issuetype }} <{{ issueurl }}|{{ issuekey }}> assigned to you",\n' +
                         '  "attachments": [\n' +
                         '    {\n' +
                         '      "title": "<{{ issueurl }}|{{ summary }}>",\n' +
                         '      "text": "{{ description | unescape }}",\n' +
                         '      "color": "{{ panel_color }}"\n' +
                         '    }\n' +
                         '  ]\n' +
                         '}',
        default_options: {
            icon_url:    common_values.icon_url_default,
            panel_color: '#0090ff'
        },
        example_data:    {
            user:        'Billy Bob',
            summary:     'Enable Feature x for Customer y',
            issuekey:    'FEAT-1234',
            description: 'Customer y wants this feature because of reason z.',
            issueurl:    'http://example.com',
            issuetype:   'Task'
        },
        event_types:     ['updated'],
        render_engine:   'liquid'
    },

    /**
     * Jira 27: Updated Your Issue w/ Fields
     */
    {
        service_type:    common_values.service_type_slack,
        in_service_type: common_values.service_type_jira,
        name:            'Updated Your Issue w/ Fields',
        content:         '{\n' +
                         '  "icon_url": "{{ icon_url }}",\n' +
                         '  "text": "{{ user }} has updated {{ issuetype }} <{{ issueurl }}|{{ issuekey }}> assigned to you",\n' +
                         '  "attachments": [\n' +
                         '    {\n' +
                         '      "title": "<{{ issueurl }}|{{ summary }}>",\n' +
                         '      "text": "{{ description | unescape }}",\n' +
                         '      "color": "{{ panel_color }}",\n' +
                         '      "fields": [\n' +
                         '        {\n' +
                         '          "title": "Updated Fields",\n' +
                         '          "value": "{{ fields }}"\n' +
                         '        }\n' +
                         '      ]\n' +
                         '    }\n' +
                         '  ]\n' +
                         '}',
        default_options: {
            icon_url:    common_values.icon_url_default,
            panel_color: '#0090ff'
        },
        example_data:    {
            user:        'Billy Bob',
            summary:     'Enable Feature x for Customer y',
            issuekey:    'FEAT-1234',
            description: 'Customer y wants this feature because of reason z.',
            issueurl:    'http://example.com',
            issuetype:   'Task',
            fields:      'Rank, Summary'
        },
        event_types:     ['updated'],
        render_engine:   'liquid'
    },

    /**
     * Bitbucket 1: PR Opened
     */
    {
        service_type:    common_values.service_type_slack,
        in_service_type: common_values.service_type_bitbucket,
        name:            'PR Opened',
        content:         '{\n' +
                         '  "icon_url": "{{ icon_url }}",\n' +
                         '  "text": "{{ user }} has opened a PR",\n' +
                         '  "attachments": [\n' +
                         '    {\n' +
                         '      "title": "<{{ prurl }}|{{ title }}>",\n' +
                         '      {% if description %}"text": "{{ description | unescape }}",{% endif %}\n' +
                         '      "color": "{{ panel_color }}",\n' +
                         '      "fields": [\n' +
                         '        {% if from and from.repo %}\n' +
                         '        {\n' +
                         '          "title": "Source",\n' +
                         '          "value": "{{ from.project }} / {{ from.repo }} / {{ from.branch }}",\n' +
                         '          "short": true\n' +
                         '        },\n' +
                         '        {% endif %}\n' +
                         '        {\n' +
                         '          "title": "Destination",\n' +
                         '          "value": "{{ project }} / {{ repo }} / {{ branch }}",\n' +
                         '          "short": true\n' +
                         '        }\n' +
                         '      ]\n' +
                         '    }\n' +
                         '  ]\n' +
                         '}',
        default_options: {
            icon_url:    common_values.icon_url_orange,
            panel_color: '#ffbf00'
        },
        example_data:    {
            user:        'Billy Bob',
            prurl:       'http://example.com',
            title:       'FEAT-1234 - Added script to enable feature x',
            description: 'Customer y now has feature x.',
            project:     'PROD',
            repo:        'application',
            branch:      'master',
            from:        {
                project: 'billybob',
                repo:    'application',
                branch:  'feature/1234'
            }
        },
        event_types:     ['pr_review_requested', 'pr_opened'],
        render_engine:   'liquid'
    },

    /**
     * Bitbucket 2: Your PR was Approved
     */
    {
        service_type:    common_values.service_type_slack,
        in_service_type: common_values.service_type_bitbucket,
        name:            'Your PR was Approved',
        content:         '{\n' +
                         '  "icon_url": "{{ icon_url }}",\n' +
                         '  "text": "{{ user }} has approved your PR",\n' +
                         '  "attachments": [\n' +
                         '    {\n' +
                         '      "title": "<{{ prurl }}|{{ title }}>",\n' +
                         '      "color": "{{ panel_color }}",\n' +
                         '      "fields": [\n' +
                         '        {\n' +
                         '          "title": "Approvals",\n' +
                         '          "value": "{{ approval_count }}"\n' +
                         '        }\n' +
                         '      ]\n' +
                         '    }\n' +
                         '  ]\n' +
                         '}',
        default_options: {
            icon_url:    common_values.icon_url_orange,
            panel_color: '#ffbf00'
        },
        example_data:    {
            user:           'Billy Bob',
            prurl:          'http://example.com',
            title:          'FEAT-1234 - Added script to enable feature x',
            description:    'Customer y now has feature x.',
            project:        'PROD',
            repo:           'application',
            branch:         'master',
            approval_count: 2,
            from:           {
                project: 'billybob',
                repo:    'application',
                branch:  'feature/1234'
            }
        },
        event_types:     ['my_pr_approved'],
        render_engine:   'liquid'
    },

    /**
     * Bitbucket 3: Your PR Needs Work
     */
    {
        service_type:    common_values.service_type_slack,
        in_service_type: common_values.service_type_bitbucket,
        name:            'Your PR Needs Work',
        content:         '{\n' +
                         '  "icon_url": "{{ icon_url }}",\n' +
                         '  "text": "{{ user }} has reviewed your PR as Needs Work",\n' +
                         '  "attachments": [\n' +
                         '    {\n' +
                         '      "title": "<{{ prurl }}|{{ title }}>",\n' +
                         '      "color": "{{ panel_color }}"\n' +
                         '    }\n' +
                         '  ]\n' +
                         '}',
        default_options: {
            icon_url:    common_values.icon_url_orange,
            panel_color: '#ffbf00'
        },
        example_data:    {
            user:        'Billy Bob',
            prurl:       'http://example.com',
            title:       'FEAT-1234 - Added script to enable feature x',
            description: 'Customer y now has feature x.',
            project:     'PROD',
            repo:        'application',
            branch:      'master',
            from:        {
                project: 'billybob',
                repo:    'application',
                branch:  'feature/1234'
            }
        },
        event_types:     ['my_pr_needs_work'],
        render_engine:   'liquid'
    },

    /**
     * Bitbucket 4: PR Merged
     */
    {
        service_type:    common_values.service_type_slack,
        in_service_type: common_values.service_type_bitbucket,
        name:            'PR Merged',
        content:         '{\n' +
                         '  "icon_url": "{{ icon_url }}",\n' +
                         '  "text": "{{ user }} has merged a PR",\n' +
                         '  "attachments": [\n' +
                         '    {\n' +
                         '      "title": "<{{ prurl }}|{{ title }}>",\n' +
                         '      {% if description %}"text": "{{ description | unescape }}",{% endif %}\n' +
                         '      "color": "{{ panel_color }}"\n' +
                         '    }\n' +
                         '  ]\n' +
                         '}',
        default_options: {
            icon_url:    common_values.icon_url_orange,
            panel_color: '#ffbf00'
        },
        example_data:    {
            user:        'Billy Bob',
            prurl:       'http://example.com',
            title:       'FEAT-1234 - Added script to enable feature x',
            description: 'Customer y now has feature x.',
            project:     'PROD',
            repo:        'application',
            branch:      'master',
            from:        {
                project: 'billybob',
                repo:    'application',
                branch:  'feature/1234'
            }
        },
        event_types:     ['my_pr_merged', 'pr_merged'],
        render_engine:   'liquid'
    },

    /**
     * Bitbucket 5: Your PR was Declined
     */
    {
        service_type:    common_values.service_type_slack,
        in_service_type: common_values.service_type_bitbucket,
        name:            'Your PR was Declined',
        content:         '{\n' +
                         '  "icon_url": "{{ icon_url }}",\n' +
                         '  "text": "{{ user }} has declined your PR",\n' +
                         '  "attachments": [\n' +
                         '    {\n' +
                         '      "title": "<{{ prurl }}|{{ title }}>",\n' +
                         '      {% if description %}"text": "{{ description | unescape }}",{% endif %}\n' +
                         '      "color": "{{ panel_color }}"\n' +
                         '    }\n' +
                         '  ]\n' +
                         '}',
        default_options: {
            icon_url:    common_values.icon_url_orange,
            panel_color: '#ffbf00'
        },
        example_data:    {
            user:        'Billy Bob',
            prurl:       'http://example.com',
            title:       'FEAT-1234 - Added script to enable feature x',
            description: 'Customer y now has feature x.',
            project:     'PROD',
            repo:        'application',
            branch:      'master',
            from:        {
                project: 'billybob',
                repo:    'application',
                branch:  'feature/1234'
            }
        },
        event_types:     ['my_pr_declined'],
        render_engine:   'liquid'
    },

    /**
     * Bitbucket 6: Your PR was Deleted
     */
    {
        service_type:    common_values.service_type_slack,
        in_service_type: common_values.service_type_bitbucket,
        name:            'Your PR was Deleted',
        content:         '{\n' +
                         '  "icon_url": "{{ icon_url }}",\n' +
                         '  "text": "{{ user }} has deleted your PR",\n' +
                         '  "attachments": [\n' +
                         '    {\n' +
                         '      "title": "<{{ prurl }}|{{ title }}>",\n' +
                         '      {% if description %}"text": "{{ description | unescape }}",{% endif %}\n' +
                         '      "color": "{{ panel_color }}"\n' +
                         '    }\n' +
                         '  ]\n' +
                         '}',
        default_options: {
            icon_url:    common_values.icon_url_orange,
            panel_color: '#ffbf00'
        },
        example_data:    {
            user:        'Billy Bob',
            prurl:       'http://example.com',
            title:       'FEAT-1234 - Added script to enable feature x',
            description: 'Customer y now has feature x.',
            project:     'PROD',
            repo:        'application',
            branch:      'master',
            from:        {
                project: 'billybob',
                repo:    'application',
                branch:  'feature/1234'
            }
        },
        event_types:     ['my_pr_deleted'],
        render_engine:   'liquid'
    },

    /**
     * Bitbucket 7: Commented on your PR
     */
    {
        service_type:    common_values.service_type_slack,
        in_service_type: common_values.service_type_bitbucket,
        name:            'Commented on your PR',
        content:         '{\n' +
                         '  "icon_url": "{{ icon_url }}",\n' +
                         '  "text": "{{ user }} has commented on your PR",\n' +
                         '  "attachments": [\n' +
                         '    {\n' +
                         '      "title": "<{{ prurl }}|{{ title }}>",\n' +
                         '      {% if comment and comment.text %}"text": "{{ comment.text }}",{% endif %}\n' +
                         '      "color": "{{ panel_color }}"\n' +
                         '    }\n' +
                         '  ]\n' +
                         '}',
        default_options: {
            icon_url:    common_values.icon_url_orange,
            panel_color: '#ffbf00'
        },
        example_data:    {
            user:        'Billy Bob',
            prurl:       'http://example.com',
            title:       'FEAT-1234 - Added script to enable feature x',
            description: 'Customer y now has feature x.',
            project:     'PROD',
            repo:        'application',
            branch:      'master',
            from:        {
                project: 'billybob',
                repo:    'application',
                branch:  'feature/1234'
            },
            comment:     {
                text:   'This is a random comment with no purpose.',
                author: 'Joe Citizen'
            }
        },
        event_types:     ['my_pr_comment'],
        render_engine:   'liquid'
    },

    /**
     * Bitbucket 8: Your PR Merged
     */
    {
        service_type:    common_values.service_type_slack,
        in_service_type: common_values.service_type_bitbucket,
        name:            'Your PR was Merged',
        content:         '{\n' +
                         '  "icon_url": "{{ icon_url }}",\n' +
                         '  "text": "{{ user }} has merged your PR",\n' +
                         '  "attachments": [\n' +
                         '    {\n' +
                         '      "title": "<{{ prurl }}|{{ title }}>",\n' +
                         '      {% if description %}"text": "{{ description | unescape }}",{% endif %}\n' +
                         '      "color": "{{ panel_color }}"\n' +
                         '    }\n' +
                         '  ]\n' +
                         '}',
        default_options: {
            icon_url:    common_values.icon_url_orange,
            panel_color: '#ffbf00'
        },
        example_data:    {
            user:        'Billy Bob',
            prurl:       'http://example.com',
            title:       'FEAT-1234 - Added script to enable feature x',
            description: 'Customer y now has feature x.',
            project:     'PROD',
            repo:        'application',
            branch:      'master',
            from:        {
                project: 'billybob',
                repo:    'application',
                branch:  'feature/1234'
            }
        },
        event_types:     ['my_pr_merged'],
        render_engine:   'liquid'
    },

    /**
     * DockerHub 1: Repo Updated
     */
    {
        service_type:    common_values.service_type_slack,
        in_service_type: common_values.service_type_dockerhub,
        name:            'Repo Updated',
        content:         '{\n' +
                         '  "icon_url": "{{ icon_url }}",\n' +
                         '  "text": "Docker Repository <{{ url }}|{{ repo }}> updated by {{ pusher }}",\n' +
                         '  "attachments": [\n' +
                         '    {\n' +
                         '      "color": "{{ panel_color }}",\n' +
                         '      "fields": [\n' +
                         '        {\n' +
                         '          "title": "Tag",\n' +
                         '          "value": "{{ tag }}",\n' +
                         '          "short": true\n' +
                         '        },\n' +
                         '        {\n' +
                         '          "title": "Star Count",\n' +
                         '          "value": "{{ star_count }}",\n' +
                         '          "short": true\n' +
                         '        }\n' +
                         '      ]\n' +
                         '    }\n' +
                         '  ]\n' +
                         '}',
        default_options: {
            icon_url:    common_values.icon_url_red,
            panel_color: '#114c6d'
        },
        example_data:    {
            pusher:        'jc21',
            owner:         'jc21',
            repo:          'jc21/juxtapose',
            name:          'juxtapose',
            tag:           'latest',
            namespace:     'jc21',
            description:   'Juxtapose is a self-hosted web app to send notifications from incoming services.',
            url:           'https://hub.docker.com/r/jc21/juxtapose',
            star_count:    1234,
            comment_count: 2
        },
        event_types:     ['repo_updated'],
        render_engine:   'liquid'
    }
];

/**
 * Migrate
 *
 * @see http://knexjs.org/#Schema
 *
 * @param {Object} knex
 * @param {Promise} Promise
 * @returns {Promise}
 */
exports.up = function (knex, Promise) {
    logger.migrate('[' + migrate_name + '] Migrating Up...');

    return new Promise((resolve, reject) => {
        batchflow(templates).sequential()
            .each((i, template_data, next) => {
                logger.migrate('[' + migrate_name + '] Creating Template: ' + template_data.in_service_type + ' -> ' + template_data.service_type + ' -> ' + template_data.name);

                internalTemplate.createRaw(template_data)
                    .then(next)
                    .catch(err => {
                        logger.error('[' + migrate_name + '] ' + err.message);
                        throw err;
                    });
            })
            .error(err => {
                reject(err);
            })
            .end((/*results*/) => {
                resolve(true);
            });
    });
};

/**
 * Undo Migrate
 *
 * @param   {Object}  knex
 * @param   {Promise} Promise
 * @returns {Promise}
 */
exports.down = function (knex, Promise) {
    logger.migrate('[' + migrate_name + '] You can\'t migrate down the templates.');
    return Promise.resolve(true);
};
