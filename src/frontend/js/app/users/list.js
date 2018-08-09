'use strict';

const Mn         = require('backbone.marionette');
const template   = require('./list.ejs');
const ItemView   = require('./list-item');
const Controller = require('../controller');

const TableBody = Mn.CollectionView.extend({
    tagName:   'tbody',
    childView: ItemView
});

module.exports = Mn.View.extend({
    tagName:   'table',
    className: 'table table-condensed',
    template:  template,

    defaults: {
        sort:       'created_on',
        pagination: null //  needed for header sorting or not?
    },

    regions: {
        body: {
            el:             'tbody',
            replaceElement: true
        }
    },

    ui: {
        header_links: 'thead a'
    },

    templateContext: function () {
        let view = this;

        return {
            getSortWedgeClass: function (field) {
                let current       = view.options.sort.split('.');
                let current_field = current.shift();

                if (field === current_field) {
                    if (!current.length || current.pop() !== 'desc') {
                        return 'sort-asc';
                    }

                    return 'sort-desc';
                }

                // No wedge for you
                return '';
            }
        };
    },

    events: {
        'click @ui.header_links': function (e) {
            e.preventDefault();

            try {
                let new_field = e.currentTarget.href.split('#').pop();

                // Change the dir if the same column being selected
                let current       = this.options.sort.split('.');
                let current_field = current.shift();
                let new_dir       = 'asc';

                if (current_field === new_field) {
                    if (!current.length || current.pop() !== 'desc') {
                        new_dir = 'desc';
                    }
                }

                Controller.showUsers(0, this.options.pagination.limit, new_field + '.' + new_dir);
            } catch (err) {
                console.log(err);
            }
        }
    },

    onRender: function () {
        this.showChildView('body', new TableBody({
            collection: this.collection
        }));
    }
});
