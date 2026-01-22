const _ = require('underscore');

/**
 * @returns {{content: string, default_options: {icon_url: string, panel_color: string}}}
 */
const getSlackDefaults = () => {
	return {
		content: JSON.stringify({
			icon_url:    '{{ icon_url }}',
			text:        'Docker Repository <{{ url }}|{{ repo }}> updated by {{ pusher }}',
			attachments: [
				{
					color:  '{{ panel_color }}',
					fields: [
						{
							title: 'Tag',
							value: '{{ tag }}',
							short: true
						},
						{
							title: 'Star Count',
							value: '{{ star_count }}',
							short: true
						}
					]
				}
			]
		}, null, 2),

		default_options: {
			icon_url:    'https://public.jc21.com/juxtapose/icons/red.png',
			panel_color: '#114c6d'
		}
	};
};

/**
 * @returns {{content: string, default_options: {}}}
 */
const getGoogleChatDefaults = () => {
	return {
		content: JSON.stringify({
			cards: [
				{
					header:   {
						title:      'Repository updated by {{ pusher }}',
						subtitle:   '{{ repo }}:{{ tag }}',
						imageUrl:   'https://public.jc21.com/juxtapose/icons/dockerhub.png',
						imageStyle: 'IMAGE'
					},
					sections: [
						{
							widgets: [
								{
									buttons: [
										{
											textButton: {
												text:    'View',
												onClick: {
													openLink: {
														url: '{{ url }}'
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
			title:   '{{ repo }}:{{ tag }}',
			message: 'Updated by {{ pusher }}',
			url:     '{{ url }}'
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
			title:   '{{ repo }}:{{ tag }}',
			message: 'Updated by {{ pusher }}',
			url:     '{{ url }}',
			actions: [{
				clear: false,
				label: "View",
				type: "view",
				url: "{{ url }}",
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
let getOtherDefaults = () => {
	return {
		content:         'Docker Repository updated by {{ pusher }}: {{ url }}',
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
			pusher:        'jc21',
			owner:         'jc21',
			repo:          'jc21\/juxtapose',
			name:          'juxtapose',
			tag:           'latest',
			namespace:     'jc21',
			description:   'Juxtapose is a self-hosted web app to send notifications from incoming services.',
			url:           'https:\/\/hub.docker.com\/r\/jc21\/juxtapose',
			star_count:    1234,
			comment_count: 0
		}
	});
};
