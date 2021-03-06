'use strict';

const _                = require('lodash');
const config           = require('config');
const gravatar         = require('gravatar');
const { authenticate } = require('ldap-authentication')

const error        = require('../lib/error');
const userModel    = require('../models/user');
const authModel    = require('../models/auth');
const helpers      = require('../lib/helpers');
const TokenModel   = require('../models/token');

module.exports = {

	/**
	 * @param   {Object} data
	 * @param   {String} data.identity
	 * @param   {String} data.secret
	 * @param   {String} [data.scope]
	 * @param   {String} [data.expiry]
	 * @param   {String} [issuer]
	 * @returns {Promise}
	 */
	getTokenFromEmail: (data, issuer) => {
		let Token = new TokenModel();

		data.scope  = data.scope || 'user';
		data.expiry = data.expiry || '30d';

		return userModel
			.query()
			.where('email', data.identity)
			.andWhere('is_deleted', 0)
			.andWhere('is_disabled', 0)
			.first()
			.then(user => {
				if (user) {
					// Get auth
					return authModel
						.query()
						.where('user_id', '=', user.id)
						.where('type', '=', 'password')
						.first()
						.then(auth => {
							if (auth) {
								return auth.verifyPassword(data.secret)
									.then(valid => {
										if (valid) {

											if (data.scope !== 'user' && _.indexOf(user.roles, data.scope) === -1) {
												// The scope requested doesn't exist as a role against the user,
												// you shall not pass.
												throw new error.AuthError('Invalid scope: ' + data.scope);
											}

											// Create a moment of the expiry expression
											let expiry = helpers.parseDatePeriod(data.expiry);
											if (expiry === null) {
												throw new error.AuthError('Invalid expiry time: ' + data.expiry);
											}

											return Token.create({
												iss:   issuer || 'api',
												attrs: {
													id: user.id
												},
												scope: [data.scope]
											}, {
												expiresIn: expiry.unix()
											})
												.then(signed => {
													return {
														token:   signed.token,
														expires: expiry.toISOString()
													};
												});
										} else {
											throw new error.AuthError('Invalid password');
										}
									});
							} else {
								throw new error.AuthError('No password auth for user');
							}
						});
				} else {
					throw new error.AuthError('No relevant user found');
				}
			});
	},

	/**
	 * @param   {Object} data
	 * @param   {String} data.identity
	 * @param   {String} data.secret
	 * @param   {String} [data.scope]
	 * @param   {String} [data.expiry]
	 * @param   {String} [issuer]
	 * @returns {Promise}
	 */
	 getTokenFromLDAP: (data, issuer) => {
		let Token = new TokenModel();

		data.scope  = data.scope || 'user';
		data.expiry = data.expiry || '30d';

		// Look up user by ldap
		const ldapOptions = {
			ldapOpts: {
				url: `ldap://${config.ldap.server}`,
			},
			userDn:            `${config.ldap.usernameAttribute}=${data.identity},${config.ldap.userSearchBase}`,
			userPassword:      data.secret,
			userSearchBase:    config.ldap.userSearchBase,
			usernameAttribute: config.ldap.usernameAttribute || 'uid',
			username:          data.identity,
		};

		return authenticate(ldapOptions)
			.then((user) => {
				const username = user[config.ldap.usernameAttribute];
				const email = user.mail || user.email || `${username}@${config.ldap.server}`;

				return {
					username: username,
					email:    email,
					name:     user.cn,
					nickname: user.givenName,
					password: data.secret,
				};
			})
			.then((ldapUser) => {
				// Look up the existing user by this email address
				// if not found, create with this pw
				// if found, update info from ldap including pw
				// give them a token
				const avatar = gravatar.url(ldapUser.email, {default: 'mm'});

				return userModel
					.query()
					.where('email', ldapUser.email)
					.andWhere('is_deleted', 0)
					.first()
					.then((user) => {
						if (user) {
							if (user.is_disabled) {
								throw new error.AuthError('Account is locally disabled');
							}

							// existing user
							return userModel
								.query()
								.patchAndFetchById(user.id, {
									name:     ldapUser.name,
									nickname: ldapUser.nickname,
									email:    ldapUser.email.toLowerCase().trim(),
									avatar:   avatar,
								})
								.then((updatedUser) => {
									console.log('LDAP User updated:', user.email);
									return authModel
										.query()
										.where('user_id', updatedUser.id)
										.andWhere('type', 'password')
										.patch({
											secret: ldapUser.password,
										})
										.then(() => {
											return updatedUser;
										});
								});

						} else {
							// new user
							return userModel
								.query()
								.insertAndFetch({
									name:     ldapUser.name,
									nickname: ldapUser.nickname,
									email:    ldapUser.email.toLowerCase().trim(),
									avatar:   avatar,
									roles:   [],
								})
								.then((createdUser) => {
									console.log('LDAP User created:', createdUser.email);
									return authModel
										.query()
										.insert({
											user_id: createdUser.id,
											type:    'password',
											secret:  ldapUser.password,
											meta:    {},
										})
										.then(() => {
											return createdUser;
										});
								});
						}
					});
			})
			.then((user) => {
				// User has either been created or updated, now do the token thing
				if (data.scope !== 'user' && _.indexOf(user.roles, data.scope) === -1) {
					// The scope requested doesn't exist as a role against the user,
					// you shall not pass.
					throw new error.AuthError('Invalid scope: ' + data.scope);
				}

				// Create a moment of the expiry expression
				let expiry = helpers.parseDatePeriod(data.expiry);
				if (expiry === null) {
					throw new error.AuthError('Invalid expiry time: ' + data.expiry);
				}

				return Token.create({
					iss:   issuer || 'api',
					attrs: {
						id: user.id
					},
					scope: [data.scope]
				}, {
					expiresIn: expiry.unix()
				})
					.then(signed => {
						return {
							token:   signed.token,
							expires: expiry.toISOString()
						};
					});
			});
	},

	/**
	 * @param {Access} access
	 * @param {Object} [data]
	 * @param {String} [data.expiry]
	 * @param {String} [data.scope]   Only considered if existing token scope is admin
	 * @returns {Promise}
	 */
	getFreshToken: (access, data) => {
		let Token = new TokenModel();

		data        = data || {};
		data.expiry = data.expiry || '30d';

		if (access && access.token.get('attrs').id) {

			// Create a moment of the expiry expression
			let expiry = helpers.parseDatePeriod(data.expiry);
			if (expiry === null) {
				throw new error.AuthError('Invalid expiry time: ' + data.expiry);
			}

			let token_attrs = {
				id: access.token.get('attrs').id
			};

			// Only admins can request otherwise scoped tokens
			let scope = access.token.get('scope');
			if (data.scope && access.token.hasScope('admin')) {
				scope = [data.scope];

				if (data.scope === 'job-board' || data.scope === 'worker') {
					token_attrs.id = 0;
				}
			}

			return Token.create({
				iss:   'api',
				scope: scope,
				attrs: token_attrs
			}, {
				expiresIn: expiry.unix()
			})
				.then(signed => {
					return {
						token:   signed.token,
						expires: expiry.toISOString()
					};
				});
		} else {
			throw new error.AssertionFailedError('Existing token contained invalid user data');
		}
	},

	/**
	 * @param   {Object} user
	 * @returns {Promise}
	 */
	getTokenFromUser: user => {
		let Token  = new TokenModel();
		let expiry = helpers.parseDatePeriod('1d');

		return Token.create({
			iss:   'api',
			attrs: {
				id: user.id
			},
			scope: ['user']
		}, {
			expiresIn: expiry.unix()
		})
			.then(signed => {
				return {
					token:   signed.token,
					expires: expiry.toISOString(),
					user:    user
				};
			});
	}
};
