'use strict';

const _        = require('underscore');
const Backbone = require('backbone');

const trigger_groups = {
	'jira-webhook':      {
		your_issues: {
			name: 'Your Issues'
		},
		support:     {
			name: 'Support'
		},
		triage:      {
			name: 'Triage'
		}
	},
	'bitbucket-webhook': {
		for_you: {
			name: 'For You'
		},
		noisy:   {
			name: 'Noisy Notifications'
		}
	},
	'dockerhub-webhook': {
		all: {
			name: 'All Events'
		}
	},
	'zendesk-webhook':   {
		your_tickets: {
			name: 'Your Tickets'
		},
		global:       {
			name: 'Global'
		}
	},
	'jenkins-webhook': {
		all: {
			name: 'All Events'
		}
	},
	'gerrit-webhook': {
		all: {
			name: 'All Events'
		}
	}
};

const trigger_types = {
	'jira-webhook': {
		assigned:             {
			name:  'An issue is assigned to you',
			group: 'your_issues'
		},
		updated:              {
			name:  'An issue assigned to you is updated',
			group: 'your_issues'
		},
		reopened:             {
			name:  'An issue assigned to you is re-opened',
			group: 'your_issues'
		},
		comment:              {
			name:  'A comment is made on an issue that is assigned to you',
			group: 'your_issues'
		},
		resolved:             {
			name:  'An issue assigned to you is resolved',
			group: 'your_issues'
		},
		reassigned:           {
			name:  'An issue is re-assigned away from you',
			group: 'your_issues'
		},
		updated_reported:     {
			name:  'An issue that you reported was updated',
			group: 'support'
		},
		reopened_reported:    {
			name:  'An issue you have reported is re-opened',
			group: 'support'
		},
		comment_reported:     {
			name:  'A comment is made on an issue that you reported',
			group: 'support'
		},
		resolved_reported:    {
			name:  'An issue you have reported is resolved',
			group: 'support'
		},
		comment_participated: {
			name:  'A comment is made on an issue that you have participated in',
			group: 'support'
		},
		updated_participated: {
			name:  'An issue that you have participated in was updated',
			group: 'support'
		},
		resolved_all:         {
			name:  'Any issue is resolved',
			group: 'support'
		},
		logged_unassigned:    {
			name:  'An issue was logged without assignee',
			group: 'triage'
		},
		reopened_unassigned:  {
			name:  'An unassigned issue was re-opened',
			group: 'triage'
		}
	},

	'bitbucket-webhook': {
		pr_review_requested: {
			name:  'You have been asked to review a Pull Request',
			group: 'for_you'
		},
		my_pr_approved:      {
			name:  'Your PR has been approved',
			group: 'for_you'
		},
		my_pr_needs_work:    {
			name:  'Your PR needs work',
			group: 'for_you'
		},
		my_pr_merged:        {
			name:  'Your PR was merged',
			group: 'for_you'
		},
		my_pr_declined:      {
			name:  'Your PR was declined',
			group: 'for_you'
		},
		my_pr_deleted:       {
			name:  'Your PR was deleted',
			group: 'for_you'
		},
		my_pr_comment:       {
			name:  'Someone commented on your PR',
			group: 'for_you'
		},
		pr_opened:           {
			name:  'A PR was opened',
			group: 'noisy'
		},
		pr_merged:           {
			name:  'A PR was merged',
			group: 'noisy'
		}
	},

	'dockerhub-webhook': {
		repo_updated: {
			name:  'Repository was updated',
			group: 'all'
		}
	},

	'zendesk-webhook': {
		my_ticket_assigned:   {
			name:  'A Ticket is assigned to you',
			group: 'your_tickets'
		},
		my_ticket_updated:    {
			name:  'A Ticket assigned to you is updated',
			group: 'your_tickets'
		},
		my_ticket_reassigned: {
			name:  'A Ticket assigned to you is re-assigned',
			group: 'your_tickets'
		},
		my_ticket_commented:  {
			name:  'A comment is made on on your Ticket',
			group: 'your_tickets'
		},
		my_ticket_rated:      {
			name:  'A rating is made on your Ticket',
			group: 'your_tickets'
		},
		ticket_logged:        {
			name:  'Any Ticket is logged without an Assignee',
			group: 'global'
		},
		ticket_rated:         {
			name:  'Any Ticket is rated',
			group: 'global'
		}
	},

	'jenkins-webhook': {
		build_success:    {
			name:  'Build Success',
			group: 'all'
		},
		build_failure:    {
			name:  'Build Failure',
			group: 'all'
		},
		build_aborted:    {
			name:  'Build Aborted',
			group: 'all'
		},
		build_unstable:   {
			name:  'Build Unstable',
			group: 'all'
		},
		build_regression: {
			name:  'Build Regression',
			group: 'all'
		},
		build_changed: {
			name:  'Build Result Changed',
			group: 'all'
		},
		build_fixed: {
			name:  'Build Fixed',
			group: 'all'
		}
	},

	'gerrit-webhook': {
		added_as_reviewer:    {
			name:  'You were added as a reviewer on a patch',
			group: 'all'
		},
		patch_created:    {
			name:  'A patch was created',
			group: 'all'
		}
	}
};

const model = Backbone.Model.extend({
	idAttribute: 'id',

	defaults: function () {
		return {
			user_id:              0,
			priority_order:       0,
			in_service_id:        0,
			trigger:              '',
			extra_conditions:     {},
			out_service_id:       0,
			out_template_id:      0,
			out_template_options: {}
		};
	},

	getTriggerHierarchy: function (service_type) {
		let response = [];

		if (typeof trigger_groups[service_type] === 'undefined') {
			throw new Error('Trigger groups for ' + service_type + ' are not defined');
		}

		if (typeof trigger_types[service_type] === 'undefined') {
			throw new Error('Trigger types for ' + service_type + ' are not defined');
		}

		_.map(trigger_groups[service_type], (group, group_key) => {
			let events = [];

			_.map(trigger_types[service_type], (trigger, trigger_key) => {
				if (trigger.group === group_key) {
					events.push({
						type: trigger_key,
						name: trigger.name
					});
				}
			});

			response.push({
				name:   group.name,
				events: events
			});
		});

		return response;
	},

	getTriggerName: function (service_type, trigger) {
		if (typeof trigger_types[service_type] !== 'undefined' && typeof trigger_types[service_type][trigger] !== 'undefined') {
			return trigger_types[service_type][trigger].name;
		}

		return '(unknown trigger: ' + service_type + '.' + trigger + ')';
	}

});

module.exports = {
	Model:      model,
	Collection: Backbone.Collection.extend({
		model: model
	})
};
