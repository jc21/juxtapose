'use strict';

const Mn           = require('backbone.marionette');
const Api          = require('../api');
const Cache        = require('../cache');
const template     = require('./main.ejs');
const moment       = require('moment');
const TimelineView = require('./timeline/main');
const Controller   = require('../controller');

module.exports = Mn.View.extend({
    template: template,
    id:       'dashboard',

    refreshTimer: null,

    ui: {
        timeline_region: 'div.timeline-region',
        refresh:         '.refresh'
    },

    regions: {
        timeline_region: '@ui.timeline_region'
    },

    events: {
        'click @ui.refresh': function (e) {
            e.preventDefault();
            this.updateStats(true);
        }
    },

    updateStats: function (force) {
        let view = this;

        if (force || !Cache.Session.Stats.last_updated || Cache.Session.Stats.last_updated < moment().subtract(3, 'm').unix()) {
            view.ui.refresh.html('<i class="fa fa-spinner fa-spin"></i>');

            Api.Notifications.getAll(0, 6, 'created_on.desc', ['rule.[template, in_service]', 'service'])
                .then(response => {
                    Cache.Session.Stats.notifications.reset(response.data);
                    Cache.Session.Stats.last_updated = moment().unix();
                    view.renderStats();
                })
                .catch((err) => {
                    Controller.showError(err, 'Could not fetch Notifications');
                });
        } else {
            view.renderStats();
        }
    },

    renderStats: function () {
        this.ui.refresh.html('Refresh');

        if (!this.isDestroyed()) {
            this.showChildView('timeline_region', new TimelineView({
                collection: Cache.Session.Stats.notifications
            }));

            this.trigger('loaded');
        }
    },

    onRender: function () {
        let view = this;
        view.updateStats();

        // Update stats every 60 secs
        view.refreshTimer = setInterval(function () {
            view.updateStats(true);
        }, 60000);
    },

    onDestroy: function () {
        clearInterval(this.refreshTimer);
    }
});

