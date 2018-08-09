'use strict';

const Mn = require('backbone.marionette');

module.exports = Mn.View.extend({
    template: function () {
        return '<p class="text-center">There are no Services :(</p>';
    }
});
