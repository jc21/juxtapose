'use strict';

const Mn         = require('backbone.marionette');
const ItemView   = require('./step5-item');
const Controller = require('../../controller');

module.exports = Mn.CollectionView.extend({
    childView: ItemView,

    onChildviewSelectTemplate: function (childView) {
        this.model.set('out_template_id', childView.model.get('id'));
        Controller.showNewRule6(this.model, childView.model);
    }
});
