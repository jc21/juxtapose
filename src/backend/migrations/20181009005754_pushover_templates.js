'use strict';

const migrate_name     = 'pushover_templates';
const logger           = require('../logger').migrate;
const batchflow        = require('batchflow');
const internalTemplate = require('../internal/template');

const common_values = {
    service_type_pushover:  'pushover',
    service_type_jira:      'jira-webhook',
    service_type_jenkins:   'jenkins-webhook',
    service_type_dockerhub: 'dockerhub-webhook',
    service_type_zendesk:   'zendesk-webhook',
    service_type_bitbucket: 'bitbucket-webhook',
    pushover_defaults:      {
        priority: 'normal',
        sound:    'default'
    },
    jenkins_example_data:   {
        project:   {
            url:          'https://ci.example.com/job/Docker/job/docker-node/job/master/',
            name:         'master',
            full_name:    'Docker/docker-node/master',
            display_name: 'master'
        },
        build:     {
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
        },
        timestamp: 1526602255
    },
    jira_example_data:      {
        summary:       'Enable Feature x for Customer y',
        issuekey:      'FEAT-1234',
        issueurl:      'http://example.com',
        issuetype:     'Task',
        issuestatus:   'In Progress',
        priority:      'Neutral',
        reporter:      'Joe Citizen',
        user:          'Billy Bob',
        user_gravatar: 'https://public.jc21.com/juxtapose/icons/jira.png',
        project:       'Web Application',
        resolution:    'Unresolved',
        assignee:      'Joe Citizen',
        description:   'At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et.',
        timestamp:     1526602255
    },
    zendesk_example_data:   {}
};

/**
 * Jira Templates
 *
 * @type {Array}
 */
