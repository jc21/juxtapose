'use strict';

import Mn from 'backbone.marionette';

const VirtualCollection = require('backbone-virtual-collection');
const Api               = require('../api');
const Cache             = require('../cache');
const Controller        = require('../controller');
const ListView          = require('./list');
const EmptyView         = require('./empty');
const RuleModel         = require('../../models/rule');
const template          = require('./main.ejs');

module.exports = Mn.View.extend({
    template: template,
    id:       'rules',

    defaults: {
        sort:   'name.asc',
        offset: 0,
        limit:  100
    },

    ui: {
        jira_region:      'div.jira-region',
        bitbucket_region: 'div.bitbucket-region',
        dockerhub_region: 'div.dockerhub-region',
        zendesk_region:   'div.zendesk-region',
        add_rule:         '.add-rule'
    },

    regions: {
        jira_region:      '@ui.jira_region',
        bitbucket_region: '@ui.bitbucket_region',
        dockerhub_region: '@ui.dockerhub_region',
        zendesk_region:   '@ui.zendesk_region'
    },

    events: {
        'click @ui.add_rule': function (e) {
            e.preventDefault();
            Controller.showNewRule(new RuleModel.Model({
                user_id: Cache.User.get('id')
            }));
        }
    },

    onRender: function () {
        let view = this;

        Api.Rules.getAll(view.options.offset, view.options.limit, view.options.sort, ['in_service', 'out_service', 'template'])
            .then((response) => {
                if (!view.isDestroyed()) {
                    if (response && response.data && response.data.length) {

                        let rule_collection = new RuleModel.Collection(response.data);

                        let jira_rules = new VirtualCollection(rule_collection, {
                            filter: rule => {
                                return rule.get('in_service').type === 'jira-webhook';
                            }
                        });

                        let bitbucket_rules = new VirtualCollection(rule_collection, {
                            filter: rule => {
                                return rule.get('in_service').type === 'bitbucket-webhook';
                            }
                        });

                        let dockerhub_rules = new VirtualCollection(rule_collection, {
                            filter: rule => {
                                return rule.get('in_service').type === 'dockerhub-webhook';
                            }
                        });

                        let zendesk_rules = new VirtualCollection(rule_collection, {
                            filter: rule => {
                                return rule.get('in_service').type === 'zendesk-webhook';
                            }
                        });

                        view.showChildView('jira_region', new ListView({
                            collection: jira_rules
                        }));

                        view.showChildView('bitbucket_region', new ListView({
                            collection: bitbucket_rules
                        }));

                        view.showChildView('dockerhub_region', new ListView({
                            collection: dockerhub_rules
                        }));

                        view.showChildView('zendesk_region', new ListView({
                            collection: zendesk_rules
                        }));

                    } else {
                        view.showChildView('jira_region', new EmptyView());
                    }

                    view.trigger('loaded');
                }
            })
            .catch((err) => {
                Controller.showError(err, 'Could not fetch Rules');
                view.trigger('loaded');
            });
    },

    initialize: function () {
        this.listenTo(Cache.User, 'change:services', this.render);
    }
});
