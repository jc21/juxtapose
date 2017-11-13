'use strict';

import Backbone from 'backbone';

const model = Backbone.Model.extend({
    idAttribute: 'id',

    defaults: function () {
        return {

        };
    }
});

module.exports = {
    Model:      model,
    Collection: Backbone.Collection.extend({
        model: model
    })
};
