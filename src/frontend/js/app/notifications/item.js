'use strict';

import Mn from 'backbone.marionette';

const template         = require('./item.ejs');
const preview_template = require('../template/preview/main.ejs');
const RuleModel        = require('../../models/rule');
const Helpers          = require('../../lib/helpers');

module.exports = Mn.View.extend({
    template:  template,
    className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rule',

    templateContext: function () {
        let view = this;
        let rule = view.model.get('rule');

        return {
            getTriggerName: function () {
                return RuleModel.Model.prototype.getTriggerName(rule.in_service.type, rule.trigger);
            },

            getPreview: function () {
                let template       = rule.template;
                template.preview   = view.model.get('content');
                template.bot_name  = view.model.get('service').name;
                template.shortTime = Helpers.shortTime;

                return preview_template(template);
            }
        };
    }
});
