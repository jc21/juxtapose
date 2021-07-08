'use strict';

const migrate_name     = 'even_more_gerrit_templates';
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
		"gravatar": "https://public.jc21.com/juxtapose/icons/gerrit.png"
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
	"comment": "Patch Set 9: Code-Review+1",
	"timestamp": 1625552863
};

/**
 * Gerrit Templates
 *
 * @type {Array}
 */
const templates = [
	/**
	 * 1.1: Your change was commented on - slack
	 */
	{
		service_type:    common_values.service_type_slack,
		in_service_type: common_values.service_type_gerrit,
		name:            'Your change was commented on',
		content:         '{\n' +
			'  "icon_url": "{{ icon_url }}",\n' +
			'  "text": "{{ event_user.name }} commented on your change",\n' +
			'  "attachments": [\n' +
			'    {\n' +
			'      "title": "<{{ change.url }}|{{ change.subject | jsonescape }}>",\n' +
			'      "color": "{{ panel_color }}",\n' +
			'      "fields": [\n' +
			'        {\n' +
			'          "title": "Comment",\n' +
			'          "value": "{{ comment }}",\n' +
			'          "short": false\n' +
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
		event_types:     ['my_change_commented'],
		render_engine:   'liquid'
	},

	/**
	 * 1.2: Your change was commented on - pushover
	 */
	{
		service_type:    common_values.service_type_pushover,
		in_service_type: common_values.service_type_gerrit,
		name:            'Your change was commented on',
		content:         '{\n' +
			'  "title": "{{ event_user.name }} commented on your change",\n' +
			'  "message": "{{ project }}:{{ change.branch }} - {{ change.subject | jsonescape }}\\n{{ comment | jsonescape }}",\n' +
			'  "url": "{{ change.url }}"\n' +
			'}',
		default_options: common_values.pushover_defaults,
		example_data:    example_data,
		event_types:     ['my_change_commented'],
		render_engine:   'liquid'
	},

	/**
	 * 1.3: Your change was commented on - gchat
	 */
	{
		service_type:    common_values.service_type_gchat,
		in_service_type: common_values.service_type_gerrit,
		name:            'Your change was commented on',
		content:         '{\n' +
			'  "cards": [\n' +
			'    {\n' +
			'      "header": {\n' +
			'      "title": "{{ event_user.name }} commented on your change",\n' +
			'      "subtitle": "{{ project }}:{{ change.branch }} - {{ change.subject }}",\n' +
			'      "imageUrl": "' + common_values.icon_url_gerrit + '",\n' +
			'      "imageStyle": "IMAGE"\n' +
			'    },\n' +
			'    "sections": [\n' +
			'      {\n' +
			'        "widgets": [\n' +
			'          {\n' +
			'            "keyValue": {\n' +
			'              "topLabel": "Comment",\n' +
			'              "content": "{{ comment | jsonescape }}"\n' +
			'            }\n' +
			'          }\n' +
			'        ]\n' +
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
		event_types:     ['my_change_commented'],
		render_engine:   'liquid'
	},

	/**
	 * 1.4: Your change was commented on - jabber
	 */
	{
		service_type:    common_values.service_type_jabber,
		in_service_type: common_values.service_type_gerrit,
		name:            'Your change was commented on',
		content:         "{{ event_user.name }} commented on your change: {{ comment }}\n{{ change.subject }}\n{{ change.url }}",
		default_options: {},
		example_data:    example_data,
		event_types:     ['my_change_commented'],
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
