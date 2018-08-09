'use strict';

const _ = require('underscore');

/**
 * @returns {{content: string, default_options: {icon_url: string, panel_color: string}}}
 */
let getSlackDefaults = () => {
    return {
        content: JSON.stringify({
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
            icon_url:    'https://public.jc21.com/juxtapose/icons/jenkins.png',
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
                        title:      'A build has Succeeded',
                        subtitle:   '{{ project.full_name }} #{{ build.number }}',
                        imageUrl:   'https://public.jc21.com/juxtapose/icons/jenkins.png',
                        imageStyle: 'IMAGE'
                    },
                    sections: [
                        {
                            widgets: [
                                {
                                    keyValue: {
                                        topLabel: 'Cause',
                                        content:  '{{ build.cause | jsonescape }}'
                                    }
                                },
                                {
                                    keyValue: {
                                        topLabel: 'Duration',
                                        content:  '{{ build.duration_string }}'
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
                                                text:    'View Build',
                                                onClick: {
                                                    openLink: {
                                                        url: '{{ project.url }}/{{ build.number }}/'
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
        content:         'SUCCESS: {{ project.full_name }} #{{ build.number }}' + '\n' + '{{ project.url }}/{{ build.number }}/',
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
        }
    });
};
