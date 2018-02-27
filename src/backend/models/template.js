// Objection Docs:
// http://vincit.github.io/objection.js/

'use strict';

const _                     = require('lodash');
const db                    = require('../db');
const Model                 = require('objection').Model;
const templateRender        = require('../lib/template_render');
const TemplateHasEventModel = require('./template_has_event');

Model.knex(db);

class Template extends Model {
    $beforeInsert () {
        this.created_on  = Model.raw('NOW()');
        this.modified_on = Model.raw('NOW()');

        if (typeof this.preview !== 'undefined') {
            delete this.preview;
        }

        if (typeof this.event_types !== 'undefined') {
            delete this.event_types;
        }
    }

    $beforeUpdate () {
        this.modified_on = Model.raw('NOW()');

        if (typeof this.preview !== 'undefined') {
            delete this.preview;
        }

        if (typeof this.event_types !== 'undefined') {
            delete this.event_types;
        }
    }

    $afterGet () {
        if (this.id) {
            if (typeof this.types !== 'undefined') {
                let compact = [];
                _.map(this.types, function (item) {
                    compact.push(item.event_type);
                });
                this.event_types = compact;
            }

            return this.renderPreview()
                .then(content => {
                    this.preview = content;
                });
        }
    }

    $afterInsert () {
        if (this.id) {
            return this.renderPreview()
                .then(content => {
                    this.preview = content;
                });
        }
    }

    $afterUpdate () {
        if (this.id) {
            return this.renderPreview()
                .then(content => {
                    this.preview = content;
                });
        }
    }

    static get name () {
        return 'Template';
    }

    static get tableName () {
        return 'template';
    }

    static get jsonAttributes () {
        return ['default_options', 'example_data'];
    }

    static get relationMappings () {
        return {
            types: {
                relation:   Model.HasManyRelation,
                modelClass: TemplateHasEventModel,
                join:       {
                    from: 'template.id',
                    to:   'template_has_event.template_id'
                },
                modify:     function (qb) {
                    qb.omit(['id', 'created_on', 'modified_on', 'template_id']);
                }
            }
        };
    }

    /**
     * @returns {Promise}
     */
    renderPreview () {
        let data    = _.assign({}, this.default_options, this.example_data || {});
        let content = this.content;

        if (typeof content === 'object') {
            content = JSON.stringify(content, null, 2);
        }

        return templateRender(content, data, this.render_engine, true);
    }

}

module.exports = Template;
