'use strict';

import _ from 'underscore';
import Backbone from 'backbone';

const trigger_groups = {
    'jira-webhook': {
        my_issues: {
            name: 'My Issues'
        },
        support:   {
            name: 'Support'
        },
        triage:    {
            name: 'Triage'
        }
    },
    'bitbucket-webhook': {
        for_me: {
            name: 'For Me'
        },
        noisy: {
            name: 'Noisy Notifications'
        }
    }
};

const trigger_types = {
    'jira-webhook': {
        assigned:             {
            name:  'An issue is assigned to you',
            group: 'my_issues'
        },
        updated:              {
            name:  'An issue assigned to you is updated',
            group: 'my_issues'
        },
        reopened:             {
            name:  'An issue assigned to you is re-opened',
            group: 'my_issues'
        },
        comment:              {
            name:  'A comment is made on an issue that is assigned to you',
            group: 'my_issues'
        },
        resolved:             {
            name:  'An issue assigned to you is resolved',
            group: 'my_issues'
        },
        reassigned:           {
            name:  'An issue is re-assigned away from you',
            group: 'my_issues'
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
        pr_review_requested:  {
            name:  'You have been asked to review a Pull Request',
            group: 'for_me'
        },
        my_pr_approved:  {
            name:  'Your PR has been approved',
            group: 'for_me'
        },
        my_pr_needs_work:  {
            name:  'Your PR needs work',
            group: 'for_me'
        },
        my_pr_merged:  {
            name:  'Your PR was merged',
            group: 'for_me'
        },
        my_pr_declined:  {
            name:  'Your PR was declined',
            group: 'for_me'
        },
        my_pr_deleted:  {
            name:  'Your PR was deleted',
            group: 'for_me'
        },
        my_pr_comment:  {
            name:  'Someone commented on your PR',
            group: 'for_me'
        },
        pr_opened:  {
            name:  'A PR was opened',
            group: 'noisy'
        },
        pr_merged:  {
            name:  'A PR was merged',
            group: 'noisy'
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
