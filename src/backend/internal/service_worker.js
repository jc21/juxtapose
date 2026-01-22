const _ = require("lodash");
const batchflow = require("batchflow");
const { WebClient } = require("@slack/web-api");
const logger = require("../logger").services;
const notificationQueueModel = require("../models/notification_queue");
const xmpp = require("../lib/xmpp");
const GoogleChatBot = require("../lib/gchat");
const Pushover = require("../lib/pushover");
const Ntfy = require("../lib/ntfy");
const internalService = require("./service");

const internalServiceWorker = {
	services: {},
	intervalTimeout: 5000,
	interval: null,
	intervalProcessing: false,

	/**
	 * Starts the Service Worker
	 */
	start: () => {
		logger.info("Starting");
		internalServiceWorker.init();
	},

	/**
	 * Restarts the services
	 */
	restart: () => {
		logger.info("Restarting");

		if (internalServiceWorker.interval) {
			clearInterval(internalServiceWorker.interval);
			internalServiceWorker.intervalProcessing = false;
		}

		_.map(internalServiceWorker.services, (_, idx) => {
			if (typeof internalServiceWorker.services[idx].handler !== "undefined") {
				if (
					internalServiceWorker.services[idx].type === "slack" &&
					typeof internalServiceWorker.services[idx].handler.ws !== "undefined"
				) {
					internalServiceWorker.services[idx].handler.ws.close();
				} else if (internalServiceWorker.services[idx].type === "jabber") {
					internalServiceWorker.services[idx].handler.disconnect();
				}

				// Remove any interval timer if one applies to this service's handler
				if (
					typeof internalServiceWorker.services[idx].handler.interval !==
					"undefined"
				) {
					clearInterval(internalServiceWorker.services[idx].handler.interval);
				}

				internalServiceWorker.services[idx].handler = null;
			}
		});

		internalServiceWorker.services = null;
		internalServiceWorker.init();
	},

	/**
	 * Initialise configured services by loading them from the database and doing whatever needs to be done
	 */
	init: () => {
		internalServiceWorker.services = {};

		let started = 0;

		return internalService
			.getActiveServices()
			.then((services) => {
				return new Promise((resolve, reject) => {
					batchflow(services)
						.sequential()
						.each((_, service, next) => {
							if (service.type === "slack") {
								internalServiceWorker
									.initSlack(service)
									.then(() => {
										started++;
										next();
									})
									.catch((err) => {
										logger.error(
											"Service #" + service.id + " ERROR: " + err.message,
										);
										next(err);
									});
							} else if (service.type === "jabber") {
								internalServiceWorker
									.initJabber(service)
									.then(() => {
										started++;
										next();
									})
									.catch((err) => {
										logger.error(
											"Service #" + service.id + " ERROR: " + err.message,
										);
										next(err);
									});
							} else if (service.type === "gchat") {
								internalServiceWorker
									.initGchat(service)
									.then(() => {
										started++;
										next();
									})
									.catch((err) => {
										logger.error(
											"Service #" + service.id + " ERROR: " + err.message,
										);
										next(err);
									});
							} else if (service.type === "pushover") {
								internalServiceWorker
									.initPushover(service)
									.then(() => {
										started++;
										next();
									})
									.catch((err) => {
										logger.error(
											"Service #" + service.id + " ERROR: " + err.message,
										);
										next(err);
									});
							} else if (service.type === "ntfy") {
								internalServiceWorker
									.initNtfy(service)
									.then(() => {
										started++;
										next();
									})
									.catch((err) => {
										logger.error(`Service #${service.id} ERROR: ${err.message}`);
										next(err);
									});
							} else if (service.type.match(/(.|\n)*-webhook$/im)) {
								// can be ignored
								next();
							} else {
								logger.warn(`Service #${service.id} of type "${service.type}" is not yet supported`);
								next();
							}
						})
						.error((err) => {
							reject(err);
						})
						.end((/*results*/) => {
							logger.success(started + " Services Started");
							internalServiceWorker.interval = setInterval(
								internalServiceWorker.checkNotificationQueue,
								internalServiceWorker.intervalTimeout,
							);
							resolve();
						});
				});
			})
			.catch((err) => {
				logger.error(err);
			});
	},

	/**
	 * @param   {object}  service
	 * @returns {Promise}
	 */
	initSlack: (service) => {
		return new Promise((resolve /*, reject*/) => {
			logger.info(
				"Starting Service #" + service.id + " (slack): " + service.name,
			);

			// Set global
			const obj = (internalServiceWorker.services["service-" + service.id] =
				_.clone(service));
			obj.online = false;

			// create a bot
			obj.handler = new WebClient(service.data.api_token);

			// list conversations to see if we're online
			(async () => {
				try {
					await obj.handler.apiCall("conversations.list");
					obj.online = true;
					logger.success("Service #" + service.id + " (slack) Connected");
				} catch (err) {
					logger.error("Service #" + service.id + " (slack) " + err);
				}
			})();

			resolve();
		});
	},

	/**
	 * @param   {object}  service
	 * @returns {Promise}
	 */
	initJabber: (service) => {
		return new Promise((resolve, reject) => {
			logger.info(
				"Starting Service #" + service.id + " (jabber): " + service.name,
			);

			// Set global
			const obj = (internalServiceWorker.services["service-" + service.id] =
				_.clone(service));

			obj.online = false;
			obj.handler = new xmpp({
				jid: service.data.jid,
				password: service.data.password,
				host: service.data.server,
				port: service.data.port,
			});

			obj.handler.on("online", (data) => {
				logger.success(
					"Service #" +
						service.id +
						" (jabber) Connected with JID: " +
						data.jid.user +
						"@" +
						data.jid._domain,
				);
				obj.online = true;
			});

			obj.handler.on("close", () => {
				logger.info("Service #" + service.id + " (jabber) Closed");
				obj.online = false;

				if (typeof obj.handler !== "undefined" && obj.handler !== null) {
					obj.handler.disconnect();
				}

				// reconnect
				setTimeout(() => {
					logger.info("Service #" + service.id + " (jabber) reconnecting ...");

					internalServiceWorker.initJabber(service).catch((err) => {
						logger.error(
							"Service #" + service.id + " (jabber) ERROR: " + err.message,
						);
					});
				}, 2000);
			});

			obj.handler.on("chat", (from, message) => {
				logger.info(
					"Service #" + service.id + " (jabber) Chat:",
					message,
					from,
				);
				obj.handler.send(
					from,
					"Hey, it's Juxtapose here. You said: " + message,
				);
			});

			obj.handler.on("error", (err) => {
				logger.error(
					"Service #" + service.id + " (jabber) ERROR:",
					err.message,
				);
			});

			obj.handler.on("subscribe", (from) => {
				logger.info(
					"Service #" + service.id + " (jabber) Accepting subscription from:",
					from,
				);
				obj.handler.acceptSubscription(from);
			});

			obj.handler.on("roster", (roster) => {
				logger.info(
					"Service #" +
						service.id +
						" (jabber) Received Roster with " +
						roster.length +
						" people",
				);
				obj.roster = roster;
			});

			obj.handler.connect();

			resolve();
		});
	},

	/**
	 * @param   {object}  service
	 * @returns {Promise}
	 */
	initGchat: (service) => {
		return new Promise((resolve, reject) => {
			logger.info(
				"Starting Service #" + service.id + " (gchat): " + service.name,
			);

			// Set global
			const obj = (internalServiceWorker.services["service-" + service.id] =
				_.clone(service));
			obj.online = false;

			const credentials = JSON.parse(service.data.credentials_json);
			obj.handler = new GoogleChatBot(credentials);

			resolve(
				obj.handler
					.authorize()
					.then(() => {
						obj.online = true;

						logger.success("Service #" + service.id + " (gchat) Authorized");
						internalServiceWorker.gchatIntervalFire(obj);

						obj.handler.interval = setInterval(() => {
							internalServiceWorker.gchatIntervalFire(obj);
						}, 180000); // 3 mins
					})
					.catch((err) => {
						logger.error(
							"Service #" + service.id + " (gchat) Failed to authorize: ",
							err,
						);
					}),
			);
		});
	},

	/**
	 * Hit when ghat authenticates and also at intervals
	 *
	 * @param {object} service
	 */
	gchatIntervalFire: (service) => {
		service.handler
			.listSpaces()
			.then((spaces_result) => {
				service.spaces = spaces_result.data.spaces;

				return new Promise((resolve, reject) => {
					// Now, for each SPACE, get members sequentially
					batchflow(service.spaces)
						.sequential()
						.each((i, space, next) => {
							service.handler
								.listMembers(space.name)
								.then((members_result) => {
									service.spaces[i].members = members_result.data.memberships;
									next(true);
								})
								.catch(next);
						})
						.error(reject)
						.end((/*results*/) => {
							resolve();
						});
				});
			})
			.catch((err) => {
				logger.error(
					"Service #" + service.id + " (gchat) Failed to list spaces: ",
					err,
				);
			});
	},

	/**
	 * @param   {object} service
	 * @returns {Promise}
	 */
	initPushover: (service) => {
		return new Promise((resolve, reject) => {
			logger.info(
				"Starting Service #" + service.id + " (pushover): " + service.name,
			);

			// Set global
			const obj = (internalServiceWorker.services["service-" + service.id] =
				_.clone(service));
			obj.online = true;
			obj.handler = new Pushover(service.data.app_token);

			logger.success("Service #" + service.id + " (pushover) Ready");

			resolve();
		});
	},

	/**
	 * @param   {object} service
	 * @returns {Promise}
	 */
	initNtfy: (service) => {
		return new Promise((resolve, reject) => {
			logger.info(`Starting Service #${service.id} (ntfy): ${service.name}`);

			// Set global
			const obj = (internalServiceWorker.services[`service-${service.id}`] = _.clone(service));

			return Ntfy.build(service?.data?.token, service?.data?.server, service?.data?.topic)
				.then((instance) => {
					obj.handler = instance;
					obj.online = true;
					logger.success(`Service #${service.id} (ntfy) Ready`);
					resolve();
				})
				.catch(reject);
		});
	},

	/**
	 * @param {integer} serviceId
	 */
	syncData: (serviceId) => {
		const service = internalServiceWorker.getService(serviceId);

		if (service && service.type === "gchat") {
			logger.info("Service #" + service.id + " (" + service.type + ") Syncing");
			internalServiceWorker.gchatIntervalFire(service);
		} else {
			logger.warn(
				"Service #" +
					service.id +
					" (" +
					service.type +
					") does not support syncing",
			);
		}
	},

	/**
	 * @param   {integer} serviceId
	 * @returns {object|null}
	 */
	getService: (serviceId) => {
		if (
			typeof internalServiceWorker.services["service-" + serviceId] !==
			"undefined"
		) {
			return internalServiceWorker.services["service-" + serviceId];
		}

		return null;
	},

	/**
	 * @param   {integer} serviceId
	 * @returns {boolean}
	 */
	isOnline: (serviceId) => {
		const service = internalServiceWorker.getService(serviceId);
		if (service && typeof service.online !== "undefined") {
			return service.online;
		}

		return false;
	},

	/**
	 * Checks for queue items ready to process and processes them
	 */
	checkNotificationQueue: () => {
		if (!internalServiceWorker.intervalProcessing) {
			internalServiceWorker.intervalProcessing = true;

			notificationQueueModel
				.query()
				.select()
				.where("status", "ready")
				.eager("[user.services,service]")
				.then((notifications) => {
					return new Promise((resolve, reject) => {
						batchflow(notifications)
							.sequential()
							.each((i, notification, next) => {
								// update row with processing
								notificationQueueModel
									.query()
									.patch({
										status: "processing",
									})
									.where("id", notification.id)
									.then(() => {
										// Determine the service username for this notification
										let serviceSettings = null;

										_.map(notification.user.services, (service) => {
											if (
												service.id === notification.service_id &&
										 		service.service_username
											) {
												serviceSettings = _.clone(service);
											}
										});

										if (serviceSettings || notification.service.type === 'ntfy') {
											// Send
											logger.info(`Sending notification #${notification.id} to @${serviceSettings?.service_username} at ${serviceSettings?.type} service #${notification.service_id}`);

											internalServiceWorker
												.sendMessage(
													notification.service_id,
													serviceSettings?.service_username || null,
													notification.content,
												)
												.then(() => {
													// update row with error
													return notificationQueueModel
														.query()
														.patch({
															status: "completed",
														})
														.where("id", notification.id);
												})
												.catch((err) => {
													logger.error(err);
													// update row with error
													return notificationQueueModel
														.query()
														.patch({
															status: "error",
														})
														.where("id", notification.id);
												})
												.then(() => {
													next();
												});
										} else {
											logger.error(`Could not send notification #${notification.id} because destination username was not configured`);

											// update row with error
											notificationQueueModel
												.query()
												.patch({
													status: "error",
												})
												.where("id", notification.id)
												.then(() => {
													next();
												});
										}
									});
							})
							.error(reject)
							.end((/*results*/) => {
								resolve();
							});
					});
				})
				.then(() => {
					internalServiceWorker.intervalProcessing = false;
				})
				.catch((err) => {
					logger.error(err);
					internalServiceWorker.intervalProcessing = false;
				});
		}
	},

	/**
	 * @param   {Integer}        serviceId
	 * @param   {String}         username
	 * @param   {String|Object}  message
	 * @returns {Promise}
	 */
	sendMessage: (serviceId, username, message) => {
		return new Promise((resolve, reject) => {
			const service = internalServiceWorker.getService(serviceId);
			if (service) {
				switch (service.type) {
					// ===========================
					// Slack
					case "slack": {
						let slack_options = {
							text: "",
						};

						if (
							typeof service.data.post_as !== "undefined" &&
							service.data.post_as === "slackbot"
						) {
							slack_options.as_user = false;
							slack_options.icon_url =
								service.data.icon_url ||
								"https://public.jc21.com/juxtapose/icons/default.png";
							slack_options.username = service.data.name;
						}

						let channel = username;
						if (username.indexOf("@") === -1 && username.indexOf("#") === -1) {
							channel = `@${username}`;
						}

						if (typeof message === "object") {
							slack_options = _.assign({}, slack_options, message);
						} else {
							slack_options = _.assign({}, { text: message }, slack_options);
						}

						slack_options = _.assign({}, { channel: channel }, message);

						// Remove icon_url if we're not posting as slackbot
						if (
							typeof service.data.post_as === "undefined" ||
							service.data.post_as !== "slackbot"
						) {
							delete slack_options.icon_url;
						}

						(async () => {
							try {
								logger.info("SLACK OPTIONS:", slack_options);
								const result =
									await service.handler.chat.postMessage(slack_options);
								resolve(result || true);
							} catch (err) {
								reject(err);
							}
						})();
						break;
					}

					// ===========================
					// Jabber
					case "jabber":
						service.handler.send(username, message);
						resolve(true);
						break;

					// ===========================
					// Google Chat
					case "gchat":
						// The space name is the "username" variable supplied to this function

						service.handler
							.createMessage(username, message)
							.then((sent_message) => {
								resolve(sent_message || true);
							})
							.catch((err) => {
								reject(err);
							});
						break;

					// ===========================
					// Pushover
					case "pushover":
						service.handler
							.sendMessage(username, message)
							.then((result) => {
								resolve(result || true);
							})
							.catch((err) => {
								reject(err);
							});
						break;

					// ===========================
					// Ntfy
					case "ntfy":
						let content = message;
						if (typeof message === "string") {
							content = {
								topic: username,
								message,
							};
						} else if (!message?.topic) {
							message.topic = username;
						}

						service.handler
							.sendMessage(content)
							.then((result) => {
								resolve(result || true);
							})
							.catch((err) => {
								reject(err);
							});
						break;

					default:
						reject(
							new Error(
								'Service type "' + service.type + '" is not yet supported',
							),
						);
						break;
				}
			} else {
				reject(new Error("Could not find Service for #" + serviceId));
			}
		});
	},

	/**
	 * @param   {Integer}  serviceId
	 * @returns {Promise}
	 */
	getUsers: (serviceId) => {
		return new Promise((resolve, reject) => {
			const service = internalServiceWorker.getService(serviceId);
			if (service) {
				switch (service.type) {
					//===================
					// Slack
					case "slack":
						// The `users.list` slack api returns a MAX of 1000 results
						// despite pagination. So in order to get all the users,
						// we need to keep hitting the API until we get all the users,
						// The `response_metadata.next_cursor` will be set if there are
						// more users to get, or will be an empty string if not.
						try {
							(async () => {
								let cursor = "";
								const users = [];

								do {
									const result = await service.handler.users.list({
										limit: 500,
										cursor: cursor,
									});

									if (
										typeof result.response_metadata !== "undefined" &&
										typeof result.response_metadata.next_cursor !== "undefined"
									) {
										cursor = result.response_metadata.next_cursor;
									}
									if (typeof result.members !== "undefined") {
										const real_users = _.filter(
											result.members,
											(m) =>
												!m.is_bot &&
												!m.deleted &&
												m.id !== "USLACKBOT" &&
												!m.deleted &&
												m.name.indexOf("disabled") === -1,
										);
										_.map(real_users, (real_user) => {
											users.push({
												id: real_user.id,
												name: real_user.name,
												real_name: real_user.profile.real_name,
												display_name: real_user.profile.display_name,
												avatar: real_user.profile.image_24,
											});
										});
									} else {
										reject(new Error("Invalid response from service"));
										return;
									}
								} while (cursor);

								resolve(_.sortBy(users, ["real_name", "display_name", "name"]));
							})();
						} catch (err) {
							reject(err);
						}
						break;

					//===================
					// Jabber
					case "jabber":
						if (typeof service.roster !== "undefined") {
							resolve(_.sortBy(service.roster, ["name"]));
						} else {
							reject(new Error("Roster is not set"));
						}
						break;

					//===================
					// Google Chat
					case "gchat":
						if (typeof service.spaces !== "undefined") {
							// Massage the data to something easy for the UI
							const data = [];

							service.spaces.map((space) => {
								const members = [];

								space.members.map((member) => {
									if (
										member.state === "JOINED" &&
										member.member.type === "HUMAN"
									) {
										members.push(
											member.member.displayName || member.member.name,
										);
									}
								});

								if (members.length) {
									data.push({
										type: space.type,
										name: space.name,
										displayName:
											space.type === "DM"
												? members.join(", ")
												: space.displayName || space.name,
										members: members,
									});
								}
							});

							resolve(_.sortBy(data, ["displayName"]));
						} else {
							reject(new Error("Spaces are not set"));
						}
						break;

					default:
						reject(new Error(`Service type "${service.type}" is not yet supported`));
						break;
				}
			} else {
				reject(new Error("Could not find Service for #" + serviceId));
			}
		});
	},
};

module.exports = internalServiceWorker;
