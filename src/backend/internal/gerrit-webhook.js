'use strict';

const _                       = require('lodash');
const config                  = require('config');
const batchflow               = require('batchflow');
const logger                  = require('../logger').gerrit;
const serviceModel            = require('../models/service');
const ruleModel               = require('../models/rule');
const helpers                 = require('../lib/helpers');
const templateRender          = require('../lib/template_render');
const notificationQueueModel  = require('../models/notification_queue');
const gerritIncomingLogModel  = require('../models/gerrit_incoming_log');
const jwt                     = require('jsonwebtoken');
const error                   = require('../lib/error');
const gravatar                = require('gravatar');
const ALGO                    = 'RS256';

let public_key = null;

const internalGerritWebhook = {

	/**
	 * Router use
	 *
	 * @param   {String}  token
	 * @param   {Object}  webhook_data
	 * @param   {String}  webhook_data.type
	 * @param   {Object}  webhook_data.eventCreatedOn
	 * @param   {Object}  webhook_data.project
	 * @returns {Promise}
	 */
	processIncoming: (token, webhook_data) => {
		public_key = config.get('jwt.pub');

		// 1. Verify Token
		return internalGerritWebhook.verifyToken(token)
			.then(token_data => {
				// 2. Make sure service still exists
				return serviceModel
					.query()
					.where('is_deleted', 0)
					.andWhere('id', token_data.s)
					.andWhere('type', 'gerrit-webhook')
					.first()
					.then(service => {
						// 3. Validate service with token validation key
						if (service && service.data && service.data.validation_key === token_data.k) {
							return service;
						} else {
							throw new Error('Invalid Service');
						}
					})
					// 4. Save data for debugging
					.then(service => {
						logger.info('❯ Incoming Webhook for Service #' + service.id + ': ' + service.name);
						return gerritIncomingLogModel
							.query()
							.insert({
								service_id: service.id,
								data:       webhook_data
							})
							.then(log_row => {
								logger.info('  ❯ Saved in log table as ID #' + log_row.id);
								return service;
							});
					})
					// 5. Prune log table
					.then(service => {
						return gerritIncomingLogModel
							.query()
							.delete()
							.where(gerritIncomingLogModel.raw('`created_on` < DATE_SUB(DATE(NOW()), INTERVAL 2 DAY)'))
							.then(() => {
								return service;
							});
					})
					// 6. Process webhook
					.then(service => {
						return internalGerritWebhook.process(service.id, webhook_data);
					});
			})
			.catch(err => {
				logger.error(err, webhook_data);
				throw err;
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

	getProjectName: (webhook_data) => {
		if (typeof webhook_data['project'] !== 'undefined' && typeof webhook_data.project.name !== 'undefined') {
			return webhook_data.project.name;
		}
		return '(unknown project)';
	},

	/**
	 * Internal use
	 * First method to handle webhook data processing
	 *
	 * @param   {Integer} service_id
	 * @param   {Object}  webhook_data
	 * @param   {String}  webhook_data.type
	 * @param   {Object}  webhook_data.eventCreatedOn
	 * @param   {Object}  webhook_data.project
	 * @returns {Promise|Object}
	 */
	 process: (service_id, webhook_data) => {
		if (typeof webhook_data.type === 'string') {
			logger.info('  ❯ Event Type:                     ', webhook_data.type);
			logger.info('  ❯ Project:                        ', internalGerritWebhook.getProjectName(webhook_data));

			let event_types = [];

			switch (webhook_data.type) {
				case 'change-abandoned':
					// event_types.push(['pr_review_requested', 'pr_opened']);
					break;
				case 'change-deleted':
					// event_types.push(['my_pr_merged', 'pr_merged']);
					break;
				case 'change-merged':
					// event_types.push(['my_pr_merged', 'pr_merged']);
					break;
				case 'change-restored':
					// event_types.push(['my_pr_approved']);
					break;
				case 'comment-added':
					// event_types.push(['my_pr_declined']);
					break;
				case 'patchset-created':
					event_types.push(['patch_created']);
					break;
				case 'private-state-changed':
					// event_types.push(['my_pr_comment']);
					break;
				case 'ref-updated':
					// event_types.push(['my_pr_needs_work']);
					break;
				case 'reviewer-added':
					event_types.push(['added_as_reviewer']);
					break;
				case 'reviewer-deleted':
					// event_types.push(['my_pr_comment']);
					break;
				case 'vote-deleted':
					// event_types.push(['my_pr_comment']);
					break;
				case 'wip-state-changed':
					// event_types.push(['my_pr_comment']);
					break;
			}

			if (event_types.length) {
				return new Promise((resolve, reject) => {
					let already_notified_user_ids = [];

					batchflow(event_types).sequential()
						.each((i, event_type, next) => {
							internalGerritWebhook.processTheseEventTypes(event_type, service_id, webhook_data, already_notified_user_ids)
								.then((notified_user_ids) => {
									if (notified_user_ids && notified_user_ids.length) {
										already_notified_user_ids = _.concat(already_notified_user_ids, notified_user_ids);

										// Remove falsy items from the array:
										already_notified_user_ids = _.compact(already_notified_user_ids);
									}

									next(notified_user_ids.length);
								})
								.catch((err) => {
									console.error(err.message);
									next(err);
								});
						})
						.error((err) => {
							reject(err);
						})
						.end((results) => {
							let total = 0;

							_.map(results, (this_count) => {
								total += this_count;
							});

							// Returns a total count of the notifications queued
							resolve({notifications: total});
						});
				});
			}
		}

		return {
			error: 'Unsupported event: ' + webhook_data.type
		};
	},

	/**
	 * @param   {Array}   event_types
	 * @param   {Integer} service_id
	 * @param   {Object}  webhook_data
	 * @param   {String}  webhook_data.eventKey
	 * @param   {Object}  webhook_data.actor
	 * @param   {Object}  webhook_data.pullRequest
	 * @param   {Array}   already_notified_user_ids
	 * @returns {Promise}
	 */
	processTheseEventTypes: (event_types, service_id, webhook_data, already_notified_user_ids) => {
		const template_data = _.assign({service_id: service_id}, internalGerritWebhook.getCommonTemplateData(webhook_data));

		return new Promise((resolve, reject) => {
			batchflow(event_types).sequential()
				.each((i, event_type, next) => {
					internalGerritWebhook.processRules(event_type, template_data, webhook_data, already_notified_user_ids)
						.then(notified_user_ids => {
							if (notified_user_ids && notified_user_ids.length) {
								already_notified_user_ids = _.concat(already_notified_user_ids, notified_user_ids);
								already_notified_user_ids = _.compact(already_notified_user_ids);
							}

							next();
						})
						.catch((err) => {
							console.error(err);
							next();
						});
				})
				.error((err) => {
					reject(err);
				})
				.end(() => {
					resolve(already_notified_user_ids);
				});
		});
	},

	/**
	 * @param   {Object}  webhook_data
	 * @param   {Object}  webhook_data.pullRequest
	 * @param   {Object}  webhook_data.actor
	 * @returns {Object}
	 */
	getCommonTemplateData: (webhook_data) => {
		return {
			project:        internalGerritWebhook.getProjectName(webhook_data),
			event_user:     internalGerritWebhook.getEventUser(webhook_data),
			change:         internalGerritWebhook.getChange(webhook_data),
			patchset:       internalGerritWebhook.getPatchset(webhook_data),
			timestamp:      webhook_data.eventCreatedOn,

			/*
			owner:          internalGerritWebhook.getPrOwner(webhook_data, 'displayName'),
			owner_email:    internalGerritWebhook.getPrOwner(webhook_data, 'emailAddress'),
			owner_gravatar: owner_gravatar,
			title:          internalGerritWebhook.getPrField(webhook_data, 'title'),
			description:    internalGerritWebhook.getPrField(webhook_data, 'description'),
			project:        internalGerritWebhook.getToProjectField(webhook_data, 'key'),
			repo:           internalGerritWebhook.getToRepoField(webhook_data, 'slug'),
			branch:         internalGerritWebhook.getToRefField(webhook_data, 'displayId'),
			approval_count: internalGerritWebhook.getApprovalCount(webhook_data),
			from:           {
				project: internalGerritWebhook.getFromProjectField(webhook_data, 'key'),
				repo:    internalGerritWebhook.getFromRepoField(webhook_data, 'slug'),
				branch:  internalGerritWebhook.getFromRefField(webhook_data, 'displayId')
			},
			comment:        internalGerritWebhook.getCommentData(webhook_data)
			*/
		};
	},

	/**
	 * @param   {Object}  webhook_data
	 * @param   {String}  [field]
	 * @returns {*}
	 */
	getEventUser: (webhook_data, field) => {
		switch (webhook_data.type) {
			case 'patchset-created':
				return internalGerritWebhook.getUploader(webhook_data, field);
			case 'reviewer-added':
				return internalGerritWebhook.getUserItem(webhook_data, 'adder', field);
		}
		return null;
	},

	/**
	 * @param   {Object}  webhook_data
	 * @param   {String}  [field]
	 * @returns {*}
	 */
	getReviewer: (webhook_data, field) => {
		return internalGerritWebhook.getUserItem(webhook_data, 'reviewer', field);
	},

	/**
	 * @param   {Object}  webhook_data
	 * @param   {String}  [field]
	 * @returns {*}
	 */
	getUploader: (webhook_data, field) => {
		return internalGerritWebhook.getUserItem(webhook_data, 'uploader', field);
	},

	/**
	 * @param   {Object}  webhook_data
	 * @param   {String}  rootObject
	 * @param   {String}  [field]
	 * @returns {*}
	 */
	getUserItem: (webhook_data, rootObject, field) => {
		let user = null;
		if (typeof webhook_data[rootObject] !== 'undefined') {
			user = webhook_data[rootObject];
		}

		if (user) {
			// gravatar
			user.gravatar = 'https://public.jc21.com/juxtapose/icons/gerrit.png';
			if (typeof user.email !== 'undefined' && user.email) {
				user.gravatar = 'https:' + gravatar.url(user.email, {default: user.gravatar});
			}
		}

		if (user && field && typeof user[field] !== 'undefined') {
			return user[field];
		}

		return user;
	},

	getChange: (webhook_data) => {
		if (typeof webhook_data.change !== 'undefined') {
			return webhook_data.change;
		}
		return null;
	},

	getPatchset: (webhook_data) => {
		if (typeof webhook_data.patchSet !== 'undefined') {
			return webhook_data.patchSet;
		}
		return null;
	},

	/**
	 * Note, the following events are not handled because they are known not to have a destination user:
	 * - pr_opened
	 * - pr_merged
	 *
	 * @param   {String}  event_type
	 * @param   {Object}  webhook_data
	 * @returns {String|Array}
	 */
	getIncomingServiceUsernameBasedOnEvent: (event_type, webhook_data) => {
		switch (event_type) {
			case 'added_as_reviewer':
				return internalGerritWebhook.getReviewer(webhook_data, 'username');

			default:
				return null;
		}
	},

	/**
	 * @param   {Object}  conditions
	 * @param   {Object}  webhook_data
	 * @returns {Boolean}
	 */
	extraConditionsMatch: (conditions, webhook_data) => {
		// default or no conditions means it's ok to go through
		let is_ok = true;

		if (conditions !== {}) {
			_.map(conditions, (value, name) => {
				if (value) {
					// Values can be comma separated
					const values = helpers.splitByComma(value, true);
					if (values.length) {
						switch (name) {
							case 'project':
								const project = internalGerritWebhook.getProjectName(webhook_data);
								if (project && !values.includes(project.toLowerCase())) {
									is_ok = false;
									logger.info('      ❯ Project "' + project.toLowerCase() + '" NOT IN ' + JSON.stringify(values));
								}
								break;

							case 'branch':
								const change = internalGerritWebhook.getChange(webhook_data);
								if (change && !values.includes(change.branch.toLowerCase())) {
									is_ok = false;
									logger.info('      ❯ Branch "' + change.branch.toLowerCase() + '" NOT IN ' + JSON.stringify(values));
								}
								break;
						}
					}
				}
			});
		}

		return is_ok;
	},

	/**
	 * @param   {String}  event_type
	 * @param   {Object}  data
	 * @param   {Integer} data.service_id
	 * @param   {Object}  webhook_data
	 * @param   {Array}   already_notified_user_ids
	 * @returns {Promise} with array of user_ids who have been notified, so that they don't get notified again
	 */
	processRules: (event_type, data, webhook_data, already_notified_user_ids) => {
		already_notified_user_ids = already_notified_user_ids || [];

		logger.info('  ❯ Processing Rules for:           ', event_type);

		let incoming_destination_username = internalGerritWebhook.getIncomingServiceUsernameBasedOnEvent(event_type, webhook_data);
		logger.info('    ❯ incoming_destination_username:', typeof incoming_destination_username === 'object' && incoming_destination_username !== null ? incoming_destination_username.join(', ') : incoming_destination_username);

		let incoming_trigger_username = internalGerritWebhook.getEventUser(webhook_data, 'username');
		logger.info('    ❯ incoming_trigger_username:    ', incoming_trigger_username);

		if (incoming_destination_username && incoming_trigger_username) {
			if (typeof incoming_destination_username === 'string' && incoming_destination_username === incoming_trigger_username) {
				// bail, as the event user and the destination are the same, we don't want to annoy user with their own actions
				return Promise.resolve([]);
			} else if (typeof incoming_destination_username === 'object' && incoming_destination_username !== null && incoming_destination_username.length) {
				// remove trigger user from array if present
				_.pull(incoming_destination_username, incoming_trigger_username);

				if (!incoming_destination_username.length) {
					incoming_destination_username = null;
				}
			}
		}

		// A list of event types that are allowed to fire without having anyone specific to fire to.
		let anon_event_types = [
			'patch_created'
		];

		// This complex query should only get the rules for users where the event type is requested and the incoming service username is defined
		// and where a notification hasn't already been sent to a user for this webhook
		// and where the user is not disabled, and the services are not deleted

		let query = ruleModel
			.query()
			.select('rule.*', 'in_sd.service_username AS in_service_username')
			.joinRaw('INNER JOIN user ON user.id = rule.user_id AND user.is_disabled = 0 AND user.is_deleted = 0')
			.joinRaw('INNER JOIN service AS in_service ON in_service.id = rule.in_service_id AND in_service.is_deleted = 0')
			.joinRaw('INNER JOIN service AS out_service ON out_service.id = rule.out_service_id AND out_service.is_deleted = 0')
			.joinRaw('INNER JOIN user_has_service_data AS in_sd ON in_sd.user_id = rule.user_id AND in_sd.service_id = rule.in_service_id')
			.where('rule.is_deleted', 0)
			.andWhere('rule.in_service_id', data.service_id)
			.andWhere('in_sd.service_username', '!=', '')
			.andWhere('rule.trigger', event_type)
			.eager('[template, in_service_data]')
			.orderBy('rule.priority_order');

		if (typeof incoming_destination_username === 'string' && incoming_destination_username) {
			query.andWhere('in_sd.service_username', '=', incoming_destination_username);
		} else if (typeof incoming_destination_username === 'object' && incoming_destination_username !== null && incoming_destination_username.length) {
			query.whereIn('in_sd.service_username', incoming_destination_username);
		} else if (anon_event_types.indexOf(event_type) === -1) {
			logger.info('    ❯ No valid recipients for this event type');
			return Promise.resolve(already_notified_user_ids);
		}

		if (already_notified_user_ids.length) {
			query.whereNotIn('rule.user_id', already_notified_user_ids);
		}

		let this_already_notified_user_ids = [];

		return query
			.then(rules => {
				return new Promise((resolve, reject) => {
					batchflow(rules).sequential()
						.each((i, rule, next) => {
							logger.info('    ❯ Processing Rule #' + rule.id);

							if (this_already_notified_user_ids.indexOf(rule.id) !== -1) {
								logger.info('      ❯ We have already processed a notification for this user_id:', rule.user_id);
								next(0);
							} else if (!internalGerritWebhook.extraConditionsMatch(rule.extra_conditions, webhook_data)) {
								// extra conditions don't match the event
								logger.info('      ❯ Extra conditions do not match');
								next(0);
							} else {

								// Debugging data in the payload
								let debug_data = {
									_event_type:  event_type,
									_rule_id:     rule.id,
									_template_id: rule.out_template_id
								};

								templateRender(rule.template.content, _.assign({}, rule.template.default_options, rule.out_template_options, data, debug_data), rule.template.render_engine)
									.then(content => {
										return {
											user_id:    rule.user_id,
											rule_id:    rule.id,
											service_id: rule.out_service_id,
											content:    content,
											status:     'ready'
										};
									})
									.then(notification_data => {
										return notificationQueueModel
											.query()
											.insert(notification_data);
									})
									.then(() => {
										logger.info('      ❯ Notification queue item added');
										this_already_notified_user_ids.push(rule.user_id);
									})
									.then(() => {
										// Update rule fire count
										return ruleModel
											.query()
											.where('id', rule.id)
											.increment('fired_count', 1);
									})
									.then(() => {
										next(rule.user_id);
									});
							}
						})
						.error(err => {
							reject(err);
						})
						.end(() => {
							logger.info('    ❯ Done processing Rules for:    ', event_type);
							resolve(this_already_notified_user_ids);
						});
				});
			});
	}
};

module.exports = internalGerritWebhook;
