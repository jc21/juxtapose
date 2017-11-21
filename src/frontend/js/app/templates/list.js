'use strict';

import Mn from 'backbone.marionette';

const ItemView = require('./item');

module.exports = Mn.CollectionView.extend({
    childView: ItemView
});
