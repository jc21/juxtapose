'use strict';

const migrate_name     = 'jabber_templates';
const logger           = require('../logger');
const batchflow        = require('batchflow');
const internalTemplate = require('../internal/template');

const common_values = {
    service_type_jabber:    'jabber',
    service_type_zendesk:   'zendesk-webhook',
    service_type_jira:      'jira-webhook',
    service_type_bitbucket: 'bitbucket-webhook',
    service_type_dockerhub: 'dockerhub-webhook'
};

/**
 * Zendesk Templates
 *
 * @type {Array}
 */
const templates = [

    /**
     * Jira 1: Assigned Issue To You Minimal
     */
    {
        service_type:    common_values.service_type_jabber,
        in_service_type: common_values.service_type_jira,
        name:            'Assigned Issue To You Minimal',
        content:         '{{ user }} has assigned {{ issuekey }} to you' + "\n" + '{{ issueurl }}',
        default_options: {},
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
     * Jira 3: Comment Added #1
     */
    {
        service_type:    common_values.service_type_jabber,
        in_service_type: common_values.service_type_jira,
        name:            'Comment Added #1',
        content:         'New comment added to {{ issuetype }} {{ issuekey }} by {{ comment.name }}' + "\n" + '{{ issueurl }}',
        default_options: {},
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
        service_type:    common_values.service_type_jabber,
        in_service_type: common_values.service_type_jira,
        name:            'Comment Added #2',
        content:         '{{ comment.name }} has comment an issue assigned to you' + "\n" + '{{ issueurl }}',
        default_options: {},
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
        service_type:    common_values.service_type_jabber,
        in_service_type: common_values.service_type_jira,
        name:            'Comment Added on Reported',
        content:         '{{ comment.name }} has commented on an issue you reported' + "\n" + '{{ issueurl }}',
        default_options: {},
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
        service_type:    common_values.service_type_jabber,
        in_service_type: common_values.service_type_jira,
        name:            'Logged Issue Minimal',
        content:         '{{ user }} has logged an issue' + "\n" + '{{ issueurl }}',
        default_options: {},
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
        service_type:    common_values.service_type_jabber,
        in_service_type: common_values.service_type_jira,
        name:            'Logged Issue w/ Description',
        content:         '{{ user }} has logged {{ issuetype }} {{ issuekey }}' + "\n" + '{{ issueurl }}',
        default_options: {},
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
        service_type:    common_values.service_type_jabber,
        in_service_type: common_values.service_type_jira,
        name:            'Re-assigned Away From You Minimal',
        content:         '{{ user }} has re-assigned an issue away from you' + "\n" + '{{ issueurl }}',
        default_options: {},
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
        service_type:    common_values.service_type_jabber,
        in_service_type: common_values.service_type_jira,
        name:            'Re-opened Unassigned',
        content:         '{{ user }} has re-opened an Unassigned issue' + "\n" + '{{ issueurl }}',
        default_options: {},
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
        service_type:    common_values.service_type_jabber,
        in_service_type: common_values.service_type_jira,
        name:            'Re-opened Your Issue Minimal',
        content:         '{{ user }} has re-opened an issue assigned to you' + "\n" + '{{ issueurl }}',
        default_options: {},
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
        service_type:    common_values.service_type_jabber,
        in_service_type: common_values.service_type_jira,
        name:            'Re-opened Your Issue w/ Description',
        content:         '{{ user }} has re-opened {{ issuetype }} <{{ issueurl }}|{{ issuekey }}> assigned to you' + "\n" + '{{ issueurl }}',
        default_options: {},
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
        service_type:    common_values.service_type_jabber,
        in_service_type: common_values.service_type_jira,
        name:            'Re-opened Your Reported Issue Minimal',
        content:         '{{ user }} has re-opened an issue you reported' + "\n" + '{{ issueurl }}',
        default_options: {},
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
        service_type:    common_values.service_type_jabber,
        in_service_type: common_values.service_type_jira,
        name:            'Re-opened Your Reported Issue w/ Description',
        content:         '{{ user }} has re-opened {{ issuetype }} {{ issuekey }} you reported' + "\n" + '{{ issueurl }}',
        default_options: {},
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
        service_type:    common_values.service_type_jabber,
        in_service_type: common_values.service_type_jira,
        name:            'Resolved Issue Generic Minimal',
        content:         '{{ user }} has resolved an issue as {{ resolution }}' + "\n" + '{{ issueurl }}',
        default_options: {},
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
        service_type:    common_values.service_type_jabber,
        in_service_type: common_values.service_type_jira,
        name:            'Resolved Issue Generic w/ Description',
        content:         '{{ user }} has resolved {{ issuetype }} {{ issuekey }} as {{ resolution }}' + "\n" + '{{ issueurl }}',
        default_options: {},
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
        service_type:    common_values.service_type_jabber,
        in_service_type: common_values.service_type_jira,
        name:            'Resolved Reported Issue Minimal',
        content:         '{{ user }} has resolved an issue you reported as {{ resolution }}' + "\n" + '{{ issueurl }}',
        default_options: {},
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
     * Jira 18: Resolved Your Issue Minimal
     */
    {
        service_type:    common_values.service_type_jabber,
        in_service_type: common_values.service_type_jira,
        name:            'Resolved Your Issue Minimal',
        content:         '{{ user }} has resolved an issue assigned to you' + "\n" + '{{ issueurl }}',
        default_options: {},
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
     * Jira 19: Resolved Your Issue w/ Type
     */
    {
        service_type:    common_values.service_type_jabber,
        in_service_type: common_values.service_type_jira,
        name:            'Resolved Your Issue w/ Type',
        content:         '{{ user }} has resolved {{ issuetype }} {{ issuekey }} assigned to you' + "\n" + '{{ issueurl }}',
        default_options: {},
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
        service_type:    common_values.service_type_jabber,
        in_service_type: common_values.service_type_jira,
        name:            'Updated Issue Generic Minimal',
        content:         '{{ user }} has updated an issue' + "\n" + '{{ issueurl }}',
        default_options: {},
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
        service_type:    common_values.service_type_jabber,
        in_service_type: common_values.service_type_jira,
        name:            'Updated Issue Generic w/ Type',
        content:         '{{ user }} has updated {{ issuetype }} {{ issuekey }}' + "\n" + '{{ issueurl }}',
        default_options: {},
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
     * Jira 23: Updated Reported Issue Minimal
     */
    {
        service_type:    common_values.service_type_jabber,
        in_service_type: common_values.service_type_jira,
        name:            'Updated Reported Issue Minimal',
        content:         '{{ user }} has updated an issue you reported' + "\n" + '{{ issueurl }}',
        default_options: {},
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
     * Jira 25: Updated Your Issue Minimal
     */
    {
        service_type:    common_values.service_type_jabber,
        in_service_type: common_values.service_type_jira,
        name:            'Updated Your Issue Minimal',
        content:         '{{ user }} has updated an issue assigned to you' + "\n" + '{{ issueurl }}',
        default_options: {},
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
        service_type:    common_values.service_type_jabber,
        in_service_type: common_values.service_type_jira,
        name:            'Updated Your Issue w/ Type',
        content:         '{{ user }} has updated {{ issuetype }} <{{ issueurl }}|{{ issuekey }}> assigned to you' + "\n" + '{{ issueurl }}',
        default_options: {},
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
     * Bitbucket 1: PR Opened
     */
    {
        service_type:    common_values.service_type_jabber,
        in_service_type: common_values.service_type_bitbucket,
        name:            'PR Opened',
        content:         '{{ user }} has opened a PR' + "\n" + '{{ prurl }}',
        default_options: {},
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
        service_type:    common_values.service_type_jabber,
        in_service_type: common_values.service_type_bitbucket,
        name:            'Your PR was Approved',
        content:         '{{ user }} has approved your PR' + "\n" + '{{ prurl }}',
        default_options: {},
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
        service_type:    common_values.service_type_jabber,
        in_service_type: common_values.service_type_bitbucket,
        name:            'Your PR Needs Work',
        content:         '{{ user }} has reviewed your PR as Needs Work' + "\n" + '{{ prurl }}',
        default_options: {},
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
        service_type:    common_values.service_type_jabber,
        in_service_type: common_values.service_type_bitbucket,
        name:            'PR Merged',
        content:         '{{ user }} has merged a PR' + "\n" + '{{ prurl }}',
        default_options: {},
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
        service_type:    common_values.service_type_jabber,
        in_service_type: common_values.service_type_bitbucket,
        name:            'Your PR was Declined',
        content:         '{{ user }} has declined your PR' + "\n" + '{{ prurl }}',
        default_options: {},
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
        service_type:    common_values.service_type_jabber,
        in_service_type: common_values.service_type_bitbucket,
        name:            'Your PR was Deleted',
        content:         '{{ user }} has deleted your PR' + "\n" + '{{ prurl }}',
        default_options: {},
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
        service_type:    common_values.service_type_jabber,
        in_service_type: common_values.service_type_bitbucket,
        name:            'Commented on your PR',
        content:         '{{ user }} has commented on your PR' + "\n" + '{{ prurl }}',
        default_options: {},
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
        service_type:    common_values.service_type_jabber,
        in_service_type: common_values.service_type_bitbucket,
        name:            'Your PR was Merged',
        content:         '{{ user }} has merged your PR' + "\n" + '{{ prurl }}',
        default_options: {},
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
        service_type:    common_values.service_type_jabber,
        in_service_type: common_values.service_type_dockerhub,
        name:            'Repo Updated',
        content:         'Docker Repository {{ repo }} updated by {{ pusher }}' + "\n" + '{{ url }}',
        default_options: {},
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
    },

    /**
     * Zendesk 1: A Ticket is assigned to you
     */
    {
        service_type:    common_values.service_type_jabber,
        in_service_type: common_values.service_type_zendesk,
        name:            'A Ticket is assigned to you',
        content:         'Ticket #{{ ticket.id }} has been assigned to you{% if current_user %} by {{ current_user.name }}{% endif %}' + '\n' + '{{ ticket.link }}',
        default_options: {},
        example_data:    {
            ticket:       {
                id:        57506,
                title:     'Billy Bob has submitted a website enquiry',
                link:      'https://example.zendesk.com/agent/tickets/57506',
                status:    'Pending',
                priority:  'Normal',
                requester: {
                    email: 'billybob@example.com',
                    name:  'Billy Bob'
                }
            },
            current_user: {
                name: 'Joe Citizen'
            }
        },
        event_types:     ['my_ticket_assigned'],
        render_engine:   'liquid'
    },

    /**
     * Zendesk 2: A Ticket assigned to you is updated
     */
    {
        service_type:    common_values.service_type_jabber,
        in_service_type: common_values.service_type_zendesk,
        name:            'A Ticket assigned to you is updated',
        content:         'Ticket #{{ ticket.id }} assigned to you has been updated by {{ current_user.name }}' + '\n' + '{{ ticket.link }}',
        default_options: {},
        example_data:    {
            ticket:       {
                id:        57506,
                title:     'Billy Bob has submitted a website enquiry',
                link:      'https://example.zendesk.com/agent/tickets/57506',
                priority:  'Urgent',
                status:    'Pending',
                requester: {
                    email: 'billybob@example.com',
                    name:  'Billy Bob'
                }
            },
            current_user: {
                name: 'Joe Citizen'
            }
        },
        event_types:     ['my_ticket_updated'],
        render_engine:   'liquid'
    },

    /**
     * Zendesk 3: A Ticket assigned to you is re-assigned
     */
    {
        service_type:    common_values.service_type_jabber,
        in_service_type: common_values.service_type_zendesk,
        name:            'A Ticket assigned to you is re-assigned',
        content:         'Ticket #{{ ticket.id }} has been ra-assigned away from you by {{ current_user.name }}' + '\n' + '{{ ticket.link }}',
        default_options: {},
        example_data:    {
            ticket:       {
                id:        57506,
                title:     'Billy Bob has submitted a website enquiry',
                link:      'https://example.zendesk.com/agent/tickets/57506',
                status:    'Pending',
                requester: {
                    email: 'billybob@example.com',
                    name:  'Billy Bob'
                },
                assignee:  {
                    name: 'Johnny Goodguy'
                }
            },
            current_user: {
                name: 'Joe Citizen'
            }
        },
        event_types:     ['my_ticket_reassigned'],
        render_engine:   'liquid'
    },

    /**
     * Zendesk 4: A comments is made on on your Ticket
     */
    {
        service_type:    common_values.service_type_jabber,
        in_service_type: common_values.service_type_zendesk,
        name:            'A comments is made on on your Ticket',
        content:         'A comment has been added to Ticket #{{ ticket.id }}' + '\n' + '{{ ticket.link }}',
        default_options: {},
        example_data:    {
            ticket: {
                id:             57506,
                title:          'Billy Bob has submitted a website enquiry',
                link:           'https://example.zendesk.com/agent/tickets/57506',
                requester:      {
                    email: 'billybob@example.com',
                    name:  'Billy Bob'
                },
                latest_comment: {
                    author_name: 'Johnny Goodguy',
                    is_public:   false,
                    value:       'Whatever mate'
                }
            }
        },
        event_types:     ['my_ticket_commented'],
        render_engine:   'liquid'
    },

    /**
     * Zendesk 5: A rating is made on your Ticket
     */
    {
        service_type:    common_values.service_type_jabber,
        in_service_type: common_values.service_type_zendesk,
        name:            'A rating is made on your Ticket',
        content:         'Your Ticket #{{ ticket.id }} has been rated' + '\n' + '{{ satisfaction.current_rating | unescape }}' + '\n' + '{{ ticket.link }}',
        default_options: {},
        example_data:    {
            ticket:       {
                id:        57506,
                title:     'Billy Bob has submitted a website enquiry',
                link:      'https://example.zendesk.com/agent/tickets/57506',
                requester: {
                    email: 'billybob@example.com',
                    name:  'Billy Bob'
                }
            },
            satisfaction: {
                current_rating:  '&quot;Good, I&#39;m satisfied&quot;',
                current_comment: 'Always fun dealing with this guy'
            }
        },
        event_types:     ['my_ticket_rated'],
        render_engine:   'liquid'
    },

    /**
     * Zendesk 6: Any Ticket is logged without an Assignee
     */
    {
        service_type:    common_values.service_type_jabber,
        in_service_type: common_values.service_type_zendesk,
        name:            'Any Ticket is logged without an Assignee',
        content:         'Ticket #{{ ticket.id }} has been logged' + '\n' + '{{ ticket.link }}',
        default_options: {},
        example_data:    {
            ticket: {
                id:         57506,
                title:      'Billy Bob has submitted a website enquiry',
                link:       'https://example.zendesk.com/agent/tickets/57506',
                via:        'Mail',
                group_name: 'Accounts',
                requester:  {
                    email: 'billybob@example.com',
                    name:  'Billy Bob'
                }
            }
        },
        event_types:     ['ticket_logged'],
        render_engine:   'liquid'
    },

    /**
     * Zendesk 7: Any Ticket is rated
     */
    {
        service_type:    common_values.service_type_jabber,
        in_service_type: common_values.service_type_zendesk,
        name:            'Any Ticket is rated',
        content:         'Ticket #{{ ticket.id }} has been rated' + '\n' + '{{ satisfaction.current_rating | unescape }}' + '\n' + '{{ ticket.link }}',
        default_options: {},
        example_data:    {
            ticket:       {
                id:        57506,
                title:     'Billy Bob has submitted a website enquiry',
                link:      'https://example.zendesk.com/agent/tickets/57506',
                requester: {
                    email: 'billybob@example.com',
                    name:  'Billy Bob'
                },
                assignee:  {
                    name: 'Joe Citizen'
                }
            },
            satisfaction: {
                current_rating:  5,
                current_comment: 'Always fun dealing with this guy'
            }
        },
        event_types:     ['ticket_rated'],
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
