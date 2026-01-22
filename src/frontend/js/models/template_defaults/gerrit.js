const _ = require('underscore');

/**
 * @returns {{content: string, default_options: {icon_url: string, panel_color: string}}}
 */
const getSlackDefaults = () => {
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
const getGoogleChatDefaults = () => {
	return {
		content: JSON.stringify({
			"cards": [
				{
					"header": {
						"title": "You were added as a reviewer",
						"subtitle": "{{ project }}:{{ change.branch }}",
						"imageUrl": "https://public.jc21.com/juxtapose/icons/gerrit.png",
						"imageStyle": "IMAGE"
					},
					"sections": [
						{
							"widgets": [
								{
									"keyValue": {
										"topLabel": "Subject",
										"content": "{{ change.subject }}"
									}
								}
							]
						},
						{
							"widgets": [
								{
									"buttons": [
										{
											"textButton": {
												"text": "View Change",
												"onClick": {
													"openLink": {
														"url": "{{ project.url }}"
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
const getPushoverDefaults = () => {
	return {
		content: JSON.stringify({
			title: "Added as reviewer by {{ event_user.name }}",
			message: "{{ project }}:{{ change.branch }} - {{ change.subject }}",
			url: "{{ change.url }}"
		}, null, 2),

		default_options: {
			priority: 'normal',
			sound:    'default'
		}
	};
};

/**
 * @returns {object}
 */
const getNtfyDefaults = () => {
	return {
		content: JSON.stringify({
			title: "Added as reviewer by {{ event_user.name }}",
			message: "{{ project }}:{{ change.branch }} - {{ change.subject }}",
			url: "{{ change.url }}",
			actions: [{
				clear: false,
				label: "View Patch",
				type: "view",
				url: "{{ change.url }}",
			}],
		}, null, 2),

		default_options: {
			topic:   'juxtapose',
			priority: 3,
		}
	};
};

/**
 * @returns {{content: string, default_options: {}}}
 */
const getOtherDefaults = () => {
	return {
		content:         "You were added as a reviewer by {{ event_user.name }}:\n{{ change.subject }}\n{{ change.url }}",
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

		case 'ntfy':
			specifics = getNtfyDefaults();
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
			reviews: [
				{
					"type": "Code-Review",
					"description": "Code-Review",
					"value": "+2",
					"oldValue": "0",
					"positive": true,
					"negative": false
				},
				{
					"type": "Verified",
					"description": "Verified",
					"value": "+1",
					"oldValue": "0",
					"positive": true,
					"negative": false
				},
				{
					"type": "Benchmark",
					"description": "Benchmark",
					"value": "-1",
					"oldValue": "0",
					"positive": false,
					"negative": true
				}
			],
			comment: "Patch Set 9: Code-Review+1",
			timestamp: 1625552863
		}
	});
};
