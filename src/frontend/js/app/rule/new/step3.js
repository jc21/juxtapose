'use strict';

const Mn         = require('backbone.marionette');
const template   = require('./step3.ejs');
const Controller = require('../../controller');

require('jquery-serializejson');

module.exports = Mn.View.extend({
	template: template,
	id:       'add-new-rule3',

	ui: {
		form:    'form',
		buttons: 'form button'
	},

	events: {
		'submit @ui.form': function (e) {
			e.preventDefault();
			let data = this.ui.form.serializeJSON();

			if (!data.project) {
				delete data.project;
			} else if (this.model.get('in_service_type') === 'jira-webhook') {
				data.project = data.project.toUpperCase();
			}

			if (!data.repo) {
				delete data.repo;
			}

			if (!data.tag) {
				delete data.tag;
			}

			this.model.set('extra_conditions', data);
			Controller.showNewRule4(this.model);
		}
	},

	templateContext: function () {
		let view = this;

		return {
			getTriggerName: function () {
				return view.model.getTriggerName(view.model.get('in_service_type'), view.model.get('trigger'));
			}
		};
	}
});
