'use strict';

const migrate_name     = 'zendesk_templates';
const logger           = require('../logger');
const batchflow        = require('batchflow');
const internalTemplate = require('../internal/template');

const common_values = {
    icon_url:             'https://public.jc21.com/juxtapose/icons/dark-green.png',
    service_type_slack:   'slack',
    service_type_zendesk: 'zendesk-webhook'
};

/**
 * Zendesk Templates
 *
 * @type {Array}
 */
const templates = [
    /**
     * Zendesk 1: A Ticket is assigned to you
     */
    {
        service_type:    common_values.service_type_slack,
        in_service_type: common_values.service_type_zendesk,
        name:            'A Ticket is assigned to you',
        content:         '{\n' +
                         '  "icon_url": "{{ icon_url }}",\n' +
                         '  "text": "Ticket <{{ ticket.link }}|#{{ ticket.id }}> has been assigned to you{% if current_user %} by {{ current_user.name }}{% endif %}",\n' +
                         '  "attachments": [\n' +
                         '    {\n' +
                         '      "color": "{{ panel_color }}",\n' +
                         '      "fields": [\n' +
                         '        {\n' +
                         '          "title": "<{{ ticket.link }}|{{ ticket.title }}>",\n' +
                         '          "value": "{{ ticket.requester.name }} ({{ ticket.requester.email }})"\n' +
                         '        },\n' +
                         '        {\n' +
                         '          "title": "Status",\n' +
                         '          "value": "{{ ticket.status }}",\n' +
                         '          "short": true\n' +
                         '        },\n' +
                         '        {\n' +
                         '          "title": "Priority",\n' +
                         '          "value": "{{ ticket.priority }}",\n' +
                         '          "short": true\n' +
                         '        }\n' +
                         '      ]\n' +
                         '    }\n' +
                         '  ]\n' +
                         '}',
        default_options: {
            icon_url:    common_values.icon_url,
            panel_color: '#18ce00'
        },
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
        service_type:    common_values.service_type_slack,
        in_service_type: common_values.service_type_zendesk,
        name:            'A Ticket assigned to you is updated',
        content:         '{\n' +
                         '  "icon_url": "{{ icon_url }}",\n' +
                         '  "text": "Ticket <{{ ticket.link }}|#{{ ticket.id }}> assigned to you has been updated by {{ current_user.name }}",\n' +
                         '  "attachments": [\n' +
                         '    {\n' +
                         '      "color": "{{ panel_color }}",\n' +
                         '      "fields": [\n' +
                         '        {\n' +
                         '          "title": "<{{ ticket.link }}|{{ ticket.title }}>",\n' +
                         '          "value": "{{ ticket.requester.name }} ({{ ticket.requester.email }})"\n' +
                         '        },\n' +
                         '        {\n' +
                         '          "title": "Status",\n' +
                         '          "value": "{{ ticket.status }}",\n' +
                         '          "short": true\n' +
                         '        },\n' +
                         '        {\n' +
                         '          "title": "Priority",\n' +
                         '          "value": "{{ ticket.priority | default: "None" }}",\n' +
                         '          "short": true\n' +
                         '        }\n' +
                         '      ]\n' +
                         '    }\n' +
                         '  ]\n' +
                         '}',
        default_options: {
            icon_url:    common_values.icon_url,
            panel_color: '#18ce00'
        },
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
        service_type:    common_values.service_type_slack,
        in_service_type: common_values.service_type_zendesk,
        name:            'A Ticket assigned to you is re-assigned',
        content:         '{\n' +
                         '  "icon_url": "{{ icon_url }}",\n' +
                         '  "text": "Ticket <{{ ticket.link }}|#{{ ticket.id }}> has been ra-assigned away from you by {{ current_user.name }}",\n' +
                         '  "attachments": [\n' +
                         '    {\n' +
                         '      "color": "{{ panel_color }}",\n' +
                         '      "fields": [\n' +
                         '        {\n' +
                         '          "title": "<{{ ticket.link }}|{{ ticket.title }}>",\n' +
                         '          "value": "{{ ticket.requester.name }} ({{ ticket.requester.email }})"\n' +
                         '        },\n' +
                         '        {\n' +
                         '          "title": "Status",\n' +
                         '          "value": "{{ ticket.status }}",\n' +
                         '          "short": true\n' +
                         '        },\n' +
                         '        {\n' +
                         '          "title": "New Assignee",\n' +
                         '          "value": "{% if ticket.assignee %}{{ ticket.assignee.name }}{% else %}Unassigned{% endif %}",\n' +
                         '          "short": true\n' +
                         '        }\n' +
                         '      ]\n' +
                         '    }\n' +
                         '  ]\n' +
                         '}',
        default_options: {
            icon_url:    common_values.icon_url,
            panel_color: '#18ce00'
        },
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
        service_type:    common_values.service_type_slack,
        in_service_type: common_values.service_type_zendesk,
        name:            'A comments is made on on your Ticket',
        content:         '{\n' +
                         '  "icon_url": "{{ icon_url }}",\n' +
                         '  "text": "A comment has been added to Ticket <{{ ticket.link }}|#{{ ticket.id }}>",\n' +
                         '  "attachments": [\n' +
                         '    {\n' +
                         '      "color": "{{ panel_color }}",\n' +
                         '      "fields": [\n' +
                         '        {\n' +
                         '          "title": "<{{ ticket.link }}|{{ ticket.title }}>",\n' +
                         '          "value": "{{ ticket.requester.name }} ({{ ticket.requester.email }})"\n' +
                         '        },\n' +
                         '        {\n' +
                         '          "title": "Public",\n' +
                         '          "value": "{% if ticket.latest_comment.is_public %}Yes{% else %}No{% endif %}",\n' +
                         '          "short": true\n' +
                         '        },\n' +
                         '        {\n' +
                         '          "title": "Comment",\n' +
                         '          "value": "{{ ticket.latest_comment.value }}"\n' +
                         '        }\n' +
                         '      ]\n' +
                         '    }\n' +
                         '  ]\n' +
                         '}',
        default_options: {
            icon_url:    common_values.icon_url,
            panel_color: '#ffb631'
        },
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
        service_type:    common_values.service_type_slack,
        in_service_type: common_values.service_type_zendesk,
        name:            'A rating is made on your Ticket',
        content:         '{\n' +
                         '  "icon_url": "{{ icon_url }}",\n' +
                         '  "text": "Your Ticket <{{ ticket.link }}|#{{ ticket.id }}> has been rated",\n' +
                         '  "attachments": [\n' +
                         '    {\n' +
                         '      "color": "{{ panel_color }}",\n' +
                         '      "fields": [\n' +
                         '        {\n' +
                         '          "title": "<{{ ticket.link }}|{{ ticket.title }}>",\n' +
                         '          "value": "{{ ticket.requester.name }} ({{ ticket.requester.email }})"\n' +
                         '        },\n' +
                         '        {\n' +
                         '          "title": "Rating",\n' +
                         '          "value": "{{ satisfaction.current_rating }}",\n' +
                         '          "short": true\n' +
                         '        }{% if satisfaction.current_comment %},\n' +
                         '        {\n' +
                         '          "title": "Comment",\n' +
                         '          "value": "{{ satisfaction.current_comment }}",\n' +
                         '          "short": true\n' +
                         '        }{% endif %}\n' +
                         '      ]\n' +
                         '    }\n' +
                         '  ]\n' +
                         '}',
        default_options: {
            icon_url:    common_values.icon_url,
            panel_color: '#e9ff31'
        },
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
                current_rating:  4,
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
        service_type:    common_values.service_type_slack,
        in_service_type: common_values.service_type_zendesk,
        name:            'Any Ticket is logged without an Assignee',
        content:         '{\n' +
                         '  "icon_url": "{{ icon_url }}",\n' +
                         '  "text": "Ticket <{{ ticket.link }}|#{{ ticket.id }}> has been logged",\n' +
                         '  "attachments": [\n' +
                         '    {\n' +
                         '      "color": "{{ panel_color }}",\n' +
                         '      "fields": [\n' +
                         '        {\n' +
                         '          "title": "<{{ ticket.link }}|{{ ticket.title }}>",\n' +
                         '          "value": "{{ ticket.requester.name }} ({{ ticket.requester.email }})"\n' +
                         '        },\n' +
                         '        {\n' +
                         '          "title": "Via",\n' +
                         '          "value": "{{ ticket.via }}",\n' +
                         '          "short": true\n' +
                         '        },\n' +
                         '        {\n' +
                         '          "title": "Group",\n' +
                         '          "value": "{{ ticket.group_name }}",\n' +
                         '          "short": true\n' +
                         '        }\n' +
                         '      ]\n' +
                         '    }\n' +
                         '  ]\n' +
                         '}',
        default_options: {
            icon_url:    common_values.icon_url,
            panel_color: '#00ce95'
        },
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
        service_type:    common_values.service_type_slack,
        in_service_type: common_values.service_type_zendesk,
        name:            'Any Ticket is rated',
        content:         '{\n' +
                         '  "icon_url": "{{ icon_url }}",\n' +
                         '  "text": "Ticket <{{ ticket.link }}|#{{ ticket.id }}> has been rated",\n' +
                         '  "attachments": [\n' +
                         '    {\n' +
                         '      "color": "{{ panel_color }}",\n' +
                         '      "fields": [\n' +
                         '        {\n' +
                         '          "title": "<{{ ticket.link }}|{{ ticket.title }}>",\n' +
                         '          "value": "{{ ticket.requester.name }} ({{ ticket.requester.email }})"\n' +
                         '        },\n' +
                         '        {\n' +
                         '          "title": "Rating",\n' +
                         '          "value": "{{ satisfaction.current_rating }}",\n' +
                         '          "short": true\n' +
                         '        }{% if satisfaction.current_comment %},\n' +
                         '        {\n' +
                         '          "title": "Comment",\n' +
                         '          "value": "{{ satisfaction.current_comment }}",\n' +
                         '          "short": true\n' +
                         '        }{% endif %}\n' +
                         '      ]\n' +
                         '    }\n' +
                         '  ]\n' +
                         '}',
        default_options: {
            icon_url:    common_values.icon_url,
            panel_color: '#e9ff31'
        },
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
