'use strict';

const _ = require('underscore');

/**
 * @returns {{content: string, default_options: {icon_url: string, panel_color: string}}}
 */
let getSlackDefaults = () => {
	return {
		content: JSON.stringify({
			icon_url:    '{{ icon_url }}',
			text:        '{{ user }} has assigned an issue to you',
			attachments: [
				{
					title: '<{{ issueurl }}|{{ issuekey }} - {{ summary }}>',
					color: '{{ panel_color }}'
				}
			]
		}, null, 2),

		default_options: {
			icon_url:    'https://public.jc21.com/juxtapose/icons/default.png',
			panel_color: '#0090ff'
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
						title:      '{{ user }} has re-opened a {{ issuetype }}',
						subtitle:   '{{ issuekey }}: {{ priority }}',
						imageUrl:   '{{ user_avatar }}',
						imageStyle: 'AVATAR'
					},
					sections: [
						{
							widgets: [
								{
									textParagraph: {
										text: '{{ summary | jsonescape }}'
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
												text:    'View Issue',
												onClick: {
													openLink: {
														url: '{{ issueurl }}'
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
			title:   '{{ issuekey }}: {{ summary }}',
			message: '{{ user }} has assigned to you',
			url:     '{{ issueurl }}'
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
		content:         '{{ user }} has assigned {{ issuekey }} to you: {{ issueurl }}',
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
		}
	});
};
