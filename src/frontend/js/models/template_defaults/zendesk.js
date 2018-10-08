'use strict';

const _ = require('underscore');

/**
 * @returns {{content: string, default_options: {icon_url: string, panel_color: string}}}
 */
let getSlackDefaults = () => {
    return {
        content: JSON.stringify({
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
        }
    };
};

/**
 * @returns {{content: string, default_options: {}}}
 */
let getGoogleChatDefaults = () => {
    return {
        content: JSON.stringify({
            cards: [
                {
                    header:   {
                        title:      'Ticket assigned by {{ current_user.name }}',
                        subtitle:   '{{ ticket.status }} - {{ ticket.priority | default: "None" }}',
                        imageUrl:   '{{ current_user.gravatar }}',
                        imageStyle: 'AVATAR'
                    },
                    sections: [
                        {
                            widgets: [
                                {
                                    textParagraph: {
                                        text: '{{ ticket.title | jsonescape }}'
                                    }
                                }
                            ]
                        },
                        {
                            widgets: [
                                {
                                    buttons: [
                                        {
                                            textButton: {
                                                text:    'View Ticket #{{ ticket.id }}',
                                                onClick: {
                                                    openLink: {
                                                        url: '{{ ticket.link }}'
                                                    }
                                                }
                                            }
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ]
        }, null, 2),

        default_options: {}
    };
};

/**
 * @returns {object}
 */
let getPushoverDefaults = () => {
    return {
        content: JSON.stringify({
            title:   'Ticket #{{ ticket.id }}',
            message: 'Assigned to you by {{ current_user.name }}',
            url:     '{{ ticket.link }}'
        }, null, 2),

        default_options: {
            priority: 'normal',
            sound:    'default'
        }
    };
};

/**
 * @returns {{content: string, default_options: {}}}
 */
let getOtherDefaults = () => {
    return {
        content:         'Ticket #{{ ticket.id }} has been assigned to you by {{ current_user.name }}' + '\n' + '{{ ticket.link }}',
        default_options: {}
    };
};

/**
 * @param service_type
 */
module.exports = function (service_type) {
    let specifics = getOtherDefaults();

    switch (service_type) {
        case 'slack':
            specifics = getSlackDefaults();
            break;

        case 'gchat':
            specifics = getGoogleChatDefaults();
            break;

        case 'pushover':
            specifics = getPushoverDefaults();
            break;
    }

    return _.assign({}, specifics, {
        example_data: {
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
                gravatar: 'https://d105my0i9v4ibf.cloudfront.net/c/live/2.11.277-83f1b21/img/default-avatar.jpg'
            }
        }
    });
};
