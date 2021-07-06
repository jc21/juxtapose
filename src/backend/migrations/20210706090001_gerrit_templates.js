'use strict';

const migrate_name     = 'gerrit_templates';
const logger           = require('../logger').migrate;
const batchflow        = require('batchflow');
const internalTemplate = require('../internal/template');

const common_values = {
	icon_url_gerrit:       'https://public.jc21.com/juxtapose/icons/gerrit.png',
	service_type_slack:    'slack',
	service_type_gchat:    'gchat',
	service_type_jabber:   'jabber',
	service_type_pushover: 'pushover',
	service_type_gerrit:   'gerrit-webhook',
	pushover_defaults:      {
		priority: 'normal',
		sound:    'default'
	},
};

const example_data = {
	"project": "nginx",
	"event_user": {
		"name": "Bobby Tables",
		"email": "bobbyt@example.com",
		"username": "bobbyt",
		"gravatar": common_values.icon_url_gerrit,
	},
	"change": {
		"project": "nginx",
		"branch": "master",
		"id": "Ibc67b37eceb73105cf9dc439d3930b332733eb83",
		"number": 95557,
		"subject": "Added new rules for the router",
		"owner": {
			"name": "Bobby Tables",
			"email": "bobbyt@example.com",
			"username": "bobbyt"
		},
		"url": "http://gerrit.local/c/nginx/+/95557",
		"commitMessage": "Added new rules for the router\n\nChange-Id: Ibc67b37eceb73105cf9dc439d3930b332733eb83\n",
		"createdOn": 1625552862,
		"status": "NEW"
	},
	"timestamp": 1625552863
};

/**
 * Gerrit Templates
 *
 * @type {Array}
 */
