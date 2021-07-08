'use strict';

const _                     = require('lodash');
const config                = require('config');
const logger                = require('../logger').gchat;
const internalServiceWorker = require('./service_worker');
const serviceModel          = require('../models/service');
const jwt                   = require('jsonwebtoken');
const ALGO                  = 'RS256';

let public_key = null;

const quotes = [
	'Life has many ways of testing a person\'s will, either by having nothing happen at all or by having everything happen all at once. – Paulo Coelho',
	'There are two ways of spreading light: to be the candle, or the mirror that reflects it. – Edith Wharton',
	'Believe in yourself! Have faith in your abilities! Without a humble but reasonable confidence in your own powers you cannot be successful or happy. – Norman Vincent Peale',
	'Hate. It has caused a lot of problems in this world but has not solved one yet. – Maya Angelou',
	'If opportunity doesn\'t knock, build a door. – Milton Berle',
	'An attitude of positive expectation is the mark of the superior personality. – Brian Tracy',
	'Success consists of going from failure to failure without loss of enthusiasm. – Winston Churchill',
	'If you can dream it, then you can achieve it. You will get all you want in life if you help enough other people get what they want. – Zig Ziglar',
	'The only place where your dream becomes impossible is in your own thinking. – Robert H Schuller',
	'We don\'t see things as they are, we see them as we are. – Anais Nin',
	'Our greatest weakness lies in giving up. The most certain way to succeed is always to try just one more time. – Thomas Edison',
	'I may not have gone where I intended to go, but I think I have ended up where I needed to be. – Douglas Adams',
	'Learning is a gift. Even when pain is your teacher. – Maya Watson',
	'I\'ve had a lot of worries in my life, most of which never happened – Mark Twain',
	'You yourself, as much as anybody in the entire universe, deserve your love and affection.” – Buddha',
	'Hope is a waking dream. – Aristotle',
	'The past has no power over the present moment. – Eckhart Tolle',
	'Happiness is an attitude. We either make ourselves miserable, or happy and strong. The amount of work is the same. – Francesca Reigler',
	'If you want light to come into your life, you need to stand where it is shining. – Guy Finley',
	'Today is a new beginning, a chance to turn your failures into achievements & your sorrows into so goods. No room for excuses. – Joel Brown',
	'Life is a gift, and it offers us the privilege, opportunity, and responsibility to give something back by becoming more. – Tony Robbins',
	'We are all here for some special reason. Stop being a prisoner of your past. Become the architect of your future.” – Robin Sharma',
	'If you think you can do a thing or think you can\'t do a thing, you\'re right. – Henry Ford',
	'All you can change is yourself, but sometimes that changes everything! – Gary W Goldstein',
	'The will to win, the desire to succeed, the urge to reach your full potential… these are the keys that will unlock the door to personal excellence. – Confucius',
	'If we\'re growing, we\'re always going to be out of our comfort zone. – John C Maxwell',
	'Take chances, make mistakes. That\'s how you grow. Pain nourishes your courage. You have to fail in order to practice being brave. – Mary Tyler Moore'
];

