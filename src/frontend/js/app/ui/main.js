'use strict';

const Mn         = require('backbone.marionette');
const template   = require('./main.ejs');
const HeaderView = require('./header/main');
const SideView   = require('./side/main');
const Cache      = require('../cache');

require('bootstrap');

module.exports = Mn.View.extend({
    template: template,

    modal: null,

    ui: {
        header_region:      '#header',
        side_region:        '#side',
        main_region:        '#main',
        modal_region:       '#modal-dialog',
        main_loader_region: '#main-loader'
    },

    regions: {
        header_region:      '@ui.header_region',
        side_region:        '@ui.side_region',
        main_region:        '@ui.main_region',
        modal_region:       '@ui.modal_region',
        main_loader_region: '@ui.main_loader_region'
    },

    showMainLoading: function () {
        this.ui.main_loader_region.show();
    },

    hideMainLoading: function () {
        this.ui.main_loader_region.hide();
    },

    /**
     *
     * @param view
     * @param [show_callback]
     * @param [shown_callback]
     */
    showModalDialog: function (view, show_callback, shown_callback) {
        this.showChildView('modal_region', view);
        this.modal.modal('show');

        let ui = this;

        this.modal.on('hidden.bs.modal', function (/*e*/) {
            if (show_callback) {
                ui.modal.off('show.bs.modal', show_callback);
            }

            if (shown_callback) {
                ui.modal.off('shown.bs.modal', shown_callback);
            }

            ui.modal.off('hidden.bs.modal');
            view.destroy();
        });

        if (show_callback) {
            this.modal.on('show.bs.modal', show_callback);
        }

        if (shown_callback) {
            this.modal.on('shown.bs.modal', shown_callback);
        }
    },

    /**
     *
     * @param [hidden_callback]
     */
    closeModal: function (hidden_callback) {
        this.modal.modal('hide');

        if (hidden_callback) {
            this.modal.on('hidden.bs.modal', hidden_callback);
        }
    },

    onRender: function () {
        this.showChildView('header_region', new HeaderView({
            model: Cache.User
        }));

        this.showChildView('side_region', new SideView());

        this.ui.main_region.addClass('full-ui');

        if (this.modal === null) {
            this.modal = $('#modal-dialog');
            this.modal.modal({
                show: false
            });
        }
    },

    reset: function () {
        this.ui.main_region.removeClass('full-ui');
        this.getRegion('header_region').reset();
        this.getRegion('side_region').reset();
        this.getRegion('modal_region').reset();
    }
});
