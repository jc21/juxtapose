'use strict';

const Mn         = require('backbone.marionette');
const template   = require('./step2.ejs');
const Controller = require('../../controller');

module.exports = Mn.View.extend({
	template: template,
	id:       'add-new-rule2',

	ui: {
		triggers: 'a.trigger'
	},

	events: {
		'click @ui.triggers': function (e) {
			e.preventDefault();
			this.model.set('trigger', $(e.currentTarget).data('trigger'));
			Controller.showNewRule3(this.model);
		}
	},

	templateContext: function () {
		let view = this;

		return {
			getTriggers: () => {
				return view.model.getTriggerHierarchy(view.model.get('in_service_type'));
			}
		};
	}
});