const templates = [
	/**
	 * 1.1: Added as reviewer - slack
	 */
	{
		service_type:    common_values.service_type_slack,
		in_service_type: common_values.service_type_gerrit,
		name:            'Added as reviewer',
		content:         '{\n' +
			'  "icon_url": "{{ icon_url }}",\n' +
			'  "text": "You were added as a reviewer by {{ event_user.name }}",\n' +
			'  "attachments": [\n' +
			'    {\n' +
			'      "title": "<{{ change.url }}|{{ change.subject | jsonescape }}>",\n' +
			'      "color": "{{ panel_color }}",\n' +
			'      "fields": [\n' +
			'        {\n' +
			'          "title": "Project",\n' +
			'          "value": "{{ project }}",\n' +
			'          "short": true\n' +
			'        },\n' +
			'        {\n' +
			'          "title": "Branch",\n' +
			'          "value": "{{ change.branch }}",\n' +
			'          "short": true\n' +
			'        }\n' +
			'      ]\n' +
			'    }\n' +
			'  ]\n' +
			'}',
		default_options: {
			icon_url:    common_values.icon_url_gerrit,
			panel_color: '#AAFFAA'
		},
		example_data:    example_data,
		event_types:     ['added_as_reviewer'],
		render_engine:   'liquid'
	},

	/**
	 * 1.2: Added as reviewer - pushover
	 */
	{
		service_type:    common_values.service_type_pushover,
		in_service_type: common_values.service_type_gerrit,
		name:            'Added as reviewer',
		content:         '{\n' +
			'  "title": "Added as reviewer by {{ event_user.name }}",\n' +
			'  "message": "{{ project }}:{{ change.branch }} - {{ change.subject }}",\n' +
			'  "url": "{{ change.url }}"\n' +
			'}',
		default_options: common_values.pushover_defaults,
		example_data:    example_data,
		event_types:     ['added_as_reviewer'],
		render_engine:   'liquid'
	},

	/**
	 * 1.3: Added as reviewer - gchat
	 */
	{
		service_type:    common_values.service_type_gchat,
		in_service_type: common_values.service_type_gerrit,
		name:            'Added as reviewer',
		content:         '{\n' +
			'  "cards": [\n' +
			'    {\n' +
			'      "header": {\n' +
			'      "title": "You were added as a reviewer by {{ event_user.name }}",\n' +
			'      "subtitle": "{{ project }}:{{ change.branch }}",\n' +
			'      "imageUrl": "' + common_values.icon_url_gerrit + '",\n' +
			'      "imageStyle": "IMAGE"\n' +
			'    },\n' +
			'    "sections": [\n' +
			'      {\n' +
			'        "widgets": [\n' +
			'          {\n' +
			'            "keyValue": {\n' +
			'            "topLabel": "Subject",\n' +
			'            "content": "{{ change.subject }}"\n' +
			'          }\n' +
			'        }]\n' +
			'     },\n' +
			'     {\n' +
			'       "widgets": [\n' +
			'         {\n' +
			'           "buttons": [\n' +
			'             {\n' +
			'               "textButton": {\n' +
			'               "text": "View Change",\n' +
			'               "onClick": {\n' +
			'                 "openLink": {\n' +
			'                   "url": "{{ project.url }}"\n' +
			'                 }\n' +
			'               }\n' +
			'             }\n' +
			'           }]\n' +
			'         }]\n' +
			'       }]\n' +
			'     }\n' +
			'  ]\n' +
			'}',
		default_options: {},
		example_data:    example_data,
		event_types:     ['added_as_reviewer'],
		render_engine:   'liquid'
	},

	/**
	 * 1.4: Added as reviewer - jabber
	 */
	{
		service_type:    common_values.service_type_jabber,
		in_service_type: common_values.service_type_gerrit,
		name:            'Added as reviewer',
		content:         'You were added as a reviewer by {{ event_user.name }}:\n{{ change.subject }}\n{{ change.url }}',
		default_options: {},
		example_data:    example_data,
		event_types:     ['added_as_reviewer'],
		render_engine:   'liquid'
	},

	/**
	 * 2.1: A patch was created - slack
	 */
	 {
		service_type:    common_values.service_type_slack,
		in_service_type: common_values.service_type_gerrit,
		name:            'A patch was created',
		content:         '{\n' +
			'  "icon_url": "{{ icon_url }}",\n' +
			'  "text": "A patch was created by {{ event_user.name }}",\n' +
			'  "attachments": [\n' +
			'    {\n' +
			'      "title": "<{{ change.url }}|{{ change.subject | jsonescape }}>",\n' +
			'      "color": "{{ panel_color }}",\n' +
			'      "fields": [\n' +
			'        {\n' +
			'          "title": "Project",\n' +
			'          "value": "{{ project }}",\n' +
			'          "short": true\n' +
			'        },\n' +
			'        {\n' +
			'          "title": "Branch",\n' +
			'          "value": "{{ change.branch }}",\n' +
			'          "short": true\n' +
			'        }\n' +
			'      ]\n' +
			'    }\n' +
			'  ]\n' +
			'}',
		default_options: {
			icon_url:    common_values.icon_url_gerrit,
			panel_color: '#AAFFAA'
		},
		example_data:    example_data,
		event_types:     ['patch_created'],
		render_engine:   'liquid'
	},

	/**
	 * 2.2: A patch was created - pushover
	 */
	 {
		service_type:    common_values.service_type_pushover,
		in_service_type: common_values.service_type_gerrit,
		name:            'A patch was created',
		content:         '{\n' +
			'  "title": "A patch was created by {{ event_user.name }}",\n' +
			'  "message": "{{ project }}:{{ change.branch }} - {{ change.subject }}",\n' +
			'  "url": "{{ change.url }}"\n' +
			'}',
		default_options: common_values.pushover_defaults,
		example_data:    example_data,
		event_types:     ['patch_created'],
		render_engine:   'liquid'
	},

	/**
	 * 2.3: A patch was created - gchat
	 */
	 {
		service_type:    common_values.service_type_gchat,
		in_service_type: common_values.service_type_gerrit,
		name:            'A patch was created',
		content:         '{\n' +
			'  "cards": [\n' +
			'    {\n' +
			'      "header": {\n' +
			'      "title": "A patch was created by {{ event_user.name }}",\n' +
			'      "subtitle": "{{ project }}:{{ change.branch }}",\n' +
			'      "imageUrl": "' + common_values.icon_url_gerrit + '",\n' +
			'      "imageStyle": "IMAGE"\n' +
			'    },\n' +
			'    "sections": [\n' +
			'      {\n' +
			'        "widgets": [\n' +
			'          {\n' +
			'            "keyValue": {\n' +
			'            "topLabel": "Subject",\n' +
			'            "content": "{{ change.subject }}"\n' +
			'          }\n' +
			'        }]\n' +
			'     },\n' +
			'     {\n' +
			'       "widgets": [\n' +
			'         {\n' +
			'           "buttons": [\n' +
			'             {\n' +
			'               "textButton": {\n' +
			'               "text": "View Change",\n' +
			'               "onClick": {\n' +
			'                 "openLink": {\n' +
			'                   "url": "{{ project.url }}"\n' +
			'                 }\n' +
			'               }\n' +
			'             }\n' +
			'           }]\n' +
			'         }]\n' +
			'       }]\n' +
			'     }\n' +
			'  ]\n' +
			'}',
		default_options: {},
		example_data:    example_data,
		event_types:     ['patch_created'],
		render_engine:   'liquid'
	},

	/**
	 * 2.4: A patch was created - jabber
	 */
	 {
		service_type:    common_values.service_type_jabber,
		in_service_type: common_values.service_type_gerrit,
		name:            'A patch was created',
		content:         'A patch was created by {{ event_user.name }}:\n{{ change.subject }}\n{{ change.url }}',
		default_options: {},
		example_data:    example_data,
		event_types:     ['patch_created'],
		render_engine:   'liquid'
	},
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
					.catch((err) => {
						logger.error('[' + migrate_name + '] ' + err.message);
						throw err;
					});
			})
			.error((err) => {
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
