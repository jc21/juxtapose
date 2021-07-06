'use strict';

const _ = require('underscore');

/**
 * @returns {{content: string, default_options: {icon_url: string, panel_color: string}}}
 */
let getSlackDefaults = () => {
	return {
		content: JSON.stringify({
			icon_url: "{{ icon_url }}",
			text: "You were added as a reviewer by {{ event_user.name }}",
			attachments: [
					{
						title: "<{{ change.url }}|{{ change.subject | jsonescape }}>",
						color: "{{ panel_color }}",
						fields: [
							{
								"title": "Project",
								"value": "{{ project }}",
								"short": true
							},
							{
								"title": "Branch",
								"value": "{{ change.branch }}",
								"short": true
							}
						]
					}
				]
		}, null, 2),

		default_options: {
			icon_url:    'https://public.jc21.com/juxtapose/icons/gerrit.png',
			panel_color: '#AAFFAA'
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
						imageUrl:   'https://public.jc21.com/juxtapose/icons/gerrit.png',
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
 * @returns {object}
 */
let getPushoverDefaults = () => {
	return {
		content: JSON.stringify({
			title:   '{{ project.full_name }}',
			message: 'SUCCESS: #{{ build.number }}',
			url:     '{{ project.url }}/{{ build.number }}/'
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

		case 'pushover':
			specifics = getPushoverDefaults();
			break;
	}

	return _.assign({}, specifics, {
		example_data: {
			project: "nginx",
			event_user: {
				name: "Bobby Tables",
				email: "bobbyt@example.com",
				username: "bobbyt",
				gravatar: "https://public.jc21.com/juxtapose/icons/gerrit.png"
			},
			change: {
				project: "nginx",
				branch: "master",
				id: "Ibc67b37eceb73105cf9dc439d3930b332733eb83",
				number: 95557,
				subject: "Added new rules for the router",
				owner: {
					name: "Bobby Tables",
					email: "bobbyt@example.com",
					username: "bobbyt"
				},
				url: "http://gerrit.local/c/nginx/+/95557",
				commitMessage: "Added new rules for the router\n\nChange-Id: Ibc67b37eceb73105cf9dc439d3930b332733eb83\n",
				createdOn: 1625552862,
				status: "NEW"
			},
			timestamp: 1625552863
		}
	});
};
