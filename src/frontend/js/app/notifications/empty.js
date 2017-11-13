'use strict';

import Mn from 'backbone.marionette';

module.exports = Mn.View.extend({
    template: function () {
        return '<p class="text-center">You have not been sent any notifications yet.</p>';
    }
});
