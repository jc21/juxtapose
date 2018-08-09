'use strict';

const Backbone = require('backbone');
const Cache    = require('./cache');
const Tokens   = require('./tokens');

module.exports = {

    /**
     * @param {String} route
     * @param {Object} [options]
     * @returns {Boolean}
     */
    navigate: function (route, options) {
        options = options || {};
        Backbone.history.navigate(route.toString(), options);
        return true;
    },

    /**
     * Login
     */
    showLogin: function () {
        require(['./main', './login/main'], (App, View) => {
            this.navigate('/login');
            App.UI.showChildView('main_region', new View());
        });
    },

    /**
     * Services
     */
    showServices: function () {
        if (Cache.User.isAdmin()) {
            require(['./main', './services/main'], (App, View) => {
                this.navigate('/services');
                App.UI.showChildView('main_region', new View());
            });
        } else {
            this.showRules();
        }
    },

    /**
     * New Service UI
     *
     * @param model
     */
    showNewService: function (model) {
        if (Cache.User.isAdmin()) {
            require(['./main', './services/new'], function (App, View) {
                App.UI.showModalDialog(new View({model: model}));
            });
        }
    },

    /**
     * Slack Service Config
     *
     * @param model
     */
    showSlackConfig: function (model) {
        if (Cache.User.isAdmin()) {
            require(['./main', './services/slack/main'], function (App, View) {
                App.UI.showModalDialog(new View({model: model}));
            });
        }
    },

    /**
     * Jabber Service Config
     *
     * @param model
     */
    showJabberConfig: function (model) {
        if (Cache.User.isAdmin()) {
            require(['./main', './services/jabber/main'], function (App, View) {
                App.UI.showModalDialog(new View({model: model}));
            });
        }
    },

    /**
     * Google Chat Service Config
     *
     * @param model
     */
    showGoogleChatConfig: function (model) {
        if (Cache.User.isAdmin()) {
            require(['./main', './services/gchat/main'], function (App, View) {
                App.UI.showModalDialog(new View({model: model}));
            });
        }
    },

    /**
     * Jira Webhook Config
     *
     * @param model
     */
    showJiraWebhookConfig: function (model) {
        if (Cache.User.isAdmin()) {
            require(['./main', './services/jira-webhook/main'], function (App, View) {
                App.UI.showModalDialog(new View({model: model}));
            });
        }
    },

    /**
     * Bitbucket Webhook Config
     *
     * @param model
     */
    showBitbucketWebhookConfig: function (model) {
        if (Cache.User.isAdmin()) {
            require(['./main', './services/bitbucket-webhook/main'], function (App, View) {
                App.UI.showModalDialog(new View({model: model}));
            });
        }
    },

    /**
     * DockerHub Webhook Config
     *
     * @param model
     */
    showDockerhubWebhookConfig: function (model) {
        if (Cache.User.isAdmin()) {
            require(['./main', './services/dockerhub-webhook/main'], function (App, View) {
                App.UI.showModalDialog(new View({model: model}));
            });
        }
    },

    /**
     * Zendesk Webhook Config
     *
     * @param model
     */
    showZendeskWebhookConfig: function (model) {
        if (Cache.User.isAdmin()) {
            require(['./main', './services/zendesk-webhook/main'], function (App, View) {
                App.UI.showModalDialog(new View({model: model}));
            });
        }
    },

    /**
     * Jenkins Webhook Config
     *
     * @param model
     */
    showJenkinsWebhookConfig: function (model) {
        if (Cache.User.isAdmin()) {
            require(['./main', './services/jenkins-webhook/main'], function (App, View) {
                App.UI.showModalDialog(new View({model: model}));
            });
        }
    },

    /**
     * Service Test Dialog
     *
     * @param model
     */
    showServiceTest: function (model) {
        if (Cache.User.isAdmin()) {
            require(['./main', './services/test/main'], function (App, View) {
                App.UI.showModalDialog(new View({model: model}));
            });
        }
    },

    /**
     * @param {Object} model
     */
    showServiceEndpoint: function (model) {
        if (Cache.User.isAdmin()) {
            require(['./main', './services/endpoint/main'], function (App, View) {
                App.UI.showModalDialog(new View({model: model}));
            });
        }
    },

    /**
     * Templates
     */
    showTemplates: function () {
        if (Cache.User.isAdmin()) {
            require(['./main', './templates/main'], (App, View) => {
                this.navigate('/templates');
                App.UI.showChildView('main_region', new View());
            });
        } else {
            this.showRules();
        }
    },

    /**
     * New Template UI
     *
     * @param model
     */
    showNewTemplate: function (model) {
        if (Cache.User.isAdmin()) {
            require(['./main', './template/new/step1'], function (App, View) {
                App.UI.showModalDialog(new View({model: model}));
            });
        }
    },

    /**
     * New Template UI 2 - Pick a service
     *
     * @param model
     */
    showNewTemplate2: function (model) {
        require(['./main', './template/new/step2'], function (App, View) {
            App.UI.showModalDialog(new View({model: model}));
        });
    },

    /**
     * General Template Config, for slack/jabber
     *
     * @param model
     */
    showGeneralTemplate: function (model) {
        if (Cache.User.isAdmin()) {
            require(['./main', './template/general/main'], function (App, View) {
                App.UI.showModalDialog(new View({model: model}));
            });
        }
    },

    /**
     * Rules
     *
     * @param {Number}  [offset]
     * @param {Number}  [limit]
     * @param {String}  [sort]
     */
    showRules: function (offset, limit, sort) {
        require(['./main', './rules/main'], (App, View) => {
            this.navigate('/rules');
            App.UI.showMainLoading();

            let view = new View({
                sort:   (typeof sort !== 'undefined' && sort ? sort : Cache.Session.Rules.sort),
                offset: (typeof offset !== 'undefined' ? offset : Cache.Session.Rules.offset),
                limit:  (typeof limit !== 'undefined' && limit ? limit : Cache.Session.Rules.limit)
            });

            view.on('loaded', function () {
                App.UI.hideMainLoading();
            });

            App.UI.showChildView('main_region', view);
        });
    },

    /**
     * New Rule UI - Pick an incoming service
     *
     * @param model
     */
    showNewRule: function (model) {
        require(['./main', './rule/new/step1'], function (App, View) {
            App.Api.Services.getAvailable()
                .then((services) => {
                    if (services.length) {
                        App.UI.showModalDialog(new View({
                            model:    model,
                            services: services
                        }));
                    } else {
                        alert('You need to add some services first');
                    }
                })
                .catch((err) => {
                    alert('Could not fetch available services: ' + err.message);
                });
        });
    },

    /**
     * New Rule UI 2 - Pick a trigger
     *
     * @param model
     */
    showNewRule2: function (model) {
        require(['./main', './rule/new/step2'], function (App, View) {
            App.UI.showModalDialog(new View({model: model}));
        });
    },

    /**
     * New Rule UI 3 - Extra trigger options
     *
     * @param model
     */
    showNewRule3: function (model) {
        require(['./main', './rule/new/step3'], function (App, View) {
            App.UI.showModalDialog(new View({model: model}));
        });
    },

    /**
     * New Rule UI 4 - Pick an outgoing service
     *
     * @param model
     */
    showNewRule4: function (model) {
        require(['./main', './rule/new/step4'], function (App, View) {
            App.Api.Services.getAvailable()
                .then((services) => {
                    App.UI.showModalDialog(new View({
                        model:    model,
                        services: services
                    }));
                })
                .catch((err) => {
                    alert('Could not fetch available services: ' + err.message);
                });
        });
    },

    /**
     * New Rule UI 5 - Pick a Template
     *
     * @param model
     */
    showNewRule5: function (model) {
        require(['./main', './rule/new/step5'], function (App, View) {
            App.Api.Templates.getAll(0, 1000, null, null, null, model.get('out_service_type'), model.get('trigger'))
                .then((templates) => {
                    App.UI.showModalDialog(new View({
                        model:     model,
                        templates: templates.data
                    }));
                })
                .catch((err) => {
                    alert('Could not fetch templates: ' + err.message);
                });
        });
    },

    /**
     * New Rule UI 6 - Template Options
     *
     * @param {Object} model
     * @param {Object} templateModel
     */
    showNewRule6: function (model, templateModel) {
        require(['./main', './rule/new/step6'], function (App, View) {
            App.UI.showModalDialog(new View({model: model, templateModel: templateModel}));
        });
    },

    /**
     * Users
     *
     * @param {Number}  [offset]
     * @param {Number}  [limit]
     * @param {String}  [sort]
     */
    showUsers: function (offset, limit, sort) {
        if (Cache.User.isAdmin()) {
            require(['./main', './users/main'], (App, View) => {
                this.navigate('/users');
                App.UI.showMainLoading();
                let view = new View({
                    sort:   (typeof sort !== 'undefined' && sort ? sort : Cache.Session.Users.sort),
                    offset: (typeof offset !== 'undefined' ? offset : Cache.Session.Users.offset),
                    limit:  (typeof limit !== 'undefined' && limit ? limit : Cache.Session.Users.limit)
                });

                view.on('loaded', function () {
                    App.UI.hideMainLoading();
                });

                App.UI.showChildView('main_region', view);
            });
        } else {
            this.showRules();
        }
    },

    /**
     * User Form
     *
     * @param model
     */
    showUserForm: function (model) {
        if (Cache.User.isAdmin() || model.get('id') === Cache.User.get('id')) {
            require(['./main', './user/form'], function (App, View) {
                App.UI.showModalDialog(new View({model: model}));
            });
        }
    },

    /**
     * User Password Form
     *
     * @param model
     */
    showUserPasswordForm: function (model) {
        if (Cache.User.isAdmin() || model.get('id') === Cache.User.get('id')) {
            require(['./main', './user/password'], function (App, View) {
                App.UI.showModalDialog(new View({model: model}));
            });
        }
    },

    /**
     * User Copy Rules Form
     *
     * @param {Object}  model
     * @param {Array}   users
     */
    showUserCopyRules: function (model, users) {
        if (Cache.User.isAdmin() || model.get('id') === Cache.User.get('id')) {
            require(['./main', './user/copy_rules'], function (App, View) {
                App.UI.showModalDialog(new View({model: model, users: users}));
            });
        }
    },

    /**
     * User Service Settings Form
     *
     * @param {Object}  model           User Model
     * @param {Array}   services        Collection of Services
     */
    showUserServiceSettingsForm: function (model, services) {
        if (Cache.User.isAdmin() || model.get('id') === Cache.User.get('id')) {
            require(['./main', './user/service-settings'], function (App, View) {
                App.UI.showModalDialog(new View({model: model, services: services}));
            });
        }
    },

    /**
     * Error
     *
     * @param {Error}   err
     * @param {String}  nice_msg
     */
    showError: function (err, nice_msg) {
        require(['./main', './error/main'], (App, View) => {
            App.UI.showChildView('main_region', new View({
                err:      err,
                nice_msg: nice_msg
            }));
        });
    },

    /**
     * Dashboard
     */
    showDashboard: function () {
        require(['./main', './dashboard/main'], (App, View) => {
            this.navigate('/');
            App.UI.showMainLoading();

            let view = new View();

            view.on('loaded', function () {
                App.UI.hideMainLoading();
            });

            App.UI.showChildView('main_region', view);
        });
    },

    /**
     * Logout
     */
    logout: function () {
        Tokens.dropTopToken();
        this.navigate('/');
        window.location = '/';
        window.location.reload();
    }
};
