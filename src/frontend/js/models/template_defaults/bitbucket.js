'use strict';

const _ = require('underscore');

/**
 * @returns {{content: string, default_options: {icon_url: string, panel_color: string}}}
 */
let getSlackDefaults = () => {
    return {
        content: JSON.stringify({
            icon_url:    '{{ icon_url }}',
            text:        '{{ owner }} has opened a PR',
            attachments: [
                {
                    title: '<{{ prurl }}|{{ title }}>',
                    color: '{{ panel_color }}'
                }
            ]
        }, null, 2),

        default_options: {
            icon_url:    'https://public.jc21.com/juxtapose/icons/orange.png',
            panel_color: '#ffbf00'
        }
    };
};

/**
 * @returns {{content: {}, default_options: {}}}
 */
let getGoogleChatDefaults = () => {
    return {
        content: JSON.stringify({
            cards: [
                {
                    header:   {
                        title:      '{{ owner }} has opened a PR',
                        subtitle:   '{{ project }} / {{ repo }} / {{ branch }}',
                        imageUrl:   '{{ owner_gravatar }}',
                        imageStyle: 'AVATAR'
                    },
                    sections: [
                        {
                            widgets: [
                                {
                                    textParagraph: {
                                        text: '{{ title | jsonescape }}'
                                    }
                                }
                            ]
                        },
                        {
                            widgets: [
                                {
                                    keyValue: {
                                        topLabel: 'Source',
                                        content:  '{{ from.project }} / {{ from.repo }} / {{ from.branch }}'
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
                                                text:    'View PR',
                                                onClick: {
                                                    openLink: {
                                                        url: '{{ prurl }}'
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
 * @returns {{content: string, default_options: {}}}
 */
let getOtherDefaults = () => {
    return {
        content:         '{{ user }} has opened a PR: {{ prurl }}',
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
    }

    return _.assign({}, specifics, {
        example_data: {
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
        }
    });
};