const templates = [
    /**
     * Jira: Assigned Issue To You
     */
    {
        service_type:    common_values.service_type_pushover,
        in_service_type: common_values.service_type_jira,
        name:            'Assigned Issue To You',
        content:         '{\n' +
                             '  "title": "{{ issuekey }}: {{ summary }}",\n' +
                             '  "message": "{{ user }} has assigned to you",\n' +
                             '  "url": "{{ issueurl }}",\n' +
                             '  "url_title": "View Issue",\n' +
                             '  "timestamp": {{ timestamp }}\n' +
                             '}',
        default_options: common_values.pushover_defaults,
        example_data:    common_values.jira_example_data,
        event_types:     ['assigned'],
        render_engine:   'liquid'
    },

    /**
     * Jira: Updated Issue
     */
    {
        service_type:    common_values.service_type_pushover,
        in_service_type: common_values.service_type_jira,
        name:            'Updated Issue',
        content:         '{\n' +
                             '  "title": "{{ issuekey }}: {{ summary }}",\n' +
                             '  "message": "Updated by {{ user }}",\n' +
                             '  "url": "{{ issueurl }}",\n' +
                             '  "url_title": "View Issue",\n' +
                             '  "timestamp": {{ timestamp }}\n' +
                             '}',
        default_options: common_values.pushover_defaults,
        example_data:    common_values.jira_example_data,
        event_types:     ['updated', 'updated_reported', 'updated_participated'],
        render_engine:   'liquid'
    },

    /**
     * Jira: Re-opened Issue
     */
    {
        service_type:    common_values.service_type_pushover,
        in_service_type: common_values.service_type_jira,
        name:            'Re-opened Issue',
        content:         '{\n' +
                             '  "title": "{{ issuekey }}: {{ summary }}",\n' +
                             '  "message": "Reopened by {{ user }}",\n' +
                             '  "url": "{{ issueurl }}",\n' +
                             '  "url_title": "View Issue",\n' +
                             '  "timestamp": {{ timestamp }}\n' +
                             '}',
        default_options: common_values.pushover_defaults,
        example_data:    common_values.jira_example_data,
        event_types:     ['reopened_reported', 'reopened_unassigned', 'reopened'],
        render_engine:   'liquid'
    },

    /**
     * Jira: Comment Added
     */
    {
        service_type:    common_values.service_type_pushover,
        in_service_type: common_values.service_type_jira,
        name:            'Comment Added',
        content:         '{\n' +
                             '  "title": "{{ issuekey }}: {{ summary }}",\n' +
                             '  "message": "Comment by {{ user }}",\n' +
                             '  "url": "{{ issueurl }}",\n' +
                             '  "url_title": "View Issue",\n' +
                             '  "timestamp": {{ timestamp }}\n' +
                             '}',
        default_options: common_values.pushover_defaults,
        example_data:    {
            summary:       'Enable Feature x for Customer y',
            issuekey:      'FEAT-1234',
            issueurl:      'http://example.com',
            issuetype:     'Task',
            issuestatus:   'In Progress',
            priority:      'Neutral',
            reporter:      'Joe Citizen',
            user:          'Billy Bob',
            user_gravatar: 'https://public.jc21.com/juxtapose/icons/jira.png',
            project:       'Web Application',
            resolution:    'Unresolved',
            assignee:      'Joe Citizen',
            description:   'At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et.',
            comment:       {
                name:    'Billy Bob',
                content: 'At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et.'
            },
            timestamp: 1526602255
        },
        event_types:     ['comment_participated', 'comment_reported', 'comment'],
        render_engine:   'liquid'
    },

    /**
     * Jira: Resolved Issue
     */
    {
        service_type:    common_values.service_type_pushover,
        in_service_type: common_values.service_type_jira,
        name:            'Resolved Issue',
        content:         '{\n' +
                             '  "title": "{{ issuekey }}: {{ summary }}",\n' +
                             '  "message": "Resolved by {{ user }}",\n' +
                             '  "url": "{{ issueurl }}",\n' +
                             '  "url_title": "View Issue",\n' +
                             '  "timestamp": {{ timestamp }}\n' +
                             '}',
        default_options: common_values.pushover_defaults,
        example_data:    common_values.jira_example_data,
        event_types:     ['resolved', 'resolved_all', 'resolved_reported'],
        render_engine:   'liquid'
    },

    /**
     * Jira: Re-assigned Away From You
     */
    {
        service_type:    common_values.service_type_pushover,
        in_service_type: common_values.service_type_jira,
        name:            'Re-assigned Away From You',
        content:         '{\n' +
                             '  "title": "{{ issuekey }}: {{ summary }}",\n' +
                             '  "message": "Reassigned away from you by {{ user }}",\n' +
                             '  "url": "{{ issueurl }}",\n' +
                             '  "url_title": "View Issue",\n' +
                             '  "timestamp": {{ timestamp }}\n' +
                             '}',
        default_options: common_values.pushover_defaults,
        example_data:    common_values.jira_example_data,
        event_types:     ['reassigned'],
        render_engine:   'liquid'
    },

    /**
     * Jira: Logged Issue
     */
    {
        service_type:    common_values.service_type_pushover,
        in_service_type: common_values.service_type_jira,
        name:            'Logged Issue',
        content:         '{\n' +
                             '  "title": "{{ issuekey }}: {{ summary }}",\n' +
                             '  "message": "Logged by {{ user }}",\n' +
                             '  "url": "{{ issueurl }}",\n' +
                             '  "url_title": "View Issue",\n' +
                             '  "timestamp": {{ timestamp }}\n' +
                             '}',
        default_options: common_values.pushover_defaults,
        example_data:    common_values.jira_example_data,
        event_types:     ['logged_unassigned'],
        render_engine:   'liquid'
    },

    /**
     * Jenkins: Build Success
     */
    {
        service_type:    common_values.service_type_pushover,
        in_service_type: common_values.service_type_jenkins,
        name:            'Build Success',
        content:         '{\n' +
                             '  "title": "{{ project.full_name }} #{{ build.number }}",\n' +
                             '  "message": "SUCCESS",\n' +
                             '  "url": "{{ project.url }}/{{ build.number }}/ }}",\n' +
                             '  "url_title": "View Build",\n' +
                             '  "timestamp": {{ timestamp }}\n' +
                             '}',
        default_options: common_values.pushover_defaults,
        example_data:    common_values.jenkins_example_data,
        event_types:     ['build_success'],
        render_engine:   'liquid'
    },

    /**
     * Jenkins: Build Failure
     */
    {
        service_type:    common_values.service_type_pushover,
        in_service_type: common_values.service_type_jenkins,
        name:            'Build Failure',
        content:         '{\n' +
                             '  "title": "{{ project.full_name }} #{{ build.number }}",\n' +
                             '  "message": "FAILURE",\n' +
                             '  "url": "{{ project.url }}/{{ build.number }}/ }}",\n' +
                             '  "url_title": "View Build",\n' +
                             '  "timestamp": {{ timestamp }}\n' +
                             '}',
        default_options: common_values.pushover_defaults,
        example_data:    common_values.jenkins_example_data,
        event_types:     ['build_failure'],
        render_engine:   'liquid'
    },

    /**
     * Jenkins: Build Aborted Minimal
     */
    {
        service_type:    common_values.service_type_pushover,
        in_service_type: common_values.service_type_jenkins,
        name:            'Build Aborted',
        content:         '{\n' +
                             '  "title": "{{ project.full_name }} #{{ build.number }}",\n' +
                             '  "message": "ABORTED",\n' +
                             '  "url": "{{ project.url }}/{{ build.number }}/ }}",\n' +
                             '  "url_title": "View Build",\n' +
                             '  "timestamp": {{ timestamp }}\n' +
                             '}',
        default_options: common_values.pushover_defaults,
        example_data:    common_values.jenkins_example_data,
        event_types:     ['build_aborted'],
        render_engine:   'liquid'
    },

    /**
     * Jenkins: Build Unstable
     */
    {
        service_type:    common_values.service_type_pushover,
        in_service_type: common_values.service_type_jenkins,
        name:            'Build Unstable',
        content:         '{\n' +
                             '  "title": "{{ project.full_name }} #{{ build.number }}",\n' +
                             '  "message": "UNSTABLE",\n' +
                             '  "url": "{{ project.url }}/{{ build.number }}/ }}",\n' +
                             '  "url_title": "View Build",\n' +
                             '  "timestamp": {{ timestamp }}\n' +
                             '}',
        default_options: common_values.pushover_defaults,
        example_data:    common_values.jenkins_example_data,
        event_types:     ['build_unstable'],
        render_engine:   'liquid'
    },

    /**
     * Jenkins: Build Regressed
     */
    {
        service_type:    common_values.service_type_pushover,
        in_service_type: common_values.service_type_jenkins,
        name:            'Build Regressed',
        content:         '{\n' +
                             '  "title": "{{ project.full_name }} #{{ build.number }}",\n' +
                             '  "message": "REGRESSED",\n' +
                             '  "url": "{{ project.url }}/{{ build.number }}/ }}",\n' +
                             '  "url_title": "View Build",\n' +
                             '  "timestamp": {{ timestamp }}\n' +
                             '}',
        default_options: common_values.pushover_defaults,
        example_data:    common_values.jenkins_example_data,
        event_types:     ['build_regression'],
        render_engine:   'liquid'
    },

    /**
     * Jenkins: Build Changed
     */
    {
        service_type:    common_values.service_type_pushover,
        in_service_type: common_values.service_type_jenkins,
        name:            'Build Changed',
        content:         '{\n' +
                             '  "title": "{{ project.full_name }} #{{ build.number }}",\n' +
                             '  "message": "CHANGED",\n' +
                             '  "url": "{{ project.url }}/{{ build.number }}/ }}",\n' +
                             '  "url_title": "View Build",\n' +
                             '  "timestamp": {{ timestamp }}\n' +
                             '}',
        default_options: common_values.pushover_defaults,
        example_data:    common_values.jenkins_example_data,
        event_types:     ['build_changed'],
        render_engine:   'liquid'
    },

    /**
     * Jenkins: Build Fixed
     */
    {
        service_type:    common_values.service_type_pushover,
        in_service_type: common_values.service_type_jenkins,
        name:            'Build Fixed',
        content:         '{\n' +
                             '  "title": "{{ project.full_name }} #{{ build.number }}",\n' +
                             '  "message": "FIXED",\n' +
                             '  "url": "{{ project.url }}/{{ build.number }}/ }}",\n' +
                             '  "url_title": "View Build",\n' +
                             '  "timestamp": {{ timestamp }}\n' +
                             '}',
        default_options: common_values.pushover_defaults,
        example_data:    common_values.jenkins_example_data,
        event_types:     ['build_fixed'],
        render_engine:   'liquid'
    },

    /**
     * Dockerhub: Repo Updated
     */
    {
        service_type:    common_values.service_type_pushover,
        in_service_type: common_values.service_type_dockerhub,
        name:            'Repo Updated',
        content:         '{\n' +
                             '  "title": "Docker: {{ repo }}",\n' +
                             '  "message": "{{ tag }} updated by {{ pusher }}",\n' +
                             '  "url": "{{ url }}",\n' +
                             '  "url_title": "View"\n' +
                             '}',
        default_options: common_values.pushover_defaults,
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
            comment_count: 0
        },
        event_types:     ['repo_updated'],
        render_engine:   'liquid'
    },

    /**
     * Zendesk: A Ticket is assigned to you
     */
    {
        service_type:    common_values.service_type_pushover,
        in_service_type: common_values.service_type_zendesk,
        name:            'A Ticket is assigned to you',
        content:         '{\n' +
                             '  "title": "Ticket #{{ ticket.id }}",\n' +
                             '  "message": "Assigned to you{% if current_user %} by {{ current_user.name }}{% endif %}",\n' +
                             '  "url": "{{ ticket.link }}",\n' +
                             '  "url_title": "View Ticket"\n' +
                             '}',
        default_options: common_values.pushover_defaults,
        example_data:    {
            ticket:       {
                id:        57506,
                title:     'Billy Box has submitted a website enquiry',
                link:      'https://example.zendesk.com/agent/tickets/57506',
                via:       'Mail',
                status:    'Pending',
                priority:  'Normal',
                requester: {
                    email: 'billybob@example.com',
                    name:  'Billy Bob'
                }
            },
            current_user: {
                name:     'Joe Citizen',
                gravatar: 'https://public.jc21.com/juxtapose/icons/zendesk.png'
            }
        },
        event_types:     ['my_ticket_assigned'],
        render_engine:   'liquid'
    },

    /**
     * Zendesk: A Ticket is updated
     */
    {
        service_type:    common_values.service_type_pushover,
        in_service_type: common_values.service_type_zendesk,
        name:            'A Ticket is updated',
        content:         '{\n' +
                             '  "title": "Ticket #{{ ticket.id }}",\n' +
                             '  "message": "Updated{% if current_user %} by {{ current_user.name }}{% endif %}",\n' +
                             '  "url": "{{ ticket.link }}",\n' +
                             '  "url_title": "View Ticket"\n' +
                             '}',
        default_options: common_values.pushover_defaults,
        example_data:    {
            ticket:       {
                id:        57506,
                title:     'Billy Box has submitted a website enquiry',
                link:      'https://example.zendesk.com/agent/tickets/57506',
                via:       'Mail',
                status:    'Pending',
                priority:  'Normal',
                requester: {
                    email: 'billybob@example.com',
                    name:  'Billy Bob'
                }
            },
            current_user: {
                name:     'Joe Citizen',
                gravatar: 'https://public.jc21.com/juxtapose/icons/zendesk.png'
            }
        },
        event_types:     ['my_ticket_updated'],
        render_engine:   'liquid'
    },

    /**
     * Zendesk: A Ticket is re-assigned
     */
    {
        service_type:    common_values.service_type_pushover,
        in_service_type: common_values.service_type_zendesk,
        name:            'A Ticket is re-assigned',
        content:         '{\n' +
                             '  "title": "Ticket #{{ ticket.id }}",\n' +
                             '  "message": "Reassigned{% if current_user %} by {{ current_user.name }}{% endif %}",\n' +
                             '  "url": "{{ ticket.link }}",\n' +
                             '  "url_title": "View Ticket"\n' +
                             '}',
        default_options: common_values.pushover_defaults,
        example_data:    {
            ticket:       {
                id:        57506,
                title:     'Billy Box has submitted a website enquiry',
                link:      'https://example.zendesk.com/agent/tickets/57506',
                via:       'Mail',
                status:    'Pending',
                priority:  'Normal',
                requester: {
                    email: 'billybob@example.com',
                    name:  'Billy Bob'
                },
                assignee:  {
                    name: 'Johnny Goodguy'
                }
            },
            current_user: {
                name:     'Joe Citizen',
                gravatar: 'https://public.jc21.com/juxtapose/icons/zendesk.png'
            }
        },
        event_types:     ['my_ticket_reassigned'],
        render_engine:   'liquid'
    },

    /**
     * Zendesk: A comments is made on a Ticket
     */
    {
        service_type:    common_values.service_type_pushover,
        in_service_type: common_values.service_type_zendesk,
        name:            'A comments is made on a Ticket',
        content:         '{\n' +
                             '  "title": "Ticket #{{ ticket.id }}",\n' +
                             '  "message": "Comment: {{ ticket.latest_comment.value | jsonescape }}",\n' +
                             '  "url": "{{ ticket.link }}",\n' +
                             '  "url_title": "View Ticket"\n' +
                             '}',
        default_options: common_values.pushover_defaults,
        example_data:    {
            ticket: {
                id:             57506,
                title:          'Billy Bob has submitted a website enquiry',
                link:           'https://example.zendesk.com/agent/tickets/57506',
                status:         'Pending',
                priority:       'Normal',
                requester:      {
                    email: 'billybob@example.com',
                    name:  'Billy Bob'
                },
                latest_comment: {
                    author_name:     'Johnny Goodguy',
                    author_gravatar: 'https://public.jc21.com/juxtapose/icons/zendesk.png',
                    is_public:       false,
                    value:           'Whatever mate'
                }
            }
        },
        event_types:     ['my_ticket_commented'],
        render_engine:   'liquid'
    },

    /**
     * Zendesk: A rating is made on your Ticket
     */
    {
        service_type:    common_values.service_type_pushover,
        in_service_type: common_values.service_type_zendesk,
        name:            'A rating is made on your Ticket',
        content:         '{\n' +
                             '  "title": "Ticket #{{ ticket.id }}",\n' +
                             '  "message": "Rated: {{ satisfaction.current_rating | jsonescape }}",\n' +
                             '  "url": "{{ ticket.link }}",\n' +
                             '  "url_title": "View Ticket"\n' +
                             '}',
        default_options: common_values.pushover_defaults,
        example_data:    {
            ticket:       {
                id:        57506,
                title:     'Billy Box has submitted a website enquiry',
                link:      'https://example.zendesk.com/agent/tickets/57506',
                via:       'Mail',
                status:    'Pending',
                priority:  'Normal',
                requester: {
                    email:    'billybob@example.com',
                    name:     'Billy Bob',
                    gravatar: 'https://public.jc21.com/juxtapose/icons/zendesk.png'
                }
            },
            satisfaction: {
                current_rating:  '&quot;Good, I&#39;m satisfied&quot;',
                current_comment: 'Always fun dealing with this guy'
            }
        },
        event_types:     ['my_ticket_rated', 'ticket_rated'],
        render_engine:   'liquid'
    },

    /**
     * Zendesk: Any Ticket is logged without an Assignee
     */
    {
        service_type:    common_values.service_type_pushover,
        in_service_type: common_values.service_type_zendesk,
        name:            'Any Ticket is logged without an Assignee',
        content:         '{\n' +
                             '  "title": "Ticket #{{ ticket.id }} Logged",\n' +
                             '  "message": "{{ ticket.title | jsonescape }}",\n' +
                             '  "url": "{{ ticket.link }}",\n' +
                             '  "url_title": "View Ticket"\n' +
                             '}',
        default_options: common_values.pushover_defaults,
        example_data:    {
            ticket: {
                id:         57506,
                title:      'Billy Bob has submitted a website enquiry',
                link:       'https://example.zendesk.com/agent/tickets/57506',
                via:        'Mail',
                status:     'Pending',
                priority:   'Normal',
                group_name: 'Accounts',
                requester:  {
                    email:    'billybob@example.com',
                    name:     'Billy Bob',
                    gravatar: 'https://public.jc21.com/juxtapose/icons/zendesk.png'
                }
            }
        },
        event_types:     ['ticket_logged'],
        render_engine:   'liquid'
    },

    /**
     * Bitbucket: PR Merged
     */
    {
        service_type:    common_values.service_type_pushover,
        in_service_type: common_values.service_type_bitbucket,
        name:            'PR Merged',
        content:         '{\n' +
                             '  "title": "{{ project }} / {{ repo }} / {{ branch }}",\n' +
                             '  "message": "PR Merged: {{ title | jsonescape }}",\n' +
                             '  "url": "{{ prurl }}",\n' +
                             '  "url_title": "View PR"\n' +
                             '}',
        default_options: common_values.pushover_defaults,
        example_data:    {
            user:           'Billy Bob',
            user_email:     'billybob@example.com',
            user_gravatar:  'https://public.jc21.com/juxtapose/icons/bitbucket.png',
            owner:          'Billy Bob',
            owner_email:    'billybob@example.com',
            owner_gravatar: 'https://public.jc21.com/juxtapose/icons/bitbucket.png',
            prurl:          'http://example.com',
            title:          'FEAT-1234 - Enable Feature x for Customer',
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
        },
        event_types:     ['my_pr_merged', 'pr_merged'],
        render_engine:   'liquid'
    },

    /**
     * Bitbucket: Your PR was Declined
     */
    {
        service_type:    common_values.service_type_pushover,
        in_service_type: common_values.service_type_bitbucket,
        name:            'Your PR was Declined',
        content:         '{\n' +
                             '  "title": "{{ project }} / {{ repo }} / {{ branch }}",\n' +
                             '  "message": "PR Declined: {{ title | jsonescape }}",\n' +
                             '  "url": "{{ prurl }}",\n' +
                             '  "url_title": "View PR"\n' +
                             '}',
        default_options: common_values.pushover_defaults,
        example_data:    {
            user:           'Billy Bob',
            user_email:     'billybob@example.com',
            user_gravatar:  'https://public.jc21.com/juxtapose/icons/bitbucket.png',
            owner:          'Billy Bob',
            owner_email:    'billybob@example.com',
            owner_gravatar: 'https://public.jc21.com/juxtapose/icons/bitbucket.png',
            prurl:          'http://example.com',
            title:          'FEAT-1234 - Enable Feature x for Customer',
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
        },
        event_types:     ['my_pr_declined'],
        render_engine:   'liquid'
    },

    /**
     * Bitbucket: Commented on your PR
     */
    {
        service_type:    common_values.service_type_pushover,
        in_service_type: common_values.service_type_bitbucket,
        name:            'Commented on your PR',
        content:         '{\n' +
                             '  "title": "{{ project }} / {{ repo }} / {{ branch }}",\n' +
                             '  "message": "PR Comment: {{ title | jsonescape }}",\n' +
                             '  "url": "{{ prurl }}",\n' +
                             '  "url_title": "View PR"\n' +
                             '}',
        default_options: common_values.pushover_defaults,
        example_data:    {
            user:           'Billy Bob',
            user_email:     'billybob@example.com',
            user_gravatar:  'https://public.jc21.com/juxtapose/icons/jira.png',
            owner:          'Billy Bob',
            owner_email:    'billybob@example.com',
            owner_gravatar: 'https://public.jc21.com/juxtapose/icons/jira.png',
            prurl:          'http://example.com',
            title:          'FEAT-1234 - Enable Feature x for Customer',
            description:    'Customer y now has this feature.',
            project:        'PROD',
            repo:           'application',
            branch:         'master',
            approval_count: 1,
            from:           {
                project: 'billybob',
                repo:    'application',
                branch:  'feature/1234'
            },
            comment:        {
                text:            'This is a random comment with no purpose.',
                author:          'Joe Citizen',
                author_email:    'joe@example.com',
                author_gravatar: 'https://public.jc21.com/juxtapose/icons/bitbucket.png'
            }
        },
        event_types:     ['my_pr_comment'],
        render_engine:   'liquid'
    },

    /**
     * Bitbucket: PR Opened
     */
    {
        service_type:    common_values.service_type_pushover,
        in_service_type: common_values.service_type_bitbucket,
        name:            'PR Opened',
        content:         '{\n' +
                             '  "title": "{{ project }} / {{ repo }} / {{ branch }}",\n' +
                             '  "message": "PR Opened: {{ title | jsonescape }}",\n' +
                             '  "url": "{{ prurl }}",\n' +
                             '  "url_title": "View PR"\n' +
                             '}',
        default_options: common_values.pushover_defaults,
        example_data:    {
            user:           'Billy Bob',
            user_email:     'billybob@example.com',
            user_gravatar:  'https://public.jc21.com/juxtapose/icons/bitbucket.png',
            owner:          'Billy Bob',
            owner_email:    'billybob@example.com',
            owner_gravatar: 'https://public.jc21.com/juxtapose/icons/bitbucket.png',
            prurl:          'http://example.com',
            title:          'FEAT-1234 - Enable Feature x for Customer',
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
        },
        event_types:     ['pr_review_requested', 'pr_opened'],
        render_engine:   'liquid'
    },

    /**
     * Bitbucket: Your PR was Approved
     */
    {
        service_type:    common_values.service_type_pushover,
        in_service_type: common_values.service_type_bitbucket,
        name:            'Your PR was Approved',
        content:         '{\n' +
                             '  "title": "{{ project }} / {{ repo }} / {{ branch }}",\n' +
                             '  "message": "PR Approved: {{ title | jsonescape }}",\n' +
                             '  "url": "{{ prurl }}",\n' +
                             '  "url_title": "View PR"\n' +
                             '}',
        default_options: common_values.pushover_defaults,
        example_data:    {
            user:           'Billy Bob',
            user_email:     'billybob@example.com',
            user_gravatar:  'https://public.jc21.com/juxtapose/icons/bitbucket.png',
            owner:          'Billy Bob',
            owner_email:    'billybob@example.com',
            owner_gravatar: 'https://public.jc21.com/juxtapose/icons/bitbucket.png',
            prurl:          'http://example.com',
            title:          'FEAT-1234 - Enable Feature x for Customer',
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
        },
        event_types:     ['my_pr_approved'],
        render_engine:   'liquid'
    },

    /**
     * Bitbucket: Your PR was Deleted
     */
    {
        service_type:    common_values.service_type_pushover,
        in_service_type: common_values.service_type_bitbucket,
        name:            'Your PR was Deleted',
        content:         '{\n' +
                             '  "title": "{{ project }} / {{ repo }} / {{ branch }}",\n' +
                             '  "message": "PR Deleted: {{ title | jsonescape }}",\n' +
                             '  "url": "{{ prurl }}",\n' +
                             '  "url_title": "View PR"\n' +
                             '}',
        default_options: common_values.pushover_defaults,
        example_data:    {
            user:           'Billy Bob',
            user_email:     'billybob@example.com',
            user_gravatar:  'https://public.jc21.com/juxtapose/icons/bitbucket.png',
            owner:          'Billy Bob',
            owner_email:    'billybob@example.com',
            owner_gravatar: 'https://public.jc21.com/juxtapose/icons/bitbucket.png',
            prurl:          'http://example.com',
            title:          'FEAT-1234 - Enable Feature x for Customer',
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
        },
        event_types:     ['my_pr_deleted'],
        render_engine:   'liquid'
    },

    /**
     * Bitbucket: Your PR Needs Work
     */
    {
        service_type:    common_values.service_type_pushover,
        in_service_type: common_values.service_type_bitbucket,
        name:            'Your PR Needs Work',
        content:         '{\n' +
                             '  "title": "{{ project }} / {{ repo }} / {{ branch }}",\n' +
                             '  "message": "PR Needs Work: {{ title | jsonescape }}",\n' +
                             '  "url": "{{ prurl }}",\n' +
                             '  "url_title": "View PR"\n' +
                             '}',
        default_options: common_values.pushover_defaults,
        example_data:    {
            user:           'Billy Bob',
            user_email:     'billybob@example.com',
            user_gravatar:  'https://public.jc21.com/juxtapose/icons/bitbucket.png',
            owner:          'Billy Bob',
            owner_email:    'billybob@example.com',
            owner_gravatar: 'https://public.jc21.com/juxtapose/icons/bitbucket.png',
            prurl:          'http://example.com',
            title:          'FEAT-1234 - Enable Feature x for Customer',
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
        },
        event_types:     ['my_pr_needs_work'],
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
    logger.info('[' + migrate_name + '] Migrating Up...');

    return new Promise((resolve, reject) => {
        batchflow(templates).sequential()
            .each((i, template_data, next) => {
                logger.info('[' + migrate_name + '] Creating Template: ' + template_data.in_service_type + ' -> ' + template_data.service_type + ' -> ' + template_data.name);

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
    logger.warn('[' + migrate_name + '] You can\'t migrate down the templates.');
    return Promise.resolve(true);
};
