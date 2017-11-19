'use strict';

const migrate_name     = 'templates';
const Access           = require('../lib/access');
const logger           = require('../logger');
const batchflow        = require('batchflow');
const internalTemplate = require('../internal/template');

const common_values = {
    icon_url_default:       'https://public.jc21.com/juxtapose/icons/default.png',
    icon_url_orange:        'https://public.jc21.com/juxtapose/icons/orange.png',
    service_type_slack:     'slack',
    service_type_jira:      'jira-webhook',
    service_type_bitbucket: 'bitbucket-webhook'
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
        content:         {
            icon_url:    '<%= icon_url %>',
            text:        '<%= user %> has assigned an issue to you',
            attachments: [
                {
                    title: '<<%= issueurl %>|<%= issuekey %> - <%= summary %>>',
                    color: '<%= panel_color %>'
                }
            ]
        },
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
        event_types:     ['assigned']
    },

    /**
     * Jira 2: Assigned Issue To You w/ Description
     */
    {
        service_type:    common_values.service_type_slack,
        in_service_type: common_values.service_type_jira,
        name:            'Assigned Issue To You w/ Description',
        content:         {
            icon_url:    '<%= icon_url %>',
            text:        '<%= user %> has assigned <%= issuetype %> <<%= issueurl %>|<%= issuekey %>> to you',
            attachments: [
                {
                    title: '<<%= issueurl %>|<%= summary %>>',
                    text:  '<%= description %>',
                    color: '<%= panel_color %>'
                }
            ]
        },
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
        event_types:     ['assigned']
    },

    /**
     * Jira 3: Comment Added #1
     */
    {
        service_type:    common_values.service_type_slack,
        in_service_type: common_values.service_type_jira,
        name:            'Comment Added #1',
        content:         {
            icon_url:    '<%= icon_url %>',
            text:        'New comment added to <%= issuetype %> <<%= issueurl %>|<%= issuekey %>> by <%= comment.name %>',
            attachments: [
                {
                    title: '<<%= issueurl %>|<%= summary %>>',
                    text:  '<%= comment.content %>',
                    color: '<%= panel_color %>'
                }
            ]
        },
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
        event_types:     ['comment_participated', 'comment', 'comment_reported']
    },

    /**
     * Jira 4: Comment Added #2
     */
    {
        service_type:    common_values.service_type_slack,
        in_service_type: common_values.service_type_jira,
        name:            'Comment Added #2',
        content:         {
            icon_url:    '<%= icon_url %>',
            text:        '<%= comment.name %> has comment an issue assigned to you',
            attachments: [
                {
                    title:  '<<%= issueurl %>|<%= issuekey %> - <%= summary %>>',
                    color:  '<%= panel_color %>',
                    fields: [
                        {
                            value: '<%= comment.content %>'
                        }
                    ]
                }
            ]
        },
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
        event_types:     ['comment']
    },

    /**
     * Jira 5: Comment Added on Reported
     */
    {
        service_type:    common_values.service_type_slack,
        in_service_type: common_values.service_type_jira,
        name:            'Comment Added on Reported',
        content:         {
            icon_url:    '<%= icon_url %>',
            text:        '<%= comment.name %> has commented on an issue you reported',
            attachments: [
                {
                    title:  '<<%= issueurl %>|<%= issuekey %> - <%= summary %>>',
                    color:  '<%= panel_color %>',
                    fields: [
                        {
                            value: '<%= comment.content %>'
                        }
                    ]
                }
            ]
        },
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
        event_types:     ['comment_reported']
    },

    /**
     * Jira 6: Logged Issue Minimal
     */
    {
        service_type:    common_values.service_type_slack,
        in_service_type: common_values.service_type_jira,
        name:            'Logged Issue Minimal',
        content:         {
            icon_url:    '<%= icon_url %>',
            text:        '<%= user %> has logged an issue',
            attachments: [
                {
                    title: '<<%= issueurl %>|<%= issuekey %> - <%= summary %>>',
                    color: '<%= panel_color %>'
                }
            ]
        },
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
        event_types:     ['logged_unassigned']
    },

    /**
     * Jira 7: Logged Issue w/ Description
     */
    {
        service_type:    common_values.service_type_slack,
        in_service_type: common_values.service_type_jira,
        name:            'Logged Issue w/ Description',
        content:         {
            icon_url:    '<%= icon_url %>',
            text:        '<%= user %> has logged <%= issuetype %> <<%= issueurl %>|<%= issuekey %>>',
            attachments: [
                {
                    title: '<<%= issueurl %>|<%= summary %>>',
                    text:  '<%= description %>',
                    color: '<%= panel_color %>'
                }
            ]
        },
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
        event_types:     ['logged_unassigned']
    },

    /**
     * Jira 8: Re-assigned Away From You Minimal
     */
    {
        service_type:    common_values.service_type_slack,
        in_service_type: common_values.service_type_jira,
        name:            'Re-assigned Away From You Minimal',
        content:         {
            icon_url:    '<%= icon_url %>',
            text:        '<%= user %> has re-assigned an issue away from you',
            attachments: [
                {
                    title: '<<%= issueurl %>|<%= issuekey %> - <%= summary %>>',
                    text:  'New Asignee: <%- assignee %>',
                    color: '<%= panel_color %>'
                }
            ]
        },
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
        event_types:     ['reassigned']
    },

    /**
     * Jira 9: Re-opened Unassigned Issue Minimal
     */
    {
        service_type:    common_values.service_type_slack,
        in_service_type: common_values.service_type_jira,
        name:            '',
        content:         {
            icon_url:    '<%= icon_url %>',
            text:        '<%= user %> has re-opened an Unassigned issue',
            attachments: [
                {
                    title: '<<%= issueurl %>|<%= issuekey %> - <%= summary %>>',
                    color: '<%= panel_color %>'
                }
            ]
        },
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
        event_types:     ['reopened_unassigned']
    },

    /**
     * Jira 10: Re-opened Your Issue Minimal
     */
    {
        service_type:    common_values.service_type_slack,
        in_service_type: common_values.service_type_jira,
        name:            'Re-opened Your Issue Minimal',
        content:         {
            icon_url:    '<%= icon_url %>',
            text:        '<%= user %> has re-opened an issue assigned to you',
            attachments: [
                {
                    title: '<<%= issueurl %>|<%= issuekey %> - <%= summary %>>',
                    color: '<%= panel_color %>'
                }
            ]
        },
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
        event_types:     ['reopened']
    },

    /**
     * Jira 11: Re-opened Your Issue w/ Description
     */
    {
        service_type:    common_values.service_type_slack,
        in_service_type: common_values.service_type_jira,
        name:            'Re-opened Your Issue w/ Description',
        content:         {
            icon_url:    '<%= icon_url %>',
            text:        '<%= user %> has re-opened <%= issuetype %> <<%= issueurl %>|<%= issuekey %>> assigned to you',
            attachments: [
                {
                    title: '<<%= issueurl %>|<%= summary %>>',
                    text:  '<%= description %>',
                    color: '<%= panel_color %>'
                }
            ]
        },
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
        event_types:     ['reopened']
    },

    /**
     * Jira 12: Re-opened Your Reported Issue Minimal
     */
    {
        service_type:    common_values.service_type_slack,
        in_service_type: common_values.service_type_jira,
        name:            'Re-opened Your Reported Issue Minimal',
        content:         {
            icon_url:    '<%= icon_url %>',
            text:        '<%= user %> has re-opened an issue you reported',
            attachments: [
                {
                    title: '<<%= issueurl %>|<%= issuekey %> - <%= summary %>>',
                    color: '<%= panel_color %>'
                }
            ]
        },
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
        event_types:     ['reopened_reported']
    },

    /**
     * Jira 13: Re-opened Your Reported Issue w/ Description
     */
    {
        service_type:    common_values.service_type_slack,
        in_service_type: common_values.service_type_jira,
        name:            'Re-opened Your Reported Issue w/ Description',
        content:         {
            icon_url:    '<%= icon_url %>',
            text:        '<%= user %> has re-opened <%= issuetype %> <<%= issueurl %>|<%= issuekey %>> you reported',
            attachments: [
                {
                    title: '<<%= issueurl %>|<%= summary %>>',
                    text:  '<%= description %>',
                    color: '<%= panel_color %>'
                }
            ]
        },
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
        event_types:     ['reopened_reported']
    },

    /**
     * Jira 14: Resolved Issue Generic Minimal
     */
    {
        service_type:    common_values.service_type_slack,
        in_service_type: common_values.service_type_jira,
        name:            'Resolved Issue Generic Minimal',
        content:         {
            icon_url:    '<%= icon_url %>',
            text:        '<%= user %> has resolved an issue as <%- resolution %>',
            attachments: [
                {
                    title: '<<%= issueurl %>|<%= issuekey %> - <%= summary %>>',
                    color: '<%= panel_color %>'
                }
            ]
        },
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
        event_types:     ['resolved_all', 'resolved_reported', 'resolved']
    },

    /**
     * Jira 15: Resolved Issue Generic w/ Description
     */
    {
        service_type:    common_values.service_type_slack,
        in_service_type: common_values.service_type_jira,
        name:            'Resolved Issue Generic w/ Description',
        content:         {
            icon_url:    '<%= icon_url %>',
            text:        '<%= user %> has resolved <%= issuetype %> <<%= issueurl %>|<%= issuekey %>> as <%- resolution %>',
            attachments: [
                {
                    title: '<<%= issueurl %>|<%= issuekey %> - <%= summary %>>',
                    text:  '<%= description %>',
                    color: '<%= panel_color %>'
                }
            ]
        },
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
        event_types:     ['resolved_reported', 'resolved_all', 'resolved']
    },

    /**
     * Jira 16: Resolved Reported Issue Minimal
     */
    {
        service_type:    common_values.service_type_slack,
        in_service_type: common_values.service_type_jira,
        name:            'Resolved Reported Issue Minimal',
        content:         {
            icon_url:    '<%= icon_url %>',
            text:        '<%= user %> has resolved an issue you reported as <%- resolution %>',
            attachments: [
                {
                    title: '<<%= issueurl %>|<%= issuekey %> - <%= summary %>>',
                    color: '<%= panel_color %>'
                }
            ]
        },
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
        event_types:     ['resolved_reported', 'resolved_all']
    },

    /**
     * Jira 17: Resolved Reported Issue w/ Assignee
     */
    {
        service_type:    common_values.service_type_slack,
        in_service_type: common_values.service_type_jira,
        name:            'Resolved Reported Issue w/ Assignee',
        content:         {
            icon_url:    '<%= icon_url %>',
            text:        '<%= user %> has resolved <%= issuetype %> <<%= issueurl %>|<%= issuekey %>> you reported',
            attachments: [
                {
                    title:  '<<%= issueurl %>|<%= issuekey %> - <%= summary %>>',
                    text:   '<%= description %>',
                    color:  '<%= panel_color %>',
                    fields: [
                        {
                            title: 'Assigned To',
                            value: '<%- assignee %>'
                        },
                        {
                            title: 'Resolution',
                            value: '<%- resolution %>'
                        }
                    ]
                }
            ]
        },
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
        event_types:     ['resolved_all', 'resolved_reported']
    },

    /**
     * Jira 18: Resolved Your Issue Minimal
     */
    {
        service_type:    common_values.service_type_slack,
        in_service_type: common_values.service_type_jira,
        name:            'Resolved Your Issue Minimal',
        content:         {
            icon_url:    '<%= icon_url %>',
            text:        '<%= user %> has resolved an issue assigned to you',
            attachments: [
                {
                    title: '<<%= issueurl %>|<%= issuekey %> - <%= summary %>>',
                    color: '<%= panel_color %>'
                }
            ]
        },
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
        event_types:     ['resolved']
    },

    /**
     * Jira 19: Resolved Your Issue w/ Description
     */
    {
        service_type:    common_values.service_type_slack,
        in_service_type: common_values.service_type_jira,
        name:            'Resolved Your Issue w/ Description',
        content:         {
            icon_url:    '<%= icon_url %>',
            text:        '<%= user %> has resolved <%= issuetype %> <<%= issueurl %>|<%= issuekey %>> assigned to you',
            attachments: [
                {
                    title: '<<%= issueurl %>|<%= issuekey %> - <%= summary %>>',
                    text:  '<%= description %>',
                    color: '<%= panel_color %>'
                }
            ]
        },
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
        event_types:     ['resolved']
    },

    /**
     * Jira 20: Updated Issue Generic Minimal
     */
    {
        service_type:    common_values.service_type_slack,
        in_service_type: common_values.service_type_jira,
        name:            'Updated Issue Generic Minimal',
        content:         {
            icon_url:    '<%= icon_url %>',
            text:        '<%= user %> has updated an issue',
            attachments: [
                {
                    title: '<<%= issueurl %>|<%= issuekey %> - <%= summary %>>',
                    color: '<%= panel_color %>'
                }
            ]
        },
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
        event_types:     ['updated_participated', 'updated', 'updated_reported']
    },

    /**
     * Jira 21: Updated Issue Generic w/ Description
     */
    {
        service_type:    common_values.service_type_slack,
        in_service_type: common_values.service_type_jira,
        name:            'Updated Issue Generic w/ Description',
        content:         {
            icon_url:    '<%= icon_url %>',
            text:        '<%= user %> has updated <%= issuetype %> <<%= issueurl %>|<%= issuekey %>>',
            attachments: [
                {
                    title: '<<%= issueurl %>|<%= summary %>>',
                    text:  '<%= description %>',
                    color: '<%= panel_color %>'
                }
            ]
        },
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
        event_types:     ['updated_participated', 'updated_reported', 'updated']
    },

    /**
     * Jira 22: Updated Issue Generic w/ Fields
     */
    {
        service_type:    common_values.service_type_slack,
        in_service_type: common_values.service_type_jira,
        name:            'Updated Issue Generic w/ Fields',
        content:         {
            icon_url:    '<%= icon_url %>',
            text:        '<%= user %> has updated <%= issuetype %> <<%= issueurl %>|<%= issuekey %>>',
            attachments: [
                {
                    title:  '<<%= issueurl %>|<%= summary %>>',
                    text:   '<%= description %>',
                    color:  '<%= panel_color %>',
                    fields: [
                        {
                            title: 'Updated Fields',
                            value: '<%- fields %>'
                        }
                    ]
                }
            ]
        },
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
        event_types:     ['updated_reported', 'updated_participated', 'updated']
    },

    /**
     * Jira 23: Updated Reported Issue Minimal
     */
    {
        service_type:    common_values.service_type_slack,
        in_service_type: common_values.service_type_jira,
        name:            'Updated Reported Issue Minimal',
        content:         {
            icon_url:    '<%= icon_url %>',
            text:        '<%= user %> has updated an issue you reported',
            attachments: [
                {
                    title: '<<%= issueurl %>|<%= issuekey %> - <%= summary %>>',
                    color: '<%= panel_color %>'
                }
            ]
        },
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
        event_types:     ['updated_reported']
    },

    /**
     * Jira 24: Updated Reported Issue w/ Fields
     */
    {
        service_type:    common_values.service_type_slack,
        in_service_type: common_values.service_type_jira,
        name:            'Updated Reported Issue w/ Fields',
        content:         {
            icon_url:    '<%= icon_url %>',
            text:        '<%= user %> has updated <%= issuetype %> <<%= issueurl %>|<%= issuekey %>> you reported',
            attachments: [
                {
                    title:  '<<%= issueurl %>|<%= issuekey %> - <%= summary %>>',
                    color:  '<%= panel_color %>',
                    fields: [
                        {
                            title: 'Updated Fields',
                            value: '<%- fields %>',
                            short: true
                        },
                        {
                            title: 'Assigned To',
                            value: '<%- assignee %>',
                            short: true
                        }
                    ]
                }
            ]
        },
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
        event_types:     ['updated_reported']
    },

    /**
     * Jira 25: Updated Your Issue Minimal
     */
    {
        service_type:    common_values.service_type_slack,
        in_service_type: common_values.service_type_jira,
        name:            'Updated Your Issue Minimal',
        content:         {
            icon_url:    '<%= icon_url %>',
            text:        '<%= user %> has updated an issue assigned to you',
            attachments: [
                {
                    title: '<<%= issueurl %>|<%= issuekey %> - <%= summary %>>',
                    color: '<%= panel_color %>'
                }
            ]
        },
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
        event_types:     ['updates']
    },

    /**
     * Jira 26: Updated Your Issue w/ Description
     */
    {
        service_type:    common_values.service_type_slack,
        in_service_type: common_values.service_type_jira,
        name:            'Updated Your Issue w/ Description',
        content:         {
            icon_url:    '<%= icon_url %>',
            text:        '<%= user %> has updated <%= issuetype %> <<%= issueurl %>|<%= issuekey %>> assigned to you',
            attachments: [
                {
                    title: '<<%= issueurl %>|<%= summary %>>',
                    text:  '<%= description %>',
                    color: '<%= panel_color %>'
                }
            ]
        },
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
        event_types:     ['updated']
    },

    /**
     * Jira 27: Updated Your Issue w/ Fields
     */
    {
        service_type:    common_values.service_type_slack,
        in_service_type: common_values.service_type_jira,
        name:            'Updated Your Issue w/ Fields',
        content:         {
            icon_url:    '<%= icon_url %>',
            text:        '<%= user %> has updated <%= issuetype %> <<%= issueurl %>|<%= issuekey %>> assigned to you',
            attachments: [
                {
                    title:  '<<%= issueurl %>|<%= summary %>>',
                    text:   '<%= description %>',
                    color:  '<%= panel_color %>',
                    fields: [
                        {
                            title: 'Updated Fields',
                            value: '<%- fields %>'
                        }
                    ]
                }
            ]
        },
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
        event_types:     ['updated']
    },

    /**
     * Bitbucket 1: PR Opened
     */
    {
        service_type:    common_values.service_type_slack,
        in_service_type: common_values.service_type_jira,
        name:            'PR Opened',
        content:         {
            icon_url:    '<%= icon_url %>',
            text:        '<%= user %> has opened a PR',
            attachments: [
                {
                    title: '<<%= prurl %>|<%= title %>>',
                    text:  '<%- description %>',
                    color: '<%= panel_color %>'
                }
            ]
        },
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
        event_types:     ['pr_review_requested', 'pr_opened']
    },

    /**
     * Bitbucket 2: Your PR was Approved
     */
    {
        service_type:    common_values.service_type_slack,
        in_service_type: common_values.service_type_jira,
        name:            'Your PR was Approved',
        content:         {
            icon_url:    '<%= icon_url %>',
            text:        '<%= user %> has approved your PR',
            attachments: [
                {
                    title: '<<%= prurl %>|<%= title %>>',
                    text:  '<%- description %>',
                    color: '<%= panel_color %>'
                }
            ]
        },
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
        event_types:     ['my_pr_approved']
    },

    /**
     * Bitbucket 3: Your PR Needs Work
     */
    {
        service_type:    common_values.service_type_slack,
        in_service_type: common_values.service_type_jira,
        name:            'Your PR Needs Work',
        content:         {
            icon_url:    '<%= icon_url %>',
            text:        '<%= user %> has reviewed your PR as Needs Work',
            attachments: [
                {
                    title: '<<%= prurl %>|<%= title %>>',
                    text:  '<%- description %>',
                    color: '<%= panel_color %>'
                }
            ]
        },
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
        event_types:     ['my_pr_needs_work']
    },

    /**
     * Bitbucket 4: PR Merged
     */
    {
        service_type:    common_values.service_type_slack,
        in_service_type: common_values.service_type_jira,
        name:            'PR Merged',
        content:         {
            icon_url:    '<%= icon_url %>',
            text:        '<%= user %> has merged a PR',
            attachments: [
                {
                    title: '<<%= prurl %>|<%= title %>>',
                    text:  '<%- description %>',
                    color: '<%= panel_color %>'
                }
            ]
        },
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
        event_types:     ['my_pr_merged', 'pr_merged']
    },

    /**
     * Bitbucket 4: Your PR was Declined
     */
    {
        service_type:    common_values.service_type_slack,
        in_service_type: common_values.service_type_jira,
        name:            'Your PR was Declined',
        content:         {
            icon_url:    '<%= icon_url %>',
            text:        '<%= user %> has declined your PR',
            attachments: [
                {
                    title: '<<%= prurl %>|<%= title %>>',
                    text:  '<%- description %>',
                    color: '<%= panel_color %>'
                }
            ]
        },
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
        event_types:     ['my_pr_declined']
    },

    /**
     * Bitbucket 4: Your PR was Deleted
     */
    {
        service_type:    common_values.service_type_slack,
        in_service_type: common_values.service_type_jira,
        name:            'Your PR was Deleted',
        content:         {
            icon_url:    '<%= icon_url %>',
            text:        '<%= user %> has deleted your PR',
            attachments: [
                {
                    title: '<<%= prurl %>|<%= title %>>',
                    text:  '<%- description %>',
                    color: '<%= panel_color %>'
                }
            ]
        },
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
        event_types:     ['my_pr_deleted']
    },

    /**
     * Bitbucket 5: Commented on your PR
     */
    {
        service_type:    common_values.service_type_slack,
        in_service_type: common_values.service_type_jira,
        name:            'Commented on your PR',
        content:         {
            icon_url:    '<%= icon_url %>',
            text:        '<%= user %> has commented on your PR',
            attachments: [
                {
                    title: '<<%= prurl %>|<%= title %>>',
                    text:  '<%- description %>',
                    color: '<%= panel_color %>'
                }
            ]
        },
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
        event_types:     ['my_pr_comment']
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
    let access = new Access(null);

    return access.load(true)
        .then(() => {
            return new Promise((resolve, reject) => {
                batchflow(templates).sequential()
                    .each((i, template_data, next) => {
                        logger.migrate('[' + migrate_name + '] Creating Template: ' + template_data.in_service_type + ' -> ' + template_data.service_type + ' -> ' + template_data.name);

                        internalTemplate.create(access, template_data)
                            .then(next)
                            .catch(err => {
                                logger.error('[' + migrate_name + '] ' + err.message);
                                throw err;
                            });
                    })
                    .error(err => {
                        reject(err);
                    })
                    .end(results => {
                        resolve(true);
                    });
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
