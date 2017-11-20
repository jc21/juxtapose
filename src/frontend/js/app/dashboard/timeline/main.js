'use strict';

import Mn from 'backbone.marionette';

const ItemView  = require('./item');
const EmptyView = require('./empty');

module.exports = Mn.CollectionView.extend({
    childView: ItemView,
    emptyView: EmptyView
});
