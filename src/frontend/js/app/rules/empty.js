'use strict';

import Mn from 'backbone.marionette';

module.exports = Mn.View.extend({
    template: function () {
        return '<p class="text-center">You have no rules. Why not create one?</p>';
    }
});
