'use strict';

import Mn from 'backbone.marionette';

const VirtualCollection = require('backbone-virtual-collection');
const Controller        = require('../controller');
const Api               = require('../api');
const TemplateModel     = require('../../models/template');
const EmptyView         = require('./empty');
const ListView          = require('./list');
const template          = require('./main.ejs');

module.exports = Mn.View.extend({
    template: template,
    id:       'templates',

    ui: {
        jira_region:      'div.jira-region',
        bitbucket_region: 'div.bitbucket-region',
        dockerhub_region: 'div.dockerhub-region',
        zendesk_region:   'div.zendesk-region',
        add_template:     'a.add-template'
    },

    regions: {
        jira_region:      '@ui.jira_region',
        bitbucket_region: '@ui.bitbucket_region',
        dockerhub_region: '@ui.dockerhub_region',
        zendesk_region:   '@ui.zendesk_region'
    },

    events: {
        'click @ui.add_template': function (e) {
            e.preventDefault();
            Controller.showNewTemplate(new TemplateModel.Model());
        }
    },

    onRender: function () {
        let view = this;

        Api.Templates.getAll()
            .then((response) => {
                if (!view.isDestroyed()) {
                    if (response && response.data && response.data.length) {

                        let collection = new TemplateModel.Collection(response.data);

                        let jira_templates = new VirtualCollection(collection, {
                            filter: {
                                in_service_type: 'jira-webhook'
                            }
                        });

                        let bitbucket_templates = new VirtualCollection(collection, {
                            filter: {
                                in_service_type: 'bitbucket-webhook'
                            }
                        });

                        let dockerhub_templates = new VirtualCollection(collection, {
                            filter: {
                                in_service_type: 'dockerhub-webhook'
                            }
                        });

                        let zendesk_templates = new VirtualCollection(collection, {
                            filter: {
                                in_service_type: 'zendesk-webhook'
                            }
                        });

                        view.showChildView('jira_region', new ListView({
                            collection: jira_templates
                        }));

                        view.showChildView('bitbucket_region', new ListView({
                            collection: bitbucket_templates
                        }));

                        view.showChildView('dockerhub_region', new ListView({
                            collection: dockerhub_templates
                        }));

                        view.showChildView('zendesk_region', new ListView({
                            collection: zendesk_templates
                        }));

                    } else {
                        view.showChildView('jira_region', new EmptyView());
                    }

                    view.trigger('loaded');
                }
            })
            .catch((err) => {
                Controller.showError(err, 'Could not fetch Templates');
                view.trigger('loaded');
            });
    }
});
