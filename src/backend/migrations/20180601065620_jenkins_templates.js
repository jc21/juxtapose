'use strict';

const migrate_name     = 'jenkins_templates';
const logger           = require('../logger').migrate;
const batchflow        = require('batchflow');
const internalTemplate = require('../internal/template');

const common_values = {
    icon_url_jenkins:      'https://public.jc21.com/juxtapose/icons/jenkins.png',
    service_type_slack:   'slack',
    service_type_jenkins: 'jenkins-webhook'
};

const example_data = {
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
    },
    timestamp: 1526602255
};

/**
 * Jenkins Templates
 *
 * @type {Array}
 */
const templates = [
    /**
     * 1: Build Success Minimal - slack
     */
    {
        service_type:    common_values.service_type_slack,
        in_service_type: common_values.service_type_jenkins,
        name:            'Build Success Minimal',
        content:         '{\n' +
                         '  "icon_url": "{{ icon_url }}",\n' +
                         '  "attachments": [\n' +
                         '    {\n' +
                         '      "color": "{{ panel_color }}",\n' +
                         '      "text": "SUCCESS: <{{ project.url }}{{ build.number }}/|{{ project.full_name }} #{{ build.number }}> - {{ build.cause }}"\n' +
                         '    }\n' +
                         '  ]\n' +
                         '}',
        default_options: {
            icon_url:    common_values.icon_url_jenkins,
            panel_color: '#18ce00'
        },
        example_data:    example_data,
        event_types:     ['build_success'],
        render_engine:   'liquid'
    },

    /**
     * 2: Build Success
     */
    {
        service_type:    common_values.service_type_slack,
        in_service_type: common_values.service_type_jenkins,
        name:            'Build Success',
        content:         '{\n' +
                         '  "icon_url": "{{ icon_url }}",\n' +
                         '  "text": "<{{ project.url }}{{ build.number }}/|{{ project.full_name }} #{{ build.number }}> SUCCEEDED",\n' +
                         '  "attachments": [\n' +
                         '    {\n' +
                         '      "color": "{{ panel_color }}",\n' +
                         '      "fields": [\n' +
                         '        {\n' +
                         '          "title": "Cause",\n' +
                         '          "value": "{{ build.cause | jsonescape }}",\n' +
                         '          "short": true\n' +
                         '        },\n' +
                         '        {\n' +
                         '          "title": "Duration",\n' +
                         '          "value": "{{ build.duration_string }}",\n' +
                         '          "short": true\n' +
                         '        }\n' +
                         '      ]\n' +
                         '    }\n' +
                         '  ]\n' +
                         '}',
        default_options: {
            icon_url:    common_values.icon_url_jenkins,
            panel_color: '#18ce00'
        },
        example_data:    example_data,
        event_types:     ['build_success'],
        render_engine:   'liquid'
    },

    /**
     * 3: Build Failure Minimal
     */
    {
        service_type:    common_values.service_type_slack,
        in_service_type: common_values.service_type_jenkins,
        name:            'Build Failure Minimal',
        content:         '{\n' +
                         '  "icon_url": "{{ icon_url }}",\n' +
                         '  "attachments": [\n' +
                         '    {\n' +
                         '      "color": "{{ panel_color }}",\n' +
                         '      "text": "FALURE: <{{ project.url }}{{ build.number }}/|{{ project.full_name }} #{{ build.number }}> - {{ build.cause }}"\n' +
                         '    }\n' +
                         '  ]\n' +
                         '}',
        default_options: {
            icon_url:    common_values.icon_url_jenkins,
            panel_color: '#b70000'
        },
        example_data:    example_data,
        event_types:     ['build_failure'],
        render_engine:   'liquid'
    },

    /**
     * 4: Build Failure
     */
    {
        service_type:    common_values.service_type_slack,
        in_service_type: common_values.service_type_jenkins,
        name:            'Build Failure',
        content:         '{\n' +
                         '  "icon_url": "{{ icon_url }}",\n' +
                         '  "text": "<{{ project.url }}{{ build.number }}/|{{ project.full_name }} #{{ build.number }}> has FAILED",\n' +
                         '  "attachments": [\n' +
                         '    {\n' +
                         '      "color": "{{ panel_color }}",\n' +
                         '      "fields": [\n' +
                         '        {\n' +
                         '          "title": "Cause",\n' +
                         '          "value": "{{ build.cause | jsonescape }}",\n' +
                         '          "short": true\n' +
                         '        },\n' +
                         '        {\n' +
                         '          "title": "Duration",\n' +
                         '          "value": "{{ build.duration_string }}",\n' +
                         '          "short": true\n' +
                         '        }\n' +
                         '      ]\n' +
                         '    }\n' +
                         '  ]\n' +
                         '}',
        default_options: {
            icon_url:    common_values.icon_url_jenkins,
            panel_color: '#b70000'
        },
        example_data:    example_data,
        event_types:     ['build_failure'],
        render_engine:   'liquid'
    },

    /**
     * 5: Build Failure Full
     */
    {
        service_type:    common_values.service_type_slack,
        in_service_type: common_values.service_type_jenkins,
        name:            'Build Failure Full',
        content:         '{\n' +
                         '  "icon_url": "{{ icon_url }}",\n' +
                         '  "text": "<{{ project.url }}{{ build.number }}/|{{ project.full_name }} #{{ build.number }}> has FAILED",\n' +
                         '  "attachments": [\n' +
                         '    {\n' +
                         '      "color": "{{ panel_color }}",\n' +
                         '      "fields": [\n' +
                         '        {\n' +
                         '          "title": "Cause",\n' +
                         '          "value": "{{ build.cause | jsonescape }}",\n' +
                         '          "short": true\n' +
                         '        },\n' +
                         '        {\n' +
                         '          "title": "Duration",\n' +
                         '          "value": "{{ build.duration_string | jsonescape }}",\n' +
                         '          "short": true\n' +
                         '        },\n' +
                         '        {\n' +
                         '          "title": "Log",\n' +
                         '          "value": "```{{ build.log | jsonescape }}```\\n<{{ project.url }}{{ build.number }}/console|View Log>"\n' +
                         '        }\n' +
                         '      ]\n' +
                         '    }\n' +
                         '  ]\n' +
                         '}',
        default_options: {
            icon_url:    common_values.icon_url_jenkins,
            panel_color: '#b70000'
        },
        example_data:    example_data,
        event_types:     ['build_failure'],
        render_engine:   'liquid'
    },

    /**
     * 6: Build Aborted Minimal
     */
    {
        service_type:    common_values.service_type_slack,
        in_service_type: common_values.service_type_jenkins,
        name:            'Build Aborted Minimal',
        content:         '{\n' +
                         '  "icon_url": "{{ icon_url }}",\n' +
                         '  "attachments": [\n' +
                         '    {\n' +
                         '      "color": "{{ panel_color }}",\n' +
                         '      "text": "ABORTED: <{{ project.url }}{{ build.number }}/|{{ project.full_name }} #{{ build.number }}> - {{ build.cause }}"\n' +
                         '    }\n' +
                         '  ]\n' +
                         '}',
        default_options: {
            icon_url:    common_values.icon_url_jenkins,
            panel_color: '#a0a0a0'
        },
        example_data:    example_data,
        event_types:     ['build_aborted'],
        render_engine:   'liquid'
    },

    /**
     * 7: Build Aborted
     */
    {
        service_type:    common_values.service_type_slack,
        in_service_type: common_values.service_type_jenkins,
        name:            'Build Aborted',
        content:         '{\n' +
                         '  "icon_url": "{{ icon_url }}",\n' +
                         '  "text": "<{{ project.url }}{{ build.number }}/|{{ project.full_name }} #{{ build.number }}> has been ABORTED",\n' +
                         '  "attachments": [\n' +
                         '    {\n' +
                         '      "color": "{{ panel_color }}",\n' +
                         '      "fields": [\n' +
                         '        {\n' +
                         '          "title": "Cause",\n' +
                         '          "value": "{{ build.cause | jsonescape }}",\n' +
                         '          "short": true\n' +
                         '        },\n' +
                         '        {\n' +
                         '          "title": "Duration",\n' +
                         '          "value": "{{ build.duration_string }}",\n' +
                         '          "short": true\n' +
                         '        }\n' +
                         '      ]\n' +
                         '    }\n' +
                         '  ]\n' +
                         '}',
        default_options: {
            icon_url:    common_values.icon_url_jenkins,
            panel_color: '#a0a0a0'
        },
        example_data:    example_data,
        event_types:     ['build_aborted'],
        render_engine:   'liquid'
    },

    /**
     * 8: Build Unstable Minimal
     */
    {
        service_type:    common_values.service_type_slack,
        in_service_type: common_values.service_type_jenkins,
        name:            'Build Unstable Minimal',
        content:         '{\n' +
                         '  "icon_url": "{{ icon_url }}",\n' +
                         '  "attachments": [\n' +
                         '    {\n' +
                         '      "color": "{{ panel_color }}",\n' +
                         '      "text": "UNSTABLE: <{{ project.url }}{{ build.number }}/|{{ project.full_name }} #{{ build.number }}> - {{ build.cause }}"\n' +
                         '    }\n' +
                         '  ]\n' +
                         '}',
        default_options: {
            icon_url:    common_values.icon_url_jenkins,
            panel_color: '#edae02'
        },
        example_data:    example_data,
        event_types:     ['build_unstable'],
        render_engine:   'liquid'
    },

    /**
     * 9: Build Unstable
     */
    {
        service_type:    common_values.service_type_slack,
        in_service_type: common_values.service_type_jenkins,
        name:            'Build Unstable',
        content:         '{\n' +
                         '  "icon_url": "{{ icon_url }}",\n' +
                         '  "text": "<{{ project.url }}{{ build.number }}/|{{ project.full_name }} #{{ build.number }}> has become UNSTABLE",\n' +
                         '  "attachments": [\n' +
                         '    {\n' +
                         '      "color": "{{ panel_color }}",\n' +
                         '      "fields": [\n' +
                         '        {\n' +
                         '          "title": "Cause",\n' +
                         '          "value": "{{ build.cause | jsonescape }}",\n' +
                         '          "short": true\n' +
                         '        },\n' +
                         '        {\n' +
                         '          "title": "Duration",\n' +
                         '          "value": "{{ build.duration_string }}",\n' +
                         '          "short": true\n' +
                         '        }\n' +
                         '      ]\n' +
                         '    }\n' +
                         '  ]\n' +
                         '}',
        default_options: {
            icon_url:    common_values.icon_url_jenkins,
            panel_color: '#edae02'
        },
        example_data:    example_data,
        event_types:     ['build_unstable'],
        render_engine:   'liquid'
    },


    /**
     * 9: Build Unstable Full
     */
    {
        service_type:    common_values.service_type_slack,
        in_service_type: common_values.service_type_jenkins,
        name:            'Build Unstable Full',
        content:         '{\n' +
                         '  "icon_url": "{{ icon_url }}",\n' +
                         '  "text": "<{{ project.url }}{{ build.number }}/|{{ project.full_name }} #{{ build.number }}> has become UNSTABLE",\n' +
                         '  "attachments": [\n' +
                         '    {\n' +
                         '      "color": "{{ panel_color }}",\n' +
                         '      "fields": [\n' +
                         '        {\n' +
                         '          "title": "Cause",\n' +
                         '          "value": "{{ build.cause | jsonescape }}",\n' +
                         '          "short": true\n' +
                         '        },\n' +
                         '        {\n' +
                         '          "title": "Duration",\n' +
                         '          "value": "{{ build.duration_string | jsonescape }}",\n' +
                         '          "short": true\n' +
                         '        },\n' +
                         '        {\n' +
                         '          "title": "Log",\n' +
                         '          "value": "```{{ build.log | jsonescape }}```\\n<{{ project.url }}{{ build.number }}/console|View Log>"\n' +
                         '        }\n' +
                         '      ]\n' +
                         '    }\n' +
                         '  ]\n' +
                         '}',
        default_options: {
            icon_url:    common_values.icon_url_jenkins,
            panel_color: '#edae02'
        },
        example_data:    example_data,
        event_types:     ['build_unstable'],
        render_engine:   'liquid'
    },

    /**
     * 10: Build Regression Minimal
     */
    {
        service_type:    common_values.service_type_slack,
        in_service_type: common_values.service_type_jenkins,
        name:            'Build Regression Minimal',
        content:         '{\n' +
                         '  "icon_url": "{{ icon_url }}",\n' +
                         '  "attachments": [\n' +
                         '    {\n' +
                         '      "color": "{{ panel_color }}",\n' +
                         '      "text": "REGRESSION: <{{ project.url }}{{ build.number }}/|{{ project.full_name }} #{{ build.number }}> - {{ build.cause }}"\n' +
                         '    }\n' +
                         '  ]\n' +
                         '}',
        default_options: {
            icon_url:    common_values.icon_url_jenkins,
            panel_color: '#42aabf'
        },
        example_data:    example_data,
        event_types:     ['build_regression'],
        render_engine:   'liquid'
    },

    /**
     * 11: Build Regression
     */
    {
        service_type:    common_values.service_type_slack,
        in_service_type: common_values.service_type_jenkins,
        name:            'Build Regression',
        content:         '{\n' +
                         '  "icon_url": "{{ icon_url }}",\n' +
                         '  "text": "<{{ project.url }}{{ build.number }}/|{{ project.full_name }} #{{ build.number }}> has REGRESSED",\n' +
                         '  "attachments": [\n' +
                         '    {\n' +
                         '      "color": "{{ panel_color }}",\n' +
                         '      "fields": [\n' +
                         '        {\n' +
                         '          "title": "Cause",\n' +
                         '          "value": "{{ build.cause | jsonescape }}",\n' +
                         '          "short": true\n' +
                         '        },\n' +
                         '        {\n' +
                         '          "title": "Duration",\n' +
                         '          "value": "{{ build.duration_string }}",\n' +
                         '          "short": true\n' +
                         '        }\n' +
                         '      ]\n' +
                         '    }\n' +
                         '  ]\n' +
                         '}',
        default_options: {
            icon_url:    common_values.icon_url_jenkins,
            panel_color: '#42aabf'
        },
        example_data:    example_data,
        event_types:     ['build_regression'],
        render_engine:   'liquid'
    },

    /**
     * 12: Build Regression Full
     */
    {
        service_type:    common_values.service_type_slack,
        in_service_type: common_values.service_type_jenkins,
        name:            'Build Regression Full',
        content:         '{\n' +
                         '  "icon_url": "{{ icon_url }}",\n' +
                         '  "text": "<{{ project.url }}{{ build.number }}/|{{ project.full_name }} #{{ build.number }}> has REGRESSED",\n' +
                         '  "attachments": [\n' +
                         '    {\n' +
                         '      "color": "{{ panel_color }}",\n' +
                         '      "fields": [\n' +
                         '        {\n' +
                         '          "title": "Cause",\n' +
                         '          "value": "{{ build.cause | jsonescape }}",\n' +
                         '          "short": true\n' +
                         '        },\n' +
                         '        {\n' +
                         '          "title": "Duration",\n' +
                         '          "value": "{{ build.duration_string | jsonescape }}",\n' +
                         '          "short": true\n' +
                         '        },\n' +
                         '        {\n' +
                         '          "title": "Log",\n' +
                         '          "value": "```{{ build.log | jsonescape }}```\\n<{{ project.url }}{{ build.number }}/console|View Log>"\n' +
                         '        }\n' +
                         '      ]\n' +
                         '    }\n' +
                         '  ]\n' +
                         '}',
        default_options: {
            icon_url:    common_values.icon_url_jenkins,
            panel_color: '#42aabf'
        },
        example_data:    example_data,
        event_types:     ['build_regression'],
        render_engine:   'liquid'
    },

    /**
     * 12: Build Result Changed Minimal
     */
    {
        service_type:    common_values.service_type_slack,
        in_service_type: common_values.service_type_jenkins,
        name:            'Build Result Changed Minimal',
        content:         '{\n' +
                         '  "icon_url": "{{ icon_url }}",\n' +
                         '  "attachments": [\n' +
                         '    {\n' +
                         '      "color": "{{ panel_color }}",\n' +
                         '      "text": "CHANGED: <{{ project.url }}{{ build.number }}/|{{ project.full_name }} #{{ build.number }}> - {{ build.cause }}"\n' +
                         '    }\n' +
                         '  ]\n' +
                         '}',
        default_options: {
            icon_url:    common_values.icon_url_jenkins,
            panel_color: '#0048ff'
        },
        example_data:    example_data,
        event_types:     ['build_changed'],
        render_engine:   'liquid'
    },

    /**
     * 13: Build Result Changed
     */
    {
        service_type:    common_values.service_type_slack,
        in_service_type: common_values.service_type_jenkins,
        name:            'Build Result Changed',
        content:         '{\n' +
                         '  "icon_url": "{{ icon_url }}",\n' +
                         '  "text": "<{{ project.url }}{{ build.number }}/|{{ project.full_name }} #{{ build.number }}> has CHANGED",\n' +
                         '  "attachments": [\n' +
                         '    {\n' +
                         '      "color": "{{ panel_color }}",\n' +
                         '      "fields": [\n' +
                         '        {\n' +
                         '          "title": "Cause",\n' +
                         '          "value": "{{ build.cause | jsonescape }}",\n' +
                         '          "short": true\n' +
                         '        },\n' +
                         '        {\n' +
                         '          "title": "Duration",\n' +
                         '          "value": "{{ build.duration_string }}",\n' +
                         '          "short": true\n' +
                         '        }\n' +
                         '      ]\n' +
                         '    }\n' +
                         '  ]\n' +
                         '}',
        default_options: {
            icon_url:    common_values.icon_url_jenkins,
            panel_color: '#0048ff'
        },
        example_data:    example_data,
        event_types:     ['build_changed'],
        render_engine:   'liquid'
    },

    /**
     * 14: Build Fixed Minimal
     */
    {
        service_type:    common_values.service_type_slack,
        in_service_type: common_values.service_type_jenkins,
        name:            'Build Fixed Minimal',
        content:         '{\n' +
                         '  "icon_url": "{{ icon_url }}",\n' +
                         '  "attachments": [\n' +
                         '    {\n' +
                         '      "color": "{{ panel_color }}",\n' +
                         '      "text": "FIXED: <{{ project.url }}{{ build.number }}/|{{ project.full_name }} #{{ build.number }}> - {{ build.cause }}"\n' +
                         '    }\n' +
                         '  ]\n' +
                         '}',
        default_options: {
            icon_url:    common_values.icon_url_jenkins,
            panel_color: '#d0ff00'
        },
        example_data:    example_data,
        event_types:     ['build_fixed'],
        render_engine:   'liquid'
    },

    /**
     * 15: Build Fixed
     */
    {
        service_type:    common_values.service_type_slack,
        in_service_type: common_values.service_type_jenkins,
        name:            'Build Fixed',
        content:         '{\n' +
                         '  "icon_url": "{{ icon_url }}",\n' +
                         '  "text": "<{{ project.url }}{{ build.number }}/|{{ project.full_name }} #{{ build.number }}> has been FIXED",\n' +
                         '  "attachments": [\n' +
                         '    {\n' +
                         '      "color": "{{ panel_color }}",\n' +
                         '      "fields": [\n' +
                         '        {\n' +
                         '          "title": "Cause",\n' +
                         '          "value": "{{ build.cause | jsonescape }}",\n' +
                         '          "short": true\n' +
                         '        },\n' +
                         '        {\n' +
                         '          "title": "Duration",\n' +
                         '          "value": "{{ build.duration_string }}",\n' +
                         '          "short": true\n' +
                         '        }\n' +
                         '      ]\n' +
                         '    }\n' +
                         '  ]\n' +
                         '}',
        default_options: {
            icon_url:    common_values.icon_url_jenkins,
            panel_color: '#d0ff00'
        },
        example_data:    example_data,
        event_types:     ['build_fixed'],
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