const internalGchatBot = {

	/**
	 * Router use
	 *
	 * @param   {String}  token
	 * @param   {Object}  webhook_data
	 * @param   {String}  webhook_data.type
	 * @param   {String}  webhook_data.eventTime
	 * @param   {String}  webhook_data.token
	 * @param   {Object}  webhook_data.user
	 * @param   {Object}  webhook_data.space
	 * @param   {Object}  webhook_data.message
	 * @returns {Promise}
	 */
	processIncoming: (token, webhook_data) => {
		public_key = config.get('jwt.pub');

		// 1. Verify Token
		return internalGchatBot.verifyToken(token)
			.then(token_data => {

				// 2. Make sure service still exists
				return serviceModel
					.query()
					.where('is_deleted', 0)
					.andWhere('id', token_data.s)
					.andWhere('type', 'gchat')
					.first()
					.then(service => {
						// 3. Validate service with token validation key
						if (service && service.data && service.data.validation_key === token_data.k && webhook_data.token === service.data.validation_key) {
							return service;
						} else {
							throw new Error('Invalid Service');
						}
					})
					// 4. check for configCompleteRedirectUrl and hit it
					.then(service => {
						logger.info('❯ Incoming Webhook for Service #' + service.id + ': ' + service.name);

						// TODO:
						if (typeof webhook_data.configCompleteRedirectUrl !== 'undefined' && webhook_data.configCompleteRedirectUrl) {
							logger.warn('  ❯ configCompleteRedirectUrl received in payload:', webhook_data.configCompleteRedirectUrl);
						}

						return service;
					})
					// 5. Process webhook
					.then(service => {
						return internalGchatBot.process(service.id, webhook_data);
					});
			});
	},

	/**
	 * Internal use
	 * Verifies the incoming endpoint token
	 *
	 * @param   {String}  token
	 * @returns {Promise}
	 */
	verifyToken: token => {
		return new Promise((resolve, reject) => {
			try {
				if (!token || token === null || token === 'null') {
					reject(new Error('Empty token'));
				} else {
					jwt.verify(token, public_key, {ignoreExpiration: true, algorithms: [ALGO]}, (err, token_data) => {
						if (err) {
							if (err.name === 'TokenExpiredError') {
								reject(new error.AuthError('Token has expired', err));
							} else {
								reject(err);
							}
						} else {
							resolve(token_data);
						}
					});
				}
			} catch (err) {
				reject(err);
			}
		});
	},

	/**
	 * Internal use
	 * First method to handle webhook data processing
	 *
	 * The response here should be a well formatted GOOGLE CHAT message response!
	 *
	 * @param   {Integer} service_id
	 * @param   {Object}  webhook_data
	 * @param   {String}  webhook_data.type
	 * @param   {String}  webhook_data.eventTime
	 * @param   {String}  webhook_data.token
	 * @param   {Object}  webhook_data.user
	 * @param   {Object}  webhook_data.space
	 * @param   {Object}  webhook_data.message
	 * @returns {Promise|Object}
	 */
	process: (service_id, webhook_data) => {
		logger.info('  ❯ Event Type:', webhook_data.type);

		switch (webhook_data.type) {
			case 'ADDED_TO_SPACE':
				return internalGchatBot.eventAddedToSpace(service_id, webhook_data);

			case 'REMOVED_FROM_SPACE':
				return internalGchatBot.eventRemovedFromSpace(service_id, webhook_data);

			case 'MESSAGE':
				return internalGchatBot.eventMessage(service_id, webhook_data);
		}

		return {
			text: 'Sorry, I don\'t know how to respond to this event yet.'
		};
	},

	/**
	 * @param   {Integer} service_id
	 * @param   {Object}  webhook_data
	 */
	eventAddedToSpace: (service_id, webhook_data) => {
		// Tell service to update it's list of spaces
		internalServiceWorker.syncData(service_id);

		// Return a pretty message
		if (webhook_data.user.type === 'HUMAN') {
			return {
				text: 'Thanks for adding me ' + webhook_data.user.displayName + '! You can now configure your user\'s Google Chat settings to select this ' + webhook_data.space.type +
					  ' and I\'ll start sending events through :)'
			};
		}

		return {};
	},

	/**
	 * @param   {Integer} service_id
	 * @param   {Object}  webhook_data
	 */
	eventRemovedFromSpace: (service_id, webhook_data) => {
		// Tell service to update it's list of spaces
		internalServiceWorker.syncData(service_id);

		return {};
	},

	/**
	 * @param   {Integer} service_id
	 * @param   {Object}  webhook_data
	 */
	eventMessage: (service_id, webhook_data) => {
		// Only return a message if this is a DM chat for now.
		logger.info('  ❯ Message:', webhook_data.message.text);

		if (webhook_data.message.space.type === 'DM' && webhook_data.message.sender.type === 'HUMAN') {
			// I've got nothing better to do here so I'm going to return from a list of quotes.
			return {
				text: quotes[Math.floor(Math.random() * quotes.length)]
			};
		}

		return {};
	}
};

module.exports = internalGchatBot;
