'use strict';

const Mn         = require('backbone.marionette');
const Api        = require('../api');
const Cache      = require('../cache');
const Controller = require('../controller');
const template   = require('./main.ejs');

module.exports = Mn.View.extend({
	id:       'login',
	template: template,

	ui: {
		form:     'form',
		identity: 'input[name=identity]',
		secret:   'input[name=secret]',
		submit:   'button',
		error:    'div.error'
	},

	events: {
		'submit @ui.form': function (e) {
			e.preventDefault();
			this.ui.submit.prop('disabled', true);
			this.ui.error.text('');

			let view = this;

			Api.Tokens.login(view.ui.identity.val(), view.ui.secret.val())
				.then(function () {
					return Api.Users.getById('me', ['services']);
				})
				.then(function (response) {
					Cache.User.set(response);
					Controller.navigate('/');
					window.location = '/';
					window.location.reload();
				})
				.catch(function (err) {
					view.ui.submit.prop('disabled', false);
					view.ui.error.text(err.message);
					console.error('Login error', err);
				});
		}
	},

	templateContext: function () {
		let view = this;

		return {
			hasLdap: function () {
				console.log('CALL TO hasLdap:', view.getOption('hasLdap'));
				return view.getOption('hasLdap') || false;
			}
		};
	}
});
