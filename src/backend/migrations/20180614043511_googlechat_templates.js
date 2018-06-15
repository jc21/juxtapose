'use strict';

const migrate_name     = 'googlechat_templates';
const logger           = require('../logger').migrate;
const batchflow        = require('batchflow');
const internalTemplate = require('../internal/template');

const common_values = {
    jenkins_icon:           'https://public.jc21.com/juxtapose/icons/jenkins.png',
    service_type_gchat:     'gchat',
    service_type_jira:      'jira-webhook',
    service_type_jenkins:   'jenkins-webhook',
    service_type_dockerhub: 'dockerhub-webhook',
    service_type_zendesk:   'zendesk-webhook',
    service_type_bitbucket: 'bitbucket-webhook',
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
        description:   'At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et.'
    },
    zendesk_example_data:   {}
};

/**
 * Zendesk Templates
 *
 * @type {Array}
 */
const templates = [
    /**
     * Jira: Assigned Issue To You Minimal
     */
    {
        service_type:    common_values.service_type_gchat,
        in_service_type: common_values.service_type_jira,
        name:            'Assigned Issue To You Minimal',
        content:         '{\n' +
                         '  "cards": [\n' +
                         '    {\n' +
                         '      "header": {\n' +
                         '        "title": "{{ user }} assigned {{ issuetype }}",\n' +
                         '        "subtitle": "{{ issuekey }}: {{ priority }}",\n' +
                         '        "imageUrl": "{{ user_gravatar }}",\n' +
                         '        "imageStyle": "AVATAR"\n' +
                         '      },\n' +
                         '      "sections": [\n' +
                         '        {\n' +
                         '          "widgets": [\n' +
                         '            {\n' +
                         '              "textParagraph": {\n' +
                         '                "text": "{{ summary | jsonescape }}"\n' +
                         '              }\n' +
                         '            }\n' +
                         '          ]\n' +
                         '        },\n' +
                         '        {\n' +
                         '          "widgets": [\n' +
                         '            {\n' +
                         '              "buttons": [\n' +
                         '                {\n' +
                         '                  "textButton": {\n' +
                         '                    "text": "View {{ issuekey }}",\n' +
                         '                    "onClick": {\n' +
                         '                      "openLink": {\n' +
                         '                        "url": "{{ issueurl }}"\n' +
                         '                      }\n' +
                         '                    }\n' +
                         '                  }\n' +
                         '                }\n' +
                         '              ]\n' +
                         '            }\n' +
                         '          ]\n' +
                         '        }\n' +
                         '      ]\n' +
                         '    }\n' +
                         '  ]\n' +
                         '}',
        default_options: {},
        example_data:    common_values.jira_example_data,
        event_types:     ['assigned'],
        render_engine:   'liquid'
    },

    /**
     * Jira: Assigned Issue To You w/ Description
     */
    {
        service_type:    common_values.service_type_gchat,
        in_service_type: common_values.service_type_jira,
        name:            'Assigned Issue To You w/ Description',
        content:         '{\n' +
                         '  "cards": [\n' +
                         '    {\n' +
                         '      "header": {\n' +
                         '        "title": "{{ user }} assigned {{ issuetype }}",\n' +
                         '        "subtitle": "{{ issuekey }}: {{ priority }}",\n' +
                         '        "imageUrl": "{{ user_gravatar }}",\n' +
                         '        "imageStyle": "AVATAR"\n' +
                         '      },\n' +
                         '      "sections": [\n' +
                         '        {\n' +
                         '          "widgets": [\n' +
                         '            {\n' +
                         '              "textParagraph": {\n' +
                         '                "text": "{{ summary | jsonescape }}"\n' +
                         '              }\n' +
                         '            }\n' +
                         '          ]\n' +
                         '        },\n' +
                         '        {\n' +
                         '          "widgets": [\n' +
                         '            {\n' +
                         '              "textParagraph": {\n' +
                         '                "text": "{{ description | jsonescape }}"\n' +
                         '              }\n' +
                         '            }\n' +
                         '          ]\n' +
                         '        },\n' +
                         '        {\n' +
                         '          "widgets": [\n' +
                         '            {\n' +
                         '              "buttons": [\n' +
                         '                {\n' +
                         '                  "textButton": {\n' +
                         '                    "text": "View {{ issuekey }}",\n' +
                         '                    "onClick": {\n' +
                         '                      "openLink": {\n' +
                         '                        "url": "{{ issueurl }}"\n' +
                         '                      }\n' +
                         '                    }\n' +
                         '                  }\n' +
                         '                }\n' +
                         '              ]\n' +
                         '            }\n' +
                         '          ]\n' +
                         '        }\n' +
                         '      ]\n' +
                         '    }\n' +
                         '  ]\n' +
                         '}',
        default_options: {},
        example_data:    common_values.jira_example_data,
        event_types:     ['assigned'],
        render_engine:   'liquid'
    },

    /**
     * Jira: Updated Issue Minimal
     */
    {
        service_type:    common_values.service_type_gchat,
        in_service_type: common_values.service_type_jira,
        name:            'Updated Issue Minimal',
        content:         '{\n' +
                         '  "cards": [\n' +
                         '    {\n' +
                         '      "header": {\n' +
                         '        "title": "{{ user }} updated a {{ issuetype }}",\n' +
                         '        "subtitle": "{{ issuekey }}: {{ priority }} - {{ issuestatus }}",\n' +
                         '        "imageUrl": "{{ user_gravatar }}",\n' +
                         '        "imageStyle": "AVATAR"\n' +
                         '      },\n' +
                         '      "sections": [\n' +
                         '        {\n' +
                         '          "widgets": [\n' +
                         '            {\n' +
                         '              "textParagraph": {\n' +
                         '                "text": "{{ summary | jsonescape }}"\n' +
                         '              }\n' +
                         '            }\n' +
                         '          ]\n' +
                         '        },\n' +
                         '        {\n' +
                         '          "widgets": [\n' +
                         '            {\n' +
                         '              "buttons": [\n' +
                         '                {\n' +
                         '                  "textButton": {\n' +
                         '                    "text": "View {{ issuekey }}",\n' +
                         '                    "onClick": {\n' +
                         '                      "openLink": {\n' +
                         '                        "url": "{{ issueurl }}"\n' +
                         '                      }\n' +
                         '                    }\n' +
                         '                  }\n' +
                         '                }\n' +
                         '              ]\n' +
                         '            }\n' +
                         '          ]\n' +
                         '        }\n' +
                         '      ]\n' +
                         '    }\n' +
                         '  ]\n' +
                         '}',
        default_options: {},
        example_data:    common_values.jira_example_data,
        event_types:     ['updated', 'updated_reported', 'updated_participated'],
        render_engine:   'liquid'
    },

    /**
     * Jira: Updated Issue w/ Fields
     */
    {
        service_type:    common_values.service_type_gchat,
        in_service_type: common_values.service_type_jira,
        name:            'Updated Issue w/ Fields',
        content:         '{\n' +
                         '  "cards": [\n' +
                         '    {\n' +
                         '      "header": {\n' +
                         '        "title": "{{ user }} updated a {{ issuetype }}",\n' +
                         '        "subtitle": "{{ issuekey }}: {{ priority }} - {{ issuestatus }}",\n' +
                         '        "imageUrl": "{{ user_gravatar }}",\n' +
                         '        "imageStyle": "AVATAR"\n' +
                         '      },\n' +
                         '      "sections": [\n' +
                         '        {\n' +
                         '          "widgets": [\n' +
                         '            {\n' +
                         '              "keyValue": {\n' +
                         '                "topLabel": "Updated Fields",\n' +
                         '                "content": "{{ fields }}",\n' +
                         '                "contentMultiline": "true",\n' +
                         '                "icon": "DESCRIPTION"\n' +
                         '              }\n' +
                         '            }\n' +
                         '          ]\n' +
                         '        },\n' +
                         '        {\n' +
                         '          "widgets": [\n' +
                         '            {\n' +
                         '              "buttons": [\n' +
                         '                {\n' +
                         '                  "textButton": {\n' +
                         '                    "text": "View {{ issuekey }}",\n' +
                         '                    "onClick": {\n' +
                         '                      "openLink": {\n' +
                         '                        "url": "{{ issueurl }}"\n' +
                         '                      }\n' +
                         '                    }\n' +
                         '                  }\n' +
                         '                }\n' +
                         '              ]\n' +
                         '            }\n' +
                         '          ]\n' +
                         '        }\n' +
                         '      ]\n' +
                         '    }\n' +
                         '  ]\n' +
                         '}',
        default_options: {},
        example_data:    common_values.jira_example_data,
        event_types:     ['updated', 'updated_reported', 'updated_participated'],
        render_engine:   'liquid'
    },

    /**
     * Jira: Re-opened Issue Minimal
     */
    {
        service_type:    common_values.service_type_gchat,
        in_service_type: common_values.service_type_jira,
        name:            'Re-opened Issue Minimal',
        content:         '{\n' +
                         '  "cards": [\n' +
                         '    {\n' +
                         '      "header": {\n' +
                         '        "title": "{{ user }} re-opened a {{ issuetype }}",\n' +
                         '        "subtitle": "{{ issuekey }}: {{ priority }}",\n' +
                         '        "imageUrl": "{{ user_gravatar }}",\n' +
                         '        "imageStyle": "AVATAR"\n' +
                         '      },\n' +
                         '      "sections": [\n' +
                         '        {\n' +
                         '          "widgets": [\n' +
                         '            {\n' +
                         '              "textParagraph": {\n' +
                         '                "text": "{{ summary | jsonescape }}"\n' +
                         '              }\n' +
                         '            }\n' +
                         '          ]\n' +
                         '        },\n' +
                         '        {\n' +
                         '          "widgets": [\n' +
                         '            {\n' +
                         '              "buttons": [\n' +
                         '                {\n' +
                         '                  "textButton": {\n' +
                         '                    "text": "View {{ issuekey }}",\n' +
                         '                    "onClick": {\n' +
                         '                      "openLink": {\n' +
                         '                        "url": "{{ issueurl }}"\n' +
                         '                      }\n' +
                         '                    }\n' +
                         '                  }\n' +
                         '                }\n' +
                         '              ]\n' +
                         '            }\n' +
                         '          ]\n' +
                         '        }\n' +
                         '      ]\n' +
                         '    }\n' +
                         '  ]\n' +
                         '}',
        default_options: {},
        example_data:    common_values.jira_example_data,
        event_types:     ['reopened_reported', 'reopened_unassigned', 'reopened'],
        render_engine:   'liquid'
    },

    /**
     * Jira: Re-opened Issue w/ Description
     */
    {
        service_type:    common_values.service_type_gchat,
        in_service_type: common_values.service_type_jira,
        name:            'Re-opened Issue w/ Description',
        content:         '{\n' +
                         '  "cards": [\n' +
                         '    {\n' +
                         '      "header": {\n' +
                         '        "title": "{{ user }} re-opened a {{ issuetype }}",\n' +
                         '        "subtitle": "{{ issuekey }}: {{ priority }}",\n' +
                         '        "imageUrl": "{{ user_gravatar }}",\n' +
                         '        "imageStyle": "AVATAR"\n' +
                         '      },\n' +
                         '      "sections": [\n' +
                         '        {\n' +
                         '          "widgets": [\n' +
                         '            {\n' +
                         '              "textParagraph": {\n' +
                         '                "text": "{{ summary | jsonescape }}"\n' +
                         '              }\n' +
                         '            }\n' +
                         '          ]\n' +
                         '        },\n' +
                         '        {\n' +
                         '          "widgets": [\n' +
                         '            {\n' +
                         '              "textParagraph": {\n' +
                         '                "text": "{{ description | jsonescape }}"\n' +
                         '              }\n' +
                         '            }\n' +
                         '          ]\n' +
                         '        },\n' +
                         '        {\n' +
                         '          "widgets": [\n' +
                         '            {\n' +
                         '              "buttons": [\n' +
                         '                {\n' +
                         '                  "textButton": {\n' +
                         '                    "text": "View {{ issuekey }}",\n' +
                         '                    "onClick": {\n' +
                         '                      "openLink": {\n' +
                         '                        "url": "{{ issueurl }}"\n' +
                         '                      }\n' +
                         '                    }\n' +
                         '                  }\n' +
                         '                }\n' +
                         '              ]\n' +
                         '            }\n' +
                         '          ]\n' +
                         '        }\n' +
                         '      ]\n' +
                         '    }\n' +
                         '  ]\n' +
                         '}',
        default_options: {},
        example_data:    common_values.jira_example_data,
        event_types:     ['reopened_reported', 'reopened_unassigned', 'reopened'],
        render_engine:   'liquid'
    },

    /**
     * Jira: Comment Added
     */
    {
        service_type:    common_values.service_type_gchat,
        in_service_type: common_values.service_type_jira,
        name:            'Comment Added',
        content:         '{\n' +
                         '  "cards": [\n' +
                         '    {\n' +
                         '      "header": {\n' +
                         '        "title": "{{ comment.name }} commented",\n' +
                         '        "subtitle": "{{ issuekey }}: {{ issuetype }} - {{ issuestatus }}",\n' +
                         '        "imageUrl": "{{ user_gravatar }}",\n' +
                         '        "imageStyle": "AVATAR"\n' +
                         '      },\n' +
                         '      "sections": [\n' +
                         '        {\n' +
                         '          "widgets": [\n' +
                         '            {\n' +
                         '              "textParagraph": {\n' +
                         '                "text": "{{ comment.content | jsonescape }}"\n' +
                         '              }\n' +
                         '            }\n' +
                         '          ]\n' +
                         '        },\n' +
                         '        {\n' +
                         '          "widgets": [\n' +
                         '            {\n' +
                         '              "buttons": [\n' +
                         '                {\n' +
                         '                  "textButton": {\n' +
                         '                    "text": "View {{ issuekey }}",\n' +
                         '                    "onClick": {\n' +
                         '                      "openLink": {\n' +
                         '                        "url": "{{ issueurl }}"\n' +
                         '                      }\n' +
                         '                    }\n' +
                         '                  }\n' +
                         '                }\n' +
                         '              ]\n' +
                         '            }\n' +
                         '          ]\n' +
                         '        }\n' +
                         '      ]\n' +
                         '    }\n' +
                         '  ]\n' +
                         '}',
        default_options: {},
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
            }
        },
        event_types:     ['comment_participated', 'comment_reported', 'comment'],
        render_engine:   'liquid'
    },

    /**
     * Jira: Resolved Issue Minimal
     */
    {
        service_type:    common_values.service_type_gchat,
        in_service_type: common_values.service_type_jira,
        name:            'Resolved Issue Minimal',
        content:         '{\n' +
                         '  "cards": [\n' +
                         '    {\n' +
                         '      "header": {\n' +
                         '        "title": "{{ user }} resolved {{ issuetype }}",\n' +
                         '        "subtitle": "{{ issuekey }}: {{ priority }} - {{ resolution }}",\n' +
                         '        "imageUrl": "{{ user_gravatar }}",\n' +
                         '        "imageStyle": "AVATAR"\n' +
                         '      },\n' +
                         '      "sections": [\n' +
                         '        {\n' +
                         '          "widgets": [\n' +
                         '            {\n' +
                         '              "textParagraph": {\n' +
                         '                "text": "{{ summary | jsonescape }}"\n' +
                         '              }\n' +
                         '            }\n' +
                         '          ]\n' +
                         '        },\n' +
                         '        {\n' +
                         '          "widgets": [\n' +
                         '            {\n' +
                         '              "buttons": [\n' +
                         '                {\n' +
                         '                  "textButton": {\n' +
                         '                    "text": "View {{ issuekey }}",\n' +
                         '                    "onClick": {\n' +
                         '                      "openLink": {\n' +
                         '                        "url": "{{ issueurl }}"\n' +
                         '                      }\n' +
                         '                    }\n' +
                         '                  }\n' +
                         '                }\n' +
                         '              ]\n' +
                         '            }\n' +
                         '          ]\n' +
                         '        }\n' +
                         '      ]\n' +
                         '    }\n' +
                         '  ]\n' +
                         '}',
        default_options: {},
        example_data:    common_values.jira_example_data,
        event_types:     ['resolved', 'resolved_all', 'resolved_reported'],
        render_engine:   'liquid'
    },

    /**
     * Jira: Resolved Issue w/ Description
     */
    {
        service_type:    common_values.service_type_gchat,
        in_service_type: common_values.service_type_jira,
        name:            'Resolved Issue w/ Description',
        content:         '{\n' +
                         '  "cards": [\n' +
                         '    {\n' +
                         '      "header": {\n' +
                         '        "title": "{{ user }} resolved {{ issuetype }}",\n' +
                         '        "subtitle": "{{ issuekey }}: {{ priority }} - {{ resolution }}",\n' +
                         '        "imageUrl": "{{ user_gravatar }}",\n' +
                         '        "imageStyle": "AVATAR"\n' +
                         '      },\n' +
                         '      "sections": [\n' +
                         '        {\n' +
                         '          "widgets": [\n' +
                         '            {\n' +
                         '              "textParagraph": {\n' +
                         '                "text": "{{ summary | jsonescape }}"\n' +
                         '              }\n' +
                         '            }\n' +
                         '          ]\n' +
                         '        },\n' +
                         '        {\n' +
                         '          "widgets": [\n' +
                         '            {\n' +
                         '              "textParagraph": {\n' +
                         '                "text": "{{ description | jsonescape }}"\n' +
                         '              }\n' +
                         '            }\n' +
                         '          ]\n' +
                         '        },\n' +
                         '        {\n' +
                         '          "widgets": [\n' +
                         '            {\n' +
                         '              "buttons": [\n' +
                         '                {\n' +
                         '                  "textButton": {\n' +
                         '                    "text": "View {{ issuekey }}",\n' +
                         '                    "onClick": {\n' +
                         '                      "openLink": {\n' +
                         '                        "url": "{{ issueurl }}"\n' +
                         '                      }\n' +
                         '                    }\n' +
                         '                  }\n' +
                         '                }\n' +
                         '              ]\n' +
                         '            }\n' +
                         '          ]\n' +
                         '        }\n' +
                         '      ]\n' +
                         '    }\n' +
                         '  ]\n' +
                         '}',
        default_options: {},
        example_data:    common_values.jira_example_data,
        event_types:     ['resolved', 'resolved_all', 'resolved_reported'],
        render_engine:   'liquid'
    },

    /**
     * Jira: Re-assigned Away From You Minimal
     */
    {
        service_type:    common_values.service_type_gchat,
        in_service_type: common_values.service_type_jira,
        name:            'Re-assigned Away From You Minimal',
        content:         '{\n' +
                         '  "cards": [\n' +
                         '    {\n' +
                         '      "header": {\n' +
                         '        "title": "{{ user }} re-assigned a {{ issuetype }}",\n' +
                         '        "subtitle": "{{ issuekey }}: {{ priority }}",\n' +
                         '        "imageUrl": "{{ user_gravatar }}",\n' +
                         '        "imageStyle": "AVATAR"\n' +
                         '      },\n' +
                         '      "sections": [\n' +
                         '        {\n' +
                         '          "widgets": [\n' +
                         '            {\n' +
                         '              "keyValue": {\n' +
                         '                "topLabel": "New Assignee",\n' +
                         '                "content": "{{ assignee }}"\n' +
                         '              }\n' +
                         '            }\n' +
                         '          ]\n' +
                         '        },\n' +
                         '        {\n' +
                         '          "widgets": [\n' +
                         '            {\n' +
                         '              "buttons": [\n' +
                         '                {\n' +
                         '                  "textButton": {\n' +
                         '                    "text": "View {{ issuekey }}",\n' +
                         '                    "onClick": {\n' +
                         '                      "openLink": {\n' +
                         '                        "url": "{{ issueurl }}"\n' +
                         '                      }\n' +
                         '                    }\n' +
                         '                  }\n' +
                         '                }\n' +
                         '              ]\n' +
                         '            }\n' +
                         '          ]\n' +
                         '        }\n' +
                         '      ]\n' +
                         '    }\n' +
                         '  ]\n' +
                         '}',
        default_options: {},
        example_data:    common_values.jira_example_data,
        event_types:     ['reassigned'],
        render_engine:   'liquid'
    },

    /**
     * Jira: Re-assigned Away From You w/ Description
     */
    {
        service_type:    common_values.service_type_gchat,
        in_service_type: common_values.service_type_jira,
        name:            'Re-assigned Away From You w/ Description',
        content:         '{\n' +
                         '  "cards": [\n' +
                         '    {\n' +
                         '      "header": {\n' +
                         '        "title": "{{ user }} re-assigned a {{ issuetype }}",\n' +
                         '        "subtitle": "{{ issuekey }}: {{ priority }}",\n' +
                         '        "imageUrl": "{{ user_gravatar }}",\n' +
                         '        "imageStyle": "AVATAR"\n' +
                         '      },\n' +
                         '      "sections": [\n' +
                         '        {\n' +
                         '          "widgets": [\n' +
                         '            {\n' +
                         '              "keyValue": {\n' +
                         '                "topLabel": "New Assignee",\n' +
                         '                "content": "{{ assignee }}"\n' +
                         '              }\n' +
                         '            }\n' +
                         '          ]\n' +
                         '        },\n' +
                         '        {\n' +
                         '          "widgets": [\n' +
                         '            {\n' +
                         '              "textParagraph": {\n' +
                         '                "text": "{{ description | jsonescape }}"\n' +
                         '              }\n' +
                         '            }\n' +
                         '          ]\n' +
                         '        },\n' +
                         '        {\n' +
                         '          "widgets": [\n' +
                         '            {\n' +
                         '              "buttons": [\n' +
                         '                {\n' +
                         '                  "textButton": {\n' +
                         '                    "text": "View {{ issuekey }}",\n' +
                         '                    "onClick": {\n' +
                         '                      "openLink": {\n' +
                         '                        "url": "{{ issueurl }}"\n' +
                         '                      }\n' +
                         '                    }\n' +
                         '                  }\n' +
                         '                }\n' +
                         '              ]\n' +
                         '            }\n' +
                         '          ]\n' +
                         '        }\n' +
                         '      ]\n' +
                         '    }\n' +
                         '  ]\n' +
                         '}',
        default_options: {},
        example_data:    common_values.jira_example_data,
        event_types:     ['reassigned'],
        render_engine:   'liquid'
    },

    /**
     * Jira: Logged Issue Minimal
     */
    {
        service_type:    common_values.service_type_gchat,
        in_service_type: common_values.service_type_jira,
        name:            'Logged Issue Minimal',
        content:         '{\n' +
                         '  "cards": [\n' +
                         '    {\n' +
                         '      "header": {\n' +
                         '        "title": "{{ user }} logged a {{ issuetype }}",\n' +
                         '        "subtitle": "{{ issuekey }}: {{ priority }}",\n' +
                         '        "imageUrl": "{{ user_gravatar }}",\n' +
                         '        "imageStyle": "AVATAR"\n' +
                         '      },\n' +
                         '      "sections": [\n' +
                         '        {\n' +
                         '          "widgets": [\n' +
                         '            {\n' +
                         '              "textParagraph": {\n' +
                         '                "text": "{{ summary | jsonescape }}"\n' +
                         '              }\n' +
                         '            }\n' +
                         '          ]\n' +
                         '        },\n' +
                         '        {\n' +
                         '          "widgets": [\n' +
                         '            {\n' +
                         '              "buttons": [\n' +
                         '                {\n' +
                         '                  "textButton": {\n' +
                         '                    "text": "View {{ issuekey }}",\n' +
                         '                    "onClick": {\n' +
                         '                      "openLink": {\n' +
                         '                        "url": "{{ issueurl }}"\n' +
                         '                      }\n' +
                         '                    }\n' +
                         '                  }\n' +
                         '                }\n' +
                         '              ]\n' +
                         '            }\n' +
                         '          ]\n' +
                         '        }\n' +
                         '      ]\n' +
                         '    }\n' +
                         '  ]\n' +
                         '}',
        default_options: {},
        example_data:    common_values.jira_example_data,
        event_types:     ['logged_unassigned'],
        render_engine:   'liquid'
    },

    /**
     * Jira: Logged Issue w/ Description
     */
    {
        service_type:    common_values.service_type_gchat,
        in_service_type: common_values.service_type_jira,
        name:            'Logged Issue w/ Description',
        content:         '{\n' +
                         '  "cards": [\n' +
                         '    {\n' +
                         '      "header": {\n' +
                         '        "title": "{{ user }} logged a {{ issuetype }}",\n' +
                         '        "subtitle": "{{ issuekey }}: {{ priority }}",\n' +
                         '        "imageUrl": "{{ user_gravatar }}",\n' +
                         '        "imageStyle": "AVATAR"\n' +
                         '      },\n' +
                         '      "sections": [\n' +
                         '        {\n' +
                         '          "widgets": [\n' +
                         '            {\n' +
                         '              "textParagraph": {\n' +
                         '                "text": "{{ summary | jsonescape }}"\n' +
                         '              }\n' +
                         '            }\n' +
                         '          ]\n' +
                         '        },\n' +
                         '        {\n' +
                         '          "widgets": [\n' +
                         '            {\n' +
                         '              "textParagraph": {\n' +
                         '                "text": "{{ description | jsonescape }}"\n' +
                         '              }\n' +
                         '            }\n' +
                         '          ]\n' +
                         '        },\n' +
                         '        {\n' +
                         '          "widgets": [\n' +
                         '            {\n' +
                         '              "buttons": [\n' +
                         '                {\n' +
                         '                  "textButton": {\n' +
                         '                    "text": "View {{ issuekey }}",\n' +
                         '                    "onClick": {\n' +
                         '                      "openLink": {\n' +
                         '                        "url": "{{ issueurl }}"\n' +
                         '                      }\n' +
                         '                    }\n' +
                         '                  }\n' +
                         '                }\n' +
                         '              ]\n' +
                         '            }\n' +
                         '          ]\n' +
                         '        }\n' +
                         '      ]\n' +
                         '    }\n' +
                         '  ]\n' +
                         '}',
        default_options: {},
        example_data:    common_values.jira_example_data,
        event_types:     ['logged_unassigned'],
        render_engine:   'liquid'
    },

    /**
     * Jenkins: Build Success Minimal
     */
    {
        service_type:    common_values.service_type_gchat,
        in_service_type: common_values.service_type_jenkins,
        name:            'Build Success Minimal',
        content:         '{\n' +
                         '  "cards": [\n' +
                         '    {\n' +
                         '      "header": {\n' +
                         '        "title": "A build has Succeeded",\n' +
                         '        "subtitle": "{{ project.full_name }} #{{ build.number }}",\n' +
                         '        "imageUrl": "https://public.jc21.com/juxtapose/icons/jenkins.png",\n' +
                         '        "imageStyle": "IMAGE"\n' +
                         '      },\n' +
                         '      "sections": [\n' +
                         '        {\n' +
                         '          "widgets": [\n' +
                         '            {\n' +
                         '              "buttons": [\n' +
                         '                {\n' +
                         '                  "textButton": {\n' +
                         '                    "text": "View Build",\n' +
                         '                    "onClick": {\n' +
                         '                      "openLink": {\n' +
                         '                        "url": "{{ project.url }}/{{ build.number }}/"\n' +
                         '                      }\n' +
                         '                    }\n' +
                         '                  }\n' +
                         '                }\n' +
                         '              ]\n' +
                         '            }\n' +
                         '          ]\n' +
                         '        }\n' +
                         '      ]\n' +
                         '    }\n' +
                         '  ]\n' +
                         '}',
        default_options: {},
        example_data:    common_values.jenkins_example_data,
        event_types:     ['build_success'],
        render_engine:   'liquid'
    },

    /**
     * Jenkins: Build Success
     */
    {
        service_type:    common_values.service_type_gchat,
        in_service_type: common_values.service_type_jenkins,
        name:            'Build Success',
        content:         '{\n' +
                         '  "cards": [\n' +
                         '    {\n' +
                         '      "header": {\n' +
                         '        "title": "A build has Succeeded",\n' +
                         '        "subtitle": "{{ project.full_name }} #{{ build.number }}",\n' +
                         '        "imageUrl": "https://public.jc21.com/juxtapose/icons/jenkins.png",\n' +
                         '        "imageStyle": "IMAGE"\n' +
                         '      },\n' +
                         '      "sections": [\n' +
                         '        {\n' +
                         '          "widgets": [\n' +
                         '            {\n' +
                         '              "keyValue": {\n' +
                         '                "topLabel": "Cause",\n' +
                         '                "content": "{{ build.cause | jsonescape }}"\n' +
                         '              }\n' +
                         '            },\n' +
                         '            {\n' +
                         '              "keyValue": {\n' +
                         '                "topLabel": "Duration",\n' +
                         '                "content": "{{ build.duration_string }}"\n' +
                         '              }\n' +
                         '            }\n' +
                         '          ]\n' +
                         '        },\n' +
                         '        {\n' +
                         '          "widgets": [\n' +
                         '            {\n' +
                         '              "buttons": [\n' +
                         '                {\n' +
                         '                  "textButton": {\n' +
                         '                    "text": "View Build",\n' +
                         '                    "onClick": {\n' +
                         '                      "openLink": {\n' +
                         '                        "url": "{{ project.url }}/{{ build.number }}/"\n' +
                         '                      }\n' +
                         '                    }\n' +
                         '                  }\n' +
                         '                }\n' +
                         '              ]\n' +
                         '            }\n' +
                         '          ]\n' +
                         '        }\n' +
                         '      ]\n' +
                         '    }\n' +
                         '  ]\n' +
                         '}',
        default_options: {},
        example_data:    common_values.jenkins_example_data,
        event_types:     ['build_success'],
        render_engine:   'liquid'
    },

    /**
     * Jenkins: Build Failure Minimal
     */
    {
        service_type:    common_values.service_type_gchat,
        in_service_type: common_values.service_type_jenkins,
        name:            'Build Failure Minimal',
        content:         '{\n' +
                         '  "cards": [\n' +
                         '    {\n' +
                         '      "header": {\n' +
                         '        "title": "A build has Failed",\n' +
                         '        "subtitle": "{{ project.full_name }} #{{ build.number }}",\n' +
                         '        "imageUrl": "https://public.jc21.com/juxtapose/icons/jenkins.png",\n' +
                         '        "imageStyle": "IMAGE"\n' +
                         '      },\n' +
                         '      "sections": [\n' +
                         '        {\n' +
                         '          "widgets": [\n' +
                         '            {\n' +
                         '              "buttons": [\n' +
                         '                {\n' +
                         '                  "textButton": {\n' +
                         '                    "text": "View Build",\n' +
                         '                    "onClick": {\n' +
                         '                      "openLink": {\n' +
                         '                        "url": "{{ project.url }}/{{ build.number }}/"\n' +
                         '                      }\n' +
                         '                    }\n' +
                         '                  }\n' +
                         '                }\n' +
                         '              ]\n' +
                         '            }\n' +
                         '          ]\n' +
                         '        }\n' +
                         '      ]\n' +
                         '    }\n' +
                         '  ]\n' +
                         '}',
        default_options: {},
        example_data:    common_values.jenkins_example_data,
        event_types:     ['build_failure'],
        render_engine:   'liquid'
    },

    /**
     * Jenkins: Build Failure
     */
    {
        service_type:    common_values.service_type_gchat,
        in_service_type: common_values.service_type_jenkins,
        name:            'Build Failure',
        content:         '{\n' +
                         '  "cards": [\n' +
                         '    {\n' +
                         '      "header": {\n' +
                         '        "title": "A build has Failed",\n' +
                         '        "subtitle": "{{ project.full_name }} #{{ build.number }}",\n' +
                         '        "imageUrl": "https://public.jc21.com/juxtapose/icons/jenkins.png",\n' +
                         '        "imageStyle": "IMAGE"\n' +
                         '      },\n' +
                         '      "sections": [\n' +
                         '        {\n' +
                         '          "widgets": [\n' +
                         '            {\n' +
                         '              "keyValue": {\n' +
                         '                "topLabel": "Cause",\n' +
                         '                "content": "{{ build.cause | jsonescape }}"\n' +
                         '              }\n' +
                         '            },\n' +
                         '            {\n' +
                         '              "keyValue": {\n' +
                         '                "topLabel": "Duration",\n' +
                         '                "content": "{{ build.duration_string }}"\n' +
                         '              }\n' +
                         '            }\n' +
                         '          ]\n' +
                         '        },\n' +
                         '        {\n' +
                         '          "widgets": [\n' +
                         '            {\n' +
                         '              "buttons": [\n' +
                         '                {\n' +
                         '                  "textButton": {\n' +
                         '                    "text": "View Build",\n' +
                         '                    "onClick": {\n' +
                         '                      "openLink": {\n' +
                         '                        "url": "{{ project.url }}/{{ build.number }}/"\n' +
                         '                      }\n' +
                         '                    }\n' +
                         '                  }\n' +
                         '                }\n' +
                         '              ]\n' +
                         '            }\n' +
                         '          ]\n' +
                         '        }\n' +
                         '      ]\n' +
                         '    }\n' +
                         '  ]\n' +
                         '}',
        default_options: {},
        example_data:    common_values.jenkins_example_data,
        event_types:     ['build_failure'],
        render_engine:   'liquid'
    },

    /**
     * Jenkins: Build Failure Full
     */
    {
        service_type:    common_values.service_type_gchat,
        in_service_type: common_values.service_type_jenkins,
        name:            'Build Failure Full',
        content:         '{\n' +
                         '  "cards": [\n' +
                         '    {\n' +
                         '      "header": {\n' +
                         '        "title": "A build has Failed",\n' +
                         '        "subtitle": "{{ project.full_name }} #{{ build.number }}",\n' +
                         '        "imageUrl": "https://public.jc21.com/juxtapose/icons/jenkins.png",\n' +
                         '        "imageStyle": "IMAGE"\n' +
                         '      },\n' +
                         '      "sections": [\n' +
                         '        {\n' +
                         '          "widgets": [\n' +
                         '            {\n' +
                         '              "keyValue": {\n' +
                         '                "topLabel": "Cause",\n' +
                         '                "content": "{{ build.cause | jsonescape }}"\n' +
                         '              }\n' +
                         '            },\n' +
                         '            {\n' +
                         '              "keyValue": {\n' +
                         '                "topLabel": "Duration",\n' +
                         '                "content": "{{ build.duration_string }}"\n' +
                         '              }\n' +
                         '            }\n' +
                         '          ]\n' +
                         '        },\n' +
                         '        {\n' +
                         '          "widgets": [\n' +
                         '            {\n' +
                         '              "textParagraph": {\n' +
                         '                "text": "```{{ build.log | jsonescape }}```"\n' +
                         '              }\n' +
                         '            }\n' +
                         '          ]\n' +
                         '        },\n' +
                         '        {\n' +
                         '          "widgets": [\n' +
                         '            {\n' +
                         '              "buttons": [\n' +
                         '                {\n' +
                         '                  "textButton": {\n' +
                         '                    "text": "View Log",\n' +
                         '                    "onClick": {\n' +
                         '                      "openLink": {\n' +
                         '                        "url": "{{ project.url }}/{{ build.number }}/console"\n' +
                         '                      }\n' +
                         '                    }\n' +
                         '                  }\n' +
                         '                }\n' +
                         '              ]\n' +
                         '            }\n' +
                         '          ]\n' +
                         '        }\n' +
                         '      ]\n' +
                         '    }\n' +
                         '  ]\n' +
                         '}',
        default_options: {},
        example_data:    common_values.jenkins_example_data,
        event_types:     ['build_failure'],
        render_engine:   'liquid'
    },

    /**
     * Jenkins: Build Aborted Minimal
     */
    {
        service_type:    common_values.service_type_gchat,
        in_service_type: common_values.service_type_jenkins,
        name:            'Build Aborted Minimal',
        content:         '{\n' +
                         '  "cards": [\n' +
                         '    {\n' +
                         '      "header": {\n' +
                         '        "title": "A build was Aborted",\n' +
                         '        "subtitle": "{{ project.full_name }} #{{ build.number }}",\n' +
                         '        "imageUrl": "https://public.jc21.com/juxtapose/icons/jenkins.png",\n' +
                         '        "imageStyle": "IMAGE"\n' +
                         '      },\n' +
                         '      "sections": [\n' +
                         '        {\n' +
                         '          "widgets": [\n' +
                         '            {\n' +
                         '              "buttons": [\n' +
                         '                {\n' +
                         '                  "textButton": {\n' +
                         '                    "text": "View Build",\n' +
                         '                    "onClick": {\n' +
                         '                      "openLink": {\n' +
                         '                        "url": "{{ project.url }}/{{ build.number }}/"\n' +
                         '                      }\n' +
                         '                    }\n' +
                         '                  }\n' +
                         '                }\n' +
                         '              ]\n' +
                         '            }\n' +
                         '          ]\n' +
                         '        }\n' +
                         '      ]\n' +
                         '    }\n' +
                         '  ]\n' +
                         '}',
        default_options: {},
        example_data:    common_values.jenkins_example_data,
        event_types:     ['build_aborted'],
        render_engine:   'liquid'
    },

    /**
     * Jenkins: Build Aborted
     */
    {
        service_type:    common_values.service_type_gchat,
        in_service_type: common_values.service_type_jenkins,
        name:            'Build Aborted',
        content:         '{\n' +
                         '  "cards": [\n' +
                         '    {\n' +
                         '      "header": {\n' +
                         '        "title": "A build was Aborted",\n' +
                         '        "subtitle": "{{ project.full_name }} #{{ build.number }}",\n' +
                         '        "imageUrl": "https://public.jc21.com/juxtapose/icons/jenkins.png",\n' +
                         '        "imageStyle": "IMAGE"\n' +
                         '      },\n' +
                         '      "sections": [\n' +
                         '        {\n' +
                         '          "widgets": [\n' +
                         '            {\n' +
                         '              "keyValue": {\n' +
                         '                "topLabel": "Cause",\n' +
                         '                "content": "{{ build.cause | jsonescape }}"\n' +
                         '              }\n' +
                         '            },\n' +
                         '            {\n' +
                         '              "keyValue": {\n' +
                         '                "topLabel": "Duration",\n' +
                         '                "content": "{{ build.duration_string }}"\n' +
                         '              }\n' +
                         '            }\n' +
                         '          ]\n' +
                         '        },\n' +
                         '        {\n' +
                         '          "widgets": [\n' +
                         '            {\n' +
                         '              "buttons": [\n' +
                         '                {\n' +
                         '                  "textButton": {\n' +
                         '                    "text": "View Build",\n' +
                         '                    "onClick": {\n' +
                         '                      "openLink": {\n' +
                         '                        "url": "{{ project.url }}/{{ build.number }}/"\n' +
                         '                      }\n' +
                         '                    }\n' +
                         '                  }\n' +
                         '                }\n' +
                         '              ]\n' +
                         '            }\n' +
                         '          ]\n' +
                         '        }\n' +
                         '      ]\n' +
                         '    }\n' +
                         '  ]\n' +
                         '}',
        default_options: {},
        example_data:    common_values.jenkins_example_data,
        event_types:     ['build_aborted'],
        render_engine:   'liquid'
    },

    /**
     * Jenkins: Build Unstable Minimal
     */
    {
        service_type:    common_values.service_type_gchat,
        in_service_type: common_values.service_type_jenkins,
        name:            'Build Unstable Minimal',
        content:         '{\n' +
                         '  "cards": [\n' +
                         '    {\n' +
                         '      "header": {\n' +
                         '        "title": "A build is Unstable",\n' +
                         '        "subtitle": "{{ project.full_name }} #{{ build.number }}",\n' +
                         '        "imageUrl": "https://public.jc21.com/juxtapose/icons/jenkins.png",\n' +
                         '        "imageStyle": "IMAGE"\n' +
                         '      },\n' +
                         '      "sections": [\n' +
                         '        {\n' +
                         '          "widgets": [\n' +
                         '            {\n' +
                         '              "buttons": [\n' +
                         '                {\n' +
                         '                  "textButton": {\n' +
                         '                    "text": "View Build",\n' +
                         '                    "onClick": {\n' +
                         '                      "openLink": {\n' +
                         '                        "url": "{{ project.url }}/{{ build.number }}/"\n' +
                         '                      }\n' +
                         '                    }\n' +
                         '                  }\n' +
                         '                }\n' +
                         '              ]\n' +
                         '            }\n' +
                         '          ]\n' +
                         '        }\n' +
                         '      ]\n' +
                         '    }\n' +
                         '  ]\n' +
                         '}',
        default_options: {},
        example_data:    common_values.jenkins_example_data,
        event_types:     ['build_unstable'],
        render_engine:   'liquid'
    },

    /**
     * Jenkins: Build Unstable
     */
    {
        service_type:    common_values.service_type_gchat,
        in_service_type: common_values.service_type_jenkins,
        name:            'Build Unstable',
        content:         '{\n' +
                         '  "cards": [\n' +
                         '    {\n' +
                         '      "header": {\n' +
                         '        "title": "A build is Unstable",\n' +
                         '        "subtitle": "{{ project.full_name }} #{{ build.number }}",\n' +
                         '        "imageUrl": "https://public.jc21.com/juxtapose/icons/jenkins.png",\n' +
                         '        "imageStyle": "IMAGE"\n' +
                         '      },\n' +
                         '      "sections": [\n' +
                         '        {\n' +
                         '          "widgets": [\n' +
                         '            {\n' +
                         '              "keyValue": {\n' +
                         '                "topLabel": "Cause",\n' +
                         '                "content": "{{ build.cause | jsonescape }}"\n' +
                         '              }\n' +
                         '            },\n' +
                         '            {\n' +
                         '              "keyValue": {\n' +
                         '                "topLabel": "Duration",\n' +
                         '                "content": "{{ build.duration_string }}"\n' +
                         '              }\n' +
                         '            }\n' +
                         '          ]\n' +
                         '        },\n' +
                         '        {\n' +
                         '          "widgets": [\n' +
                         '            {\n' +
                         '              "buttons": [\n' +
                         '                {\n' +
                         '                  "textButton": {\n' +
                         '                    "text": "View Build",\n' +
                         '                    "onClick": {\n' +
                         '                      "openLink": {\n' +
                         '                        "url": "{{ project.url }}/{{ build.number }}/"\n' +
                         '                      }\n' +
                         '                    }\n' +
                         '                  }\n' +
                         '                }\n' +
                         '              ]\n' +
                         '            }\n' +
                         '          ]\n' +
                         '        }\n' +
                         '      ]\n' +
                         '    }\n' +
                         '  ]\n' +
                         '}',
        default_options: {},
        example_data:    common_values.jenkins_example_data,
        event_types:     ['build_unstable'],
        render_engine:   'liquid'
    },

    /**
     * Jenkins: Build Unstable Full
     */
    {
        service_type:    common_values.service_type_gchat,
        in_service_type: common_values.service_type_jenkins,
        name:            'Build Unstable Full',
        content:         '{\n' +
                         '  "cards": [\n' +
                         '    {\n' +
                         '      "header": {\n' +
                         '        "title": "A build is Unstable",\n' +
                         '        "subtitle": "{{ project.full_name }} #{{ build.number }}",\n' +
                         '        "imageUrl": "https://public.jc21.com/juxtapose/icons/jenkins.png",\n' +
                         '        "imageStyle": "IMAGE"\n' +
                         '      },\n' +
                         '      "sections": [\n' +
                         '        {\n' +
                         '          "widgets": [\n' +
                         '            {\n' +
                         '              "keyValue": {\n' +
                         '                "topLabel": "Cause",\n' +
                         '                "content": "{{ build.cause | jsonescape }}"\n' +
                         '              }\n' +
                         '            },\n' +
                         '            {\n' +
                         '              "keyValue": {\n' +
                         '                "topLabel": "Duration",\n' +
                         '                "content": "{{ build.duration_string }}"\n' +
                         '              }\n' +
                         '            }\n' +
                         '          ]\n' +
                         '        },\n' +
                         '        {\n' +
                         '          "widgets": [\n' +
                         '            {\n' +
                         '              "textParagraph": {\n' +
                         '                "text": "```{{ build.log | jsonescape }}```"\n' +
                         '              }\n' +
                         '            }\n' +
                         '          ]\n' +
                         '        },\n' +
                         '        {\n' +
                         '          "widgets": [\n' +
                         '            {\n' +
                         '              "buttons": [\n' +
                         '                {\n' +
                         '                  "textButton": {\n' +
                         '                    "text": "View Log",\n' +
                         '                    "onClick": {\n' +
                         '                      "openLink": {\n' +
                         '                        "url": "{{ project.url }}/{{ build.number }}/console"\n' +
                         '                      }\n' +
                         '                    }\n' +
                         '                  }\n' +
                         '                }\n' +
                         '              ]\n' +
                         '            }\n' +
                         '          ]\n' +
                         '        }\n' +
                         '      ]\n' +
                         '    }\n' +
                         '  ]\n' +
                         '}',
        default_options: {},
        example_data:    common_values.jenkins_example_data,
        event_types:     ['build_unstable'],
        render_engine:   'liquid'
    },

    /**
     * Jenkins: Build Regressed Minimal
     */
    {
        service_type:    common_values.service_type_gchat,
        in_service_type: common_values.service_type_jenkins,
        name:            'Build Regressed Minimal',
        content:         '{\n' +
                         '  "cards": [\n' +
                         '    {\n' +
                         '      "header": {\n' +
                         '        "title": "A build has Regressed",\n' +
                         '        "subtitle": "{{ project.full_name }} #{{ build.number }}",\n' +
                         '        "imageUrl": "https://public.jc21.com/juxtapose/icons/jenkins.png",\n' +
                         '        "imageStyle": "IMAGE"\n' +
                         '      },\n' +
                         '      "sections": [\n' +
                         '        {\n' +
                         '          "widgets": [\n' +
                         '            {\n' +
                         '              "buttons": [\n' +
                         '                {\n' +
                         '                  "textButton": {\n' +
                         '                    "text": "View Build",\n' +
                         '                    "onClick": {\n' +
                         '                      "openLink": {\n' +
                         '                        "url": "{{ project.url }}/{{ build.number }}/"\n' +
                         '                      }\n' +
                         '                    }\n' +
                         '                  }\n' +
                         '                }\n' +
                         '              ]\n' +
                         '            }\n' +
                         '          ]\n' +
                         '        }\n' +
                         '      ]\n' +
                         '    }\n' +
                         '  ]\n' +
                         '}',
        default_options: {},
        example_data:    common_values.jenkins_example_data,
        event_types:     ['build_regression'],
        render_engine:   'liquid'
    },

    /**
     * Jenkins: Build Regressed
     */
    {
        service_type:    common_values.service_type_gchat,
        in_service_type: common_values.service_type_jenkins,
        name:            'Build Regressed',
        content:         '{\n' +
                         '  "cards": [\n' +
                         '    {\n' +
                         '      "header": {\n' +
                         '        "title": "A build has Regressed",\n' +
                         '        "subtitle": "{{ project.full_name }} #{{ build.number }}",\n' +
                         '        "imageUrl": "https://public.jc21.com/juxtapose/icons/jenkins.png",\n' +
                         '        "imageStyle": "IMAGE"\n' +
                         '      },\n' +
                         '      "sections": [\n' +
                         '        {\n' +
                         '          "widgets": [\n' +
                         '            {\n' +
                         '              "keyValue": {\n' +
                         '                "topLabel": "Cause",\n' +
                         '                "content": "{{ build.cause | jsonescape }}"\n' +
                         '              }\n' +
                         '            },\n' +
                         '            {\n' +
                         '              "keyValue": {\n' +
                         '                "topLabel": "Duration",\n' +
                         '                "content": "{{ build.duration_string }}"\n' +
                         '              }\n' +
                         '            }\n' +
                         '          ]\n' +
                         '        },\n' +
                         '        {\n' +
                         '          "widgets": [\n' +
                         '            {\n' +
                         '              "buttons": [\n' +
                         '                {\n' +
                         '                  "textButton": {\n' +
                         '                    "text": "View Build",\n' +
                         '                    "onClick": {\n' +
                         '                      "openLink": {\n' +
                         '                        "url": "{{ project.url }}/{{ build.number }}/"\n' +
                         '                      }\n' +
                         '                    }\n' +
                         '                  }\n' +
                         '                }\n' +
                         '              ]\n' +
                         '            }\n' +
                         '          ]\n' +
                         '        }\n' +
                         '      ]\n' +
                         '    }\n' +
                         '  ]\n' +
                         '}',
        default_options: {},
        example_data:    common_values.jenkins_example_data,
        event_types:     ['build_regression'],
        render_engine:   'liquid'
    },

    /**
     * Jenkins: Build Regressed Full
     */
    {
        service_type:    common_values.service_type_gchat,
        in_service_type: common_values.service_type_jenkins,
        name:            'Build Regressed Full',
        content:         '{\n' +
                         '  "cards": [\n' +
                         '    {\n' +
                         '      "header": {\n' +
                         '        "title": "A build has Regressed",\n' +
                         '        "subtitle": "{{ project.full_name }} #{{ build.number }}",\n' +
                         '        "imageUrl": "https://public.jc21.com/juxtapose/icons/jenkins.png",\n' +
                         '        "imageStyle": "IMAGE"\n' +
                         '      },\n' +
                         '      "sections": [\n' +
                         '        {\n' +
                         '          "widgets": [\n' +
                         '            {\n' +
                         '              "keyValue": {\n' +
                         '                "topLabel": "Cause",\n' +
                         '                "content": "{{ build.cause | jsonescape }}"\n' +
                         '              }\n' +
                         '            },\n' +
                         '            {\n' +
                         '              "keyValue": {\n' +
                         '                "topLabel": "Duration",\n' +
                         '                "content": "{{ build.duration_string }}"\n' +
                         '              }\n' +
                         '            }\n' +
                         '          ]\n' +
                         '        },\n' +
                         '        {\n' +
                         '          "widgets": [\n' +
                         '            {\n' +
                         '              "textParagraph": {\n' +
                         '                "text": "```{{ build.log | jsonescape }}```"\n' +
                         '              }\n' +
                         '            }\n' +
                         '          ]\n' +
                         '        },\n' +
                         '        {\n' +
                         '          "widgets": [\n' +
                         '            {\n' +
                         '              "buttons": [\n' +
                         '                {\n' +
                         '                  "textButton": {\n' +
                         '                    "text": "View Log",\n' +
                         '                    "onClick": {\n' +
                         '                      "openLink": {\n' +
                         '                        "url": "{{ project.url }}/{{ build.number }}/console"\n' +
                         '                      }\n' +
                         '                    }\n' +
                         '                  }\n' +
                         '                }\n' +
                         '              ]\n' +
                         '            }\n' +
                         '          ]\n' +
                         '        }\n' +
                         '      ]\n' +
                         '    }\n' +
                         '  ]\n' +
                         '}',
        default_options: {},
        example_data:    common_values.jenkins_example_data,
        event_types:     ['build_regression'],
        render_engine:   'liquid'
    },

    /**
     * Jenkins: Build Changed Minimal
     */
    {
        service_type:    common_values.service_type_gchat,
        in_service_type: common_values.service_type_jenkins,
        name:            'Build Changed Minimal',
        content:         '{\n' +
                         '  "cards": [\n' +
                         '    {\n' +
                         '      "header": {\n' +
                         '        "title": "A build has Changed",\n' +
                         '        "subtitle": "{{ project.full_name }} #{{ build.number }}",\n' +
                         '        "imageUrl": "https://public.jc21.com/juxtapose/icons/jenkins.png",\n' +
                         '        "imageStyle": "IMAGE"\n' +
                         '      },\n' +
                         '      "sections": [\n' +
                         '        {\n' +
                         '          "widgets": [\n' +
                         '            {\n' +
                         '              "buttons": [\n' +
                         '                {\n' +
                         '                  "textButton": {\n' +
                         '                    "text": "View Build",\n' +
                         '                    "onClick": {\n' +
                         '                      "openLink": {\n' +
                         '                        "url": "{{ project.url }}/{{ build.number }}/"\n' +
                         '                      }\n' +
                         '                    }\n' +
                         '                  }\n' +
                         '                }\n' +
                         '              ]\n' +
                         '            }\n' +
                         '          ]\n' +
                         '        }\n' +
                         '      ]\n' +
                         '    }\n' +
                         '  ]\n' +
                         '}',
        default_options: {},
        example_data:    common_values.jenkins_example_data,
        event_types:     ['build_changed'],
        render_engine:   'liquid'
    },

    /**
     * Jenkins: Build Changed
     */
    {
        service_type:    common_values.service_type_gchat,
        in_service_type: common_values.service_type_jenkins,
        name:            'Build Changed',
        content:         '{\n' +
                         '  "cards": [\n' +
                         '    {\n' +
                         '      "header": {\n' +
                         '        "title": "A build has Changed",\n' +
                         '        "subtitle": "{{ project.full_name }} #{{ build.number }}",\n' +
                         '        "imageUrl": "https://public.jc21.com/juxtapose/icons/jenkins.png",\n' +
                         '        "imageStyle": "IMAGE"\n' +
                         '      },\n' +
                         '      "sections": [\n' +
                         '        {\n' +
                         '          "widgets": [\n' +
                         '            {\n' +
                         '              "keyValue": {\n' +
                         '                "topLabel": "Cause",\n' +
                         '                "content": "{{ build.cause | jsonescape }}"\n' +
                         '              }\n' +
                         '            },\n' +
                         '            {\n' +
                         '              "keyValue": {\n' +
                         '                "topLabel": "Duration",\n' +
                         '                "content": "{{ build.duration_string }}"\n' +
                         '              }\n' +
                         '            }\n' +
                         '          ]\n' +
                         '        },\n' +
                         '        {\n' +
                         '          "widgets": [\n' +
                         '            {\n' +
                         '              "buttons": [\n' +
                         '                {\n' +
                         '                  "textButton": {\n' +
                         '                    "text": "View Build",\n' +
                         '                    "onClick": {\n' +
                         '                      "openLink": {\n' +
                         '                        "url": "{{ project.url }}/{{ build.number }}/"\n' +
                         '                      }\n' +
                         '                    }\n' +
                         '                  }\n' +
                         '                }\n' +
                         '              ]\n' +
                         '            }\n' +
                         '          ]\n' +
                         '        }\n' +
                         '      ]\n' +
                         '    }\n' +
                         '  ]\n' +
                         '}',
        default_options: {},
        example_data:    common_values.jenkins_example_data,
        event_types:     ['build_changed'],
        render_engine:   'liquid'
    },

    /**
     * Jenkins: Build Fixed Minimal
     */
    {
        service_type:    common_values.service_type_gchat,
        in_service_type: common_values.service_type_jenkins,
        name:            'Build Fixed Minimal',
        content:         '{\n' +
                         '  "cards": [\n' +
                         '    {\n' +
                         '      "header": {\n' +
                         '        "title": "A build has Succeeded",\n' +
                         '        "subtitle": "{{ project.full_name }} #{{ build.number }}",\n' +
                         '        "imageUrl": "https://public.jc21.com/juxtapose/icons/jenkins.png",\n' +
                         '        "imageStyle": "IMAGE"\n' +
                         '      },\n' +
                         '      "sections": [\n' +
                         '        {\n' +
                         '          "widgets": [\n' +
                         '            {\n' +
                         '              "buttons": [\n' +
                         '                {\n' +
                         '                  "textButton": {\n' +
                         '                    "text": "View Build",\n' +
                         '                    "onClick": {\n' +
                         '                      "openLink": {\n' +
                         '                        "url": "{{ project.url }}/{{ build.number }}/"\n' +
                         '                      }\n' +
                         '                    }\n' +
                         '                  }\n' +
                         '                }\n' +
                         '              ]\n' +
                         '            }\n' +
                         '          ]\n' +
                         '        }\n' +
                         '      ]\n' +
                         '    }\n' +
                         '  ]\n' +
                         '}',
        default_options: {},
        example_data:    common_values.jenkins_example_data,
        event_types:     ['build_fixed'],
        render_engine:   'liquid'
    },

    /**
     * Jenkins: Build Fixed
     */
    {
        service_type:    common_values.service_type_gchat,
        in_service_type: common_values.service_type_jenkins,
        name:            'Build Fixed',
        content:         '{\n' +
                         '  "cards": [\n' +
                         '    {\n' +
                         '      "header": {\n' +
                         '        "title": "A build is Fixed",\n' +
                         '        "subtitle": "{{ project.full_name }} #{{ build.number }}",\n' +
                         '        "imageUrl": "https://public.jc21.com/juxtapose/icons/jenkins.png",\n' +
                         '        "imageStyle": "IMAGE"\n' +
                         '      },\n' +
                         '      "sections": [\n' +
                         '        {\n' +
                         '          "widgets": [\n' +
                         '            {\n' +
                         '              "keyValue": {\n' +
                         '                "topLabel": "Cause",\n' +
                         '                "content": "{{ build.cause | jsonescape }}"\n' +
                         '              }\n' +
                         '            },\n' +
                         '            {\n' +
                         '              "keyValue": {\n' +
                         '                "topLabel": "Duration",\n' +
                         '                "content": "{{ build.duration_string }}"\n' +
                         '              }\n' +
                         '            }\n' +
                         '          ]\n' +
                         '        },\n' +
                         '        {\n' +
                         '          "widgets": [\n' +
                         '            {\n' +
                         '              "buttons": [\n' +
                         '                {\n' +
                         '                  "textButton": {\n' +
                         '                    "text": "View Build",\n' +
                         '                    "onClick": {\n' +
                         '                      "openLink": {\n' +
                         '                        "url": "{{ project.url }}/{{ build.number }}/"\n' +
                         '                      }\n' +
                         '                    }\n' +
                         '                  }\n' +
                         '                }\n' +
                         '              ]\n' +
                         '            }\n' +
                         '          ]\n' +
                         '        }\n' +
                         '      ]\n' +
                         '    }\n' +
                         '  ]\n' +
                         '}',
        default_options: {},
        example_data:    common_values.jenkins_example_data,
        event_types:     ['build_fixed'],
        render_engine:   'liquid'
    },

    /**
     * Dockerhub: Repo Updated
     */
    {
        service_type:    common_values.service_type_gchat,
        in_service_type: common_values.service_type_dockerhub,
        name:            'Repo Updated',
        content:         '{\n' +
                         '  "cards": [\n' +
                         '    {\n' +
                         '      "header": {\n' +
                         '        "title": "Repository updated by {{ pusher }}",\n' +
                         '        "subtitle": "{{ repo }}:{{ tag }}",\n' +
                         '        "imageUrl": "https://public.jc21.com/juxtapose/icons/dockerhub.png",\n' +
                         '        "imageStyle": "IMAGE"\n' +
                         '      },\n' +
                         '      "sections": [\n' +
                         '        {\n' +
                         '          "widgets": [\n' +
                         '            {\n' +
                         '              "buttons": [\n' +
                         '                {\n' +
                         '                  "textButton": {\n' +
                         '                    "text": "View",\n' +
                         '                    "onClick": {\n' +
                         '                      "openLink": {\n' +
                         '                        "url": "{{ url }}"\n' +
                         '                      }\n' +
                         '                    }\n' +
                         '                  }\n' +
                         '                }\n' +
                         '              ]\n' +
                         '            }\n' +
                         '          ]\n' +
                         '        }\n' +
                         '      ]\n' +
                         '    }\n' +
                         '  ]\n' +
                         '}',
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
            comment_count: 0
        },
        event_types:     ['repo_updated'],
        render_engine:   'liquid'
    },

    /**
     * Zendesk: A Ticket is assigned to you
     */
    {
        service_type:    common_values.service_type_gchat,
        in_service_type: common_values.service_type_zendesk,
        name:            'A Ticket is assigned to you',
        content:         '{\n' +
                         '  "cards": [\n' +
                         '    {\n' +
                         '      "header": {\n' +
                         '        "title": "Ticket assigned by {{ current_user.name }}",\n' +
                         '        "subtitle": "{{ ticket.status }} - {{ ticket.priority | default: "None" }}",\n' +
                         '        "imageUrl": "{{ current_user.gravatar }}",\n' +
                         '        "imageStyle": "AVATAR"\n' +
                         '      },\n' +
                         '      "sections": [\n' +
                         '        {\n' +
                         '          "widgets": [\n' +
                         '            {\n' +
                         '              "textParagraph": {\n' +
                         '                "text": "{{ ticket.title | jsonescape }}"\n' +
                         '              }\n' +
                         '            }\n' +
                         '          ]\n' +
                         '        },\n' +
                         '        {\n' +
                         '          "widgets": [\n' +
                         '            {\n' +
                         '              "buttons": [\n' +
                         '                {\n' +
                         '                  "textButton": {\n' +
                         '                    "text": "View Ticket #{{ ticket.id }}",\n' +
                         '                    "onClick": {\n' +
                         '                      "openLink": {\n' +
                         '                        "url": "{{ ticket.link }}"\n' +
                         '                      }\n' +
                         '                    }\n' +
                         '                  }\n' +
                         '                }\n' +
                         '              ]\n' +
                         '            }\n' +
                         '          ]\n' +
                         '        }\n' +
                         '      ]\n' +
                         '    }\n' +
                         '  ]\n' +
                         '}',
        default_options: {},
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
        service_type:    common_values.service_type_gchat,
        in_service_type: common_values.service_type_zendesk,
        name:            'A Ticket is updated',
        content:         '{\n' +
                         '  "cards": [\n' +
                         '    {\n' +
                         '      "header": {\n' +
                         '        "title": "Ticket updated by {{ current_user.name }}",\n' +
                         '        "subtitle": "{{ ticket.status }} - {{ ticket.priority }}",\n' +
                         '        "imageUrl": "{{ current_user.gravatar }}",\n' +
                         '        "imageStyle": "AVATAR"\n' +
                         '      },\n' +
                         '      "sections": [\n' +
                         '        {\n' +
                         '          "widgets": [\n' +
                         '            {\n' +
                         '              "textParagraph": {\n' +
                         '                "text": "{{ ticket.title | jsonescape }}"\n' +
                         '              }\n' +
                         '            }\n' +
                         '          ]\n' +
                         '        },\n' +
                         '        {\n' +
                         '          "widgets": [\n' +
                         '            {\n' +
                         '              "buttons": [\n' +
                         '                {\n' +
                         '                  "textButton": {\n' +
                         '                    "text": "View Ticket",\n' +
                         '                    "onClick": {\n' +
                         '                      "openLink": {\n' +
                         '                        "url": "{{ ticket.link }}"\n' +
                         '                      }\n' +
                         '                    }\n' +
                         '                  }\n' +
                         '                }\n' +
                         '              ]\n' +
                         '            }\n' +
                         '          ]\n' +
                         '        }\n' +
                         '      ]\n' +
                         '    }\n' +
                         '  ]\n' +
                         '}',
        default_options: {},
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
        service_type:    common_values.service_type_gchat,
        in_service_type: common_values.service_type_zendesk,
        name:            'A Ticket is re-assigned',
        content:         '{\n' +
                         '  "cards": [\n' +
                         '    {\n' +
                         '      "header": {\n' +
                         '        "title": "Ticket re-assigned by {{ current_user.name }}",\n' +
                         '        "subtitle": "{{ ticket.status }} - {{ ticket.priority | default: \\"None\\" }}",\n' +
                         '        "imageUrl": "{{ current_user.gravatar }}",\n' +
                         '        "imageStyle": "AVATAR"\n' +
                         '      },\n' +
                         '      "sections": [\n' +
                         '        {\n' +
                         '          "widgets": [\n' +
                         '            {\n' +
                         '              "textParagraph": {\n' +
                         '                "text": "{{ ticket.title | jsonescape }}"\n' +
                         '              }\n' +
                         '            }\n' +
                         '          ]\n' +
                         '        },\n' +
                         '        {\n' +
                         '          "widgets": [\n' +
                         '            {\n' +
                         '              "keyValue": {\n' +
                         '                "topLabel": "New Assignee",\n' +
                         '                "content": "{{ ticket.assignee.name | jsonescape }}"\n' +
                         '              }\n' +
                         '            }\n' +
                         '          ]\n' +
                         '        },\n' +
                         '        {\n' +
                         '          "widgets": [\n' +
                         '            {\n' +
                         '              "buttons": [\n' +
                         '                {\n' +
                         '                  "textButton": {\n' +
                         '                    "text": "View Ticket #{{ ticket.id }}",\n' +
                         '                    "onClick": {\n' +
                         '                      "openLink": {\n' +
                         '                        "url": "{{ ticket.link }}"\n' +
                         '                      }\n' +
                         '                    }\n' +
                         '                  }\n' +
                         '                }\n' +
                         '              ]\n' +
                         '            }\n' +
                         '          ]\n' +
                         '        }\n' +
                         '      ]\n' +
                         '    }\n' +
                         '  ]\n' +
                         '}',
        default_options: {},
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
        service_type:    common_values.service_type_gchat,
        in_service_type: common_values.service_type_zendesk,
        name:            'A comments is made on a Ticket',
        content:         '{\n' +
                         '  "cards": [\n' +
                         '    {\n' +
                         '      "header": {\n' +
                         '        "title": "Commented by {{ ticket.latest_comment.author_name | jsonescape }}",\n' +
                         '        "subtitle": "{{ ticket.status }} - {{ ticket.priority | default: \\"None\\" }}",\n' +
                         '        "imageUrl": "{{ ticket.latest_comment.author_gravatar }}",\n' +
                         '        "imageStyle": "AVATAR"\n' +
                         '      },\n' +
                         '      "sections": [\n' +
                         '        {\n' +
                         '          "widgets": [\n' +
                         '            {\n' +
                         '              "textParagraph": {\n' +
                         '                "text": "{{ ticket.latest_comment.value | jsonescape }}"\n' +
                         '              }\n' +
                         '            }\n' +
                         '          ]\n' +
                         '        },\n' +
                         '        {\n' +
                         '          "widgets": [\n' +
                         '            {\n' +
                         '              "buttons": [\n' +
                         '                {\n' +
                         '                  "textButton": {\n' +
                         '                    "text": "View Ticket #{{ ticket.id }}",\n' +
                         '                    "onClick": {\n' +
                         '                      "openLink": {\n' +
                         '                        "url": "{{ ticket.link }}"\n' +
                         '                      }\n' +
                         '                    }\n' +
                         '                  }\n' +
                         '                }\n' +
                         '              ]\n' +
                         '            }\n' +
                         '          ]\n' +
                         '        }\n' +
                         '      ]\n' +
                         '    }\n' +
                         '  ]\n' +
                         '}',
        default_options: {},
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
        service_type:    common_values.service_type_gchat,
        in_service_type: common_values.service_type_zendesk,
        name:            'A rating is made on your Ticket',
        content:         '{\n' +
                         '  "cards": [\n' +
                         '    {\n' +
                         '      "header": {\n' +
                         '        "title": "{{ ticket.requester.name }} rated rour ticket",\n' +
                         '        "subtitle": "{{ ticket.status }} - {{ ticket.priority | default: \\"None\\" }}",\n' +
                         '        "imageUrl": "{{ ticket.requester.gravatar }}",\n' +
                         '        "imageStyle": "AVATAR"\n' +
                         '      },\n' +
                         '      "sections": [\n' +
                         '        {\n' +
                         '          "widgets": [\n' +
                         '            {\n' +
                         '              "keyValue": {\n' +
                         '                "topLabel": "Rating",\n' +
                         '                "content": "{{ satisfaction.current_rating | jsonescape }}"\n' +
                         '              }\n' +
                         '            }{% if satisfaction.current_comment and satisfaction.current_comment != "" %},\n' +
                         '            {\n' +
                         '              "keyValue": {\n' +
                         '                "topLabel": "Comment",\n' +
                         '                "content": "{{ satisfaction.current_comment | jsonescape }}"\n' +
                         '              }\n' +
                         '            }{% endif %}\n' +
                         '          ]\n' +
                         '        },\n' +
                         '        {\n' +
                         '          "widgets": [\n' +
                         '            {\n' +
                         '              "buttons": [\n' +
                         '                {\n' +
                         '                  "textButton": {\n' +
                         '                    "text": "View Ticket #{{ ticket.id }}",\n' +
                         '                    "onClick": {\n' +
                         '                      "openLink": {\n' +
                         '                        "url": "{{ ticket.link }}"\n' +
                         '                      }\n' +
                         '                    }\n' +
                         '                  }\n' +
                         '                }\n' +
                         '              ]\n' +
                         '            }\n' +
                         '          ]\n' +
                         '        }\n' +
                         '      ]\n' +
                         '    }\n' +
                         '  ]\n' +
                         '}',
        default_options: {},
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
        event_types:     ['my_ticket_rated'],
        render_engine:   'liquid'
    },

    /**
     * Zendesk: Any Ticket is logged without an Assignee
     */
    {
        service_type:    common_values.service_type_gchat,
        in_service_type: common_values.service_type_zendesk,
        name:            'Any Ticket is logged without an Assignee',
        content:         '{\n' +
                         '  "cards": [\n' +
                         '    {\n' +
                         '      "header": {\n' +
                         '        "title": "{{ ticket.requester.name }} logged a ticket",\n' +
                         '        "subtitle": "{{ ticket.status }} - {{ ticket.priority | default: \\"None\\" }}",\n' +
                         '        "imageUrl": "{{ ticket.requester.gravatar }}",\n' +
                         '        "imageStyle": "AVATAR"\n' +
                         '      },\n' +
                         '      "sections": [\n' +
                         '        {\n' +
                         '          "widgets": [\n' +
                         '            {\n' +
                         '              "textParagraph": {\n' +
                         '                "text": "{{ ticket.title | jsonescape }}"\n' +
                         '              }\n' +
                         '            }\n' +
                         '          ]\n' +
                         '        },\n' +
                         '        {\n' +
                         '          "widgets": [\n' +
                         '            {\n' +
                         '              "keyValue": {\n' +
                         '                "topLabel": "Email",\n' +
                         '                "content": "{{ ticket.requester.email | jsonescape }}"\n' +
                         '              }\n' +
                         '            },\n' +
                         '            {\n' +
                         '              "keyValue": {\n' +
                         '                "topLabel": "Via",\n' +
                         '                "content": "{{ ticket.via | jsonescape }}"\n' +
                         '              }\n' +
                         '            },\n' +
                         '            {\n' +
                         '              "keyValue": {\n' +
                         '                "topLabel": "Group",\n' +
                         '                "content": "{{ ticket.group_name | jsonescape }}"\n' +
                         '              }\n' +
                         '            }\n' +
                         '          ]\n' +
                         '        },\n' +
                         '        {\n' +
                         '          "widgets": [\n' +
                         '            {\n' +
                         '              "buttons": [\n' +
                         '                {\n' +
                         '                  "textButton": {\n' +
                         '                    "text": "View Ticket #{{ ticket.id }}",\n' +
                         '                    "onClick": {\n' +
                         '                      "openLink": {\n' +
                         '                        "url": "{{ ticket.link }}"\n' +
                         '                      }\n' +
                         '                    }\n' +
                         '                  }\n' +
                         '                }\n' +
                         '              ]\n' +
                         '            }\n' +
                         '          ]\n' +
                         '        }\n' +
                         '      ]\n' +
                         '    }\n' +
                         '  ]\n' +
                         '}',
        default_options: {},
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
     * Zendesk: Any Ticket is rated
     */
    {
        service_type:    common_values.service_type_gchat,
        in_service_type: common_values.service_type_zendesk,
        name:            'Any Ticket is rated',
        content:         '{\n' +
                         '  "cards": [\n' +
                         '    {\n' +
                         '      "header": {\n' +
                         '        "title": "{{ ticket.requester.name }} rated a ticket",\n' +
                         '        "subtitle": "{{ ticket.status }} - {{ ticket.priority | default: \\"None\\" }}",\n' +
                         '        "imageUrl": "{{ ticket.requester.gravatar }}",\n' +
                         '        "imageStyle": "AVATAR"\n' +
                         '      },\n' +
                         '      "sections": [\n' +
                         '        {\n' +
                         '          "widgets": [\n' +
                         '            {\n' +
                         '              "keyValue": {\n' +
                         '                "topLabel": "Assignee",\n' +
                         '                "content": "{{ ticket.assignee.name | jsonescape }}"\n' +
                         '              }\n' +
                         '            },\n' +
                         '            {\n' +
                         '              "keyValue": {\n' +
                         '                "topLabel": "Rating",\n' +
                         '                "content": "{{ satisfaction.current_rating | jsonescape }}"\n' +
                         '              }\n' +
                         '            }{% if satisfaction.current_comment and satisfaction.current_comment != "" %},\n' +
                         '            {\n' +
                         '              "keyValue": {\n' +
                         '                "topLabel": "Comment",\n' +
                         '                "content": "{{ satisfaction.current_comment | jsonescape }}"\n' +
                         '              }\n' +
                         '            }{% endif %}\n' +
                         '          ]\n' +
                         '        },\n' +
                         '        {\n' +
                         '          "widgets": [\n' +
                         '            {\n' +
                         '              "buttons": [\n' +
                         '                {\n' +
                         '                  "textButton": {\n' +
                         '                    "text": "View Ticket #{{ ticket.id }}",\n' +
                         '                    "onClick": {\n' +
                         '                      "openLink": {\n' +
                         '                        "url": "{{ ticket.link }}"\n' +
                         '                      }\n' +
                         '                    }\n' +
                         '                  }\n' +
                         '                }\n' +
                         '              ]\n' +
                         '            }\n' +
                         '          ]\n' +
                         '        }\n' +
                         '      ]\n' +
                         '    }\n' +
                         '  ]\n' +
                         '}',
        default_options: {},
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
    },

    /**
     * Bitbucket: PR Merged
     */
    {
        service_type:    common_values.service_type_gchat,
        in_service_type: common_values.service_type_bitbucket,
        name:            'PR Merged',
        content:         '{\n' +
                         '  "cards": [\n' +
                         '    {\n' +
                         '      "header": {\n' +
                         '        "title": "{{ user }} merged a PR",\n' +
                         '        "subtitle": "{{ project }} / {{ repo }} / {{ branch }}",\n' +
                         '        "imageUrl": "{{ user_gravatar }}",\n' +
                         '        "imageStyle": "AVATAR"\n' +
                         '      },\n' +
                         '      "sections": [\n' +
                         '        {\n' +
                         '          "widgets": [\n' +
                         '            {\n' +
                         '              "textParagraph": {\n' +
                         '                "text": "{{ title | jsonescape }}"\n' +
                         '              }\n' +
                         '            }\n' +
                         '          ]\n' +
                         '        },\n' +
                         '        {\n' +
                         '          "widgets": [\n' +
                         '            {\n' +
                         '              "buttons": [\n' +
                         '                {\n' +
                         '                  "textButton": {\n' +
                         '                    "text": "View PR",\n' +
                         '                    "onClick": {\n' +
                         '                      "openLink": {\n' +
                         '                        "url": "{{ prurl }}"\n' +
                         '                      }\n' +
                         '                    }\n' +
                         '                  }\n' +
                         '                }\n' +
                         '              ]\n' +
                         '            }\n' +
                         '          ]\n' +
                         '        }\n' +
                         '      ]\n' +
                         '    }\n' +
                         '  ]\n' +
                         '}',
        default_options: {},
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
        service_type:    common_values.service_type_gchat,
        in_service_type: common_values.service_type_bitbucket,
        name:            'Your PR was Declined',
        content:         '{\n' +
                         '  "cards": [\n' +
                         '    {\n' +
                         '      "header": {\n' +
                         '        "title": "{{ user }}: PR Declined",\n' +
                         '        "subtitle": "{{ project }} / {{ repo }} / {{ branch }}",\n' +
                         '        "imageUrl": "{{ user_gravatar }}",\n' +
                         '        "imageStyle": "AVATAR"\n' +
                         '      },\n' +
                         '      "sections": [\n' +
                         '        {\n' +
                         '          "widgets": [\n' +
                         '            {\n' +
                         '              "textParagraph": {\n' +
                         '                "text": "{{ title | jsonescape }}"\n' +
                         '              }\n' +
                         '            }\n' +
                         '          ]\n' +
                         '        },\n' +
                         '        {\n' +
                         '          "widgets": [\n' +
                         '            {\n' +
                         '              "buttons": [\n' +
                         '                {\n' +
                         '                  "textButton": {\n' +
                         '                    "text": "View PR",\n' +
                         '                    "onClick": {\n' +
                         '                      "openLink": {\n' +
                         '                        "url": "{{ prurl }}"\n' +
                         '                      }\n' +
                         '                    }\n' +
                         '                  }\n' +
                         '                }\n' +
                         '              ]\n' +
                         '            }\n' +
                         '          ]\n' +
                         '        }\n' +
                         '      ]\n' +
                         '    }\n' +
                         '  ]\n' +
                         '}',
        default_options: {},
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
     * Bitbucket: Your PR was Merged
     */
    {
        service_type:    common_values.service_type_gchat,
        in_service_type: common_values.service_type_bitbucket,
        name:            'Your PR was Merged',
        content:         '{\n' +
                         '  "cards": [\n' +
                         '    {\n' +
                         '      "header": {\n' +
                         '        "title": "{{ user }} merged your PR",\n' +
                         '        "subtitle": "{{ project }} / {{ repo }} / {{ branch }}",\n' +
                         '        "imageUrl": "{{ user_gravatar }}",\n' +
                         '        "imageStyle": "AVATAR"\n' +
                         '      },\n' +
                         '      "sections": [\n' +
                         '        {\n' +
                         '          "widgets": [\n' +
                         '            {\n' +
                         '              "textParagraph": {\n' +
                         '                "text": "{{ title | jsonescape }}"\n' +
                         '              }\n' +
                         '            }\n' +
                         '          ]\n' +
                         '        },\n' +
                         '        {\n' +
                         '          "widgets": [\n' +
                         '            {\n' +
                         '              "buttons": [\n' +
                         '                {\n' +
                         '                  "textButton": {\n' +
                         '                    "text": "View PR",\n' +
                         '                    "onClick": {\n' +
                         '                      "openLink": {\n' +
                         '                        "url": "{{ prurl }}"\n' +
                         '                      }\n' +
                         '                    }\n' +
                         '                  }\n' +
                         '                }\n' +
                         '              ]\n' +
                         '            }\n' +
                         '          ]\n' +
                         '        }\n' +
                         '      ]\n' +
                         '    }\n' +
                         '  ]\n' +
                         '}',
        default_options: {},
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
        event_types:     ['my_pr_merged'],
        render_engine:   'liquid'
    },

    /**
     * Bitbucket: Commented on your PR
     */
    {
        service_type:    common_values.service_type_gchat,
        in_service_type: common_values.service_type_bitbucket,
        name:            'Commented on your PR',
        content:         '{\n' +
                         '  "cards": [\n' +
                         '    {\n' +
                         '      "header": {\n' +
                         '        "title": "{{ comment.author }}: PR Comment",\n' +
                         '        "subtitle": "{{ project }} / {{ repo }} / {{ branch }}",\n' +
                         '        "imageUrl": "{{ comment.author_gravatar }}",\n' +
                         '        "imageStyle": "AVATAR"\n' +
                         '      },\n' +
                         '      "sections": [\n' +
                         '        {\n' +
                         '          "widgets": [\n' +
                         '            {\n' +
                         '              "textParagraph": {\n' +
                         '                "text": "{{ title | jsonescape }}"\n' +
                         '              }\n' +
                         '            }\n' +
                         '          ]\n' +
                         '        },\n' +
                         '        {\n' +
                         '          "widgets": [\n' +
                         '            {\n' +
                         '              "keyValue": {\n' +
                         '                "topLabel": "Comment",\n' +
                         '                "content": "{% if comment and comment.text %}{{ comment.text | jsonescape }}{% endif %}"\n' +
                         '              }\n' +
                         '            }\n' +
                         '          ]\n' +
                         '        },\n' +
                         '        {\n' +
                         '          "widgets": [\n' +
                         '            {\n' +
                         '              "buttons": [\n' +
                         '                {\n' +
                         '                  "textButton": {\n' +
                         '                    "text": "View PR",\n' +
                         '                    "onClick": {\n' +
                         '                      "openLink": {\n' +
                         '                        "url": "{{ prurl }}"\n' +
                         '                      }\n' +
                         '                    }\n' +
                         '                  }\n' +
                         '                }\n' +
                         '              ]\n' +
                         '            }\n' +
                         '          ]\n' +
                         '        }\n' +
                         '      ]\n' +
                         '    }\n' +
                         '  ]\n' +
                         '}',
        default_options: {},
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
        service_type:    common_values.service_type_gchat,
        in_service_type: common_values.service_type_bitbucket,
        name:            'PR Opened',
        content:         '{\n' +
                         '  "cards": [\n' +
                         '    {\n' +
                         '      "header": {\n' +
                         '        "title": "{{ owner }} has opened a PR",\n' +
                         '        "subtitle": "{{ project }} / {{ repo }} / {{ branch }}",\n' +
                         '        "imageUrl": "{{ owner_gravatar }}",\n' +
                         '        "imageStyle": "AVATAR"\n' +
                         '      },\n' +
                         '      "sections": [\n' +
                         '        {\n' +
                         '          "widgets": [\n' +
                         '            {\n' +
                         '              "textParagraph": {\n' +
                         '                "text": "{{ title | jsonescape }}"\n' +
                         '              }\n' +
                         '            }\n' +
                         '          ]\n' +
                         '        },\n' +
                         '        {\n' +
                         '          "widgets": [\n' +
                         '            {\n' +
                         '              "keyValue": {\n' +
                         '                "topLabel": "Source",\n' +
                         '                "content": "{{ from.project }} / {{ from.repo }} / {{ from.branch }}"\n' +
                         '              }\n' +
                         '            }\n' +
                         '          ]\n' +
                         '        },\n' +
                         '        {\n' +
                         '          "widgets": [\n' +
                         '            {\n' +
                         '              "buttons": [\n' +
                         '                {\n' +
                         '                  "textButton": {\n' +
                         '                    "text": "View PR",\n' +
                         '                    "onClick": {\n' +
                         '                      "openLink": {\n' +
                         '                        "url": "{{ prurl }}"\n' +
                         '                      }\n' +
                         '                    }\n' +
                         '                  }\n' +
                         '                }\n' +
                         '              ]\n' +
                         '            }\n' +
                         '          ]\n' +
                         '        }\n' +
                         '      ]\n' +
                         '    }\n' +
                         '  ]\n' +
                         '}',
        default_options: {},
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
        service_type:    common_values.service_type_gchat,
        in_service_type: common_values.service_type_bitbucket,
        name:            'Your PR was Approved',
        content:         '{\n' +
                         '  "cards": [\n' +
                         '    {\n' +
                         '      "header": {\n' +
                         '        "title": "{{ user }} has approved your PR",\n' +
                         '        "subtitle": "{{ project }} / {{ repo }} / {{ branch }}",\n' +
                         '        "imageUrl": "{{ user_gravatar }}",\n' +
                         '        "imageStyle": "AVATAR"\n' +
                         '      },\n' +
                         '      "sections": [\n' +
                         '        {\n' +
                         '          "widgets": [\n' +
                         '            {\n' +
                         '              "textParagraph": {\n' +
                         '                "text": "{{ title | jsonescape }}"\n' +
                         '              }\n' +
                         '            }\n' +
                         '          ]\n' +
                         '        },\n' +
                         '        {\n' +
                         '          "widgets": [\n' +
                         '            {\n' +
                         '              "keyValue": {\n' +
                         '                "topLabel": "Approvals",\n' +
                         '                "content": "{{ approval_count }}"\n' +
                         '              }\n' +
                         '            }\n' +
                         '          ]\n' +
                         '        },\n' +
                         '        {\n' +
                         '          "widgets": [\n' +
                         '            {\n' +
                         '              "buttons": [\n' +
                         '                {\n' +
                         '                  "textButton": {\n' +
                         '                    "text": "View PR",\n' +
                         '                    "onClick": {\n' +
                         '                      "openLink": {\n' +
                         '                        "url": "{{ prurl }}"\n' +
                         '                      }\n' +
                         '                    }\n' +
                         '                  }\n' +
                         '                }\n' +
                         '              ]\n' +
                         '            }\n' +
                         '          ]\n' +
                         '        }\n' +
                         '      ]\n' +
                         '    }\n' +
                         '  ]\n' +
                         '}',
        default_options: {},
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
        service_type:    common_values.service_type_gchat,
        in_service_type: common_values.service_type_bitbucket,
        name:            'Your PR was Deleted',
        content:         '{\n' +
                         '  "cards": [\n' +
                         '    {\n' +
                         '      "header": {\n' +
                         '        "title": "{{ user }} deleted your PR",\n' +
                         '        "subtitle": "{{ project }} / {{ repo }} / {{ branch }}",\n' +
                         '        "imageUrl": "{{ user_gravatar }}",\n' +
                         '        "imageStyle": "AVATAR"\n' +
                         '      },\n' +
                         '      "sections": [\n' +
                         '        {\n' +
                         '          "widgets": [\n' +
                         '            {\n' +
                         '              "textParagraph": {\n' +
                         '                "text": "{{ title | jsonescape }}"\n' +
                         '              }\n' +
                         '            }\n' +
                         '          ]\n' +
                         '        },\n' +
                         '        {\n' +
                         '          "widgets": [\n' +
                         '            {\n' +
                         '              "buttons": [\n' +
                         '                {\n' +
                         '                  "textButton": {\n' +
                         '                    "text": "View PR",\n' +
                         '                    "onClick": {\n' +
                         '                      "openLink": {\n' +
                         '                        "url": "{{ prurl }}"\n' +
                         '                      }\n' +
                         '                    }\n' +
                         '                  }\n' +
                         '                }\n' +
                         '              ]\n' +
                         '            }\n' +
                         '          ]\n' +
                         '        }\n' +
                         '      ]\n' +
                         '    }\n' +
                         '  ]\n' +
                         '}',
        default_options: {},
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
        service_type:    common_values.service_type_gchat,
        in_service_type: common_values.service_type_bitbucket,
        name:            'Your PR Needs Work',
        content:         '{\n' +
                         '  "cards": [\n' +
                         '    {\n' +
                         '      "header": {\n' +
                         '        "title": "{{ user }}: PR Needs Work",\n' +
                         '        "subtitle": "{{ project }} / {{ repo }} / {{ branch }}",\n' +
                         '        "imageUrl": "{{ user_gravatar }}",\n' +
                         '        "imageStyle": "AVATAR"\n' +
                         '      },\n' +
                         '      "sections": [\n' +
                         '        {\n' +
                         '          "widgets": [\n' +
                         '            {\n' +
                         '              "textParagraph": {\n' +
                         '                "text": "{{ title | jsonescape }}"\n' +
                         '              }\n' +
                         '            }\n' +
                         '          ]\n' +
                         '        },\n' +
                         '        {\n' +
                         '          "widgets": [\n' +
                         '            {\n' +
                         '              "buttons": [\n' +
                         '                {\n' +
                         '                  "textButton": {\n' +
                         '                    "text": "View PR",\n' +
                         '                    "onClick": {\n' +
                         '                      "openLink": {\n' +
                         '                        "url": "{{ prurl }}"\n' +
                         '                      }\n' +
                         '                    }\n' +
                         '                  }\n' +
                         '                }\n' +
                         '              ]\n' +
                         '            }\n' +
                         '          ]\n' +
                         '        }\n' +
                         '      ]\n' +
                         '    }\n' +
                         '  ]\n' +
                         '}',
        default_options: {},
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
