// Objection Docs:
// http://vincit.github.io/objection.js/

'use strict';

const _              = require('lodash');
const db             = require('../db');
const Model          = require('objection').Model;
const User           = require('./user');
const Service        = require('./service');
const Template       = require('./template');
const templateRender = require('../lib/template_render');

Model.knex(db);

class Rule extends Model {
	$beforeInsert () {
		this.created_on  = Model.raw('NOW()');
		this.modified_on = Model.raw('NOW()');
	}

	$beforeUpdate () {
		this.modified_on = Model.raw('NOW()');
	}

	$afterGet (context) {
		if (typeof this.template !== 'undefined') {
			let data = _.assign({}, this.template.default_options, this.template.example_data, this.out_template_options);
			return templateRender(this.template.content, data, this.template.render_engine, true)
				.then(content => {
					this.preview = content;
				});
		}
	}

	static get name () {
		return 'Rule';
	}

	static get tableName () {
		return 'rule';
	}

	static get jsonAttributes () {
		return ['extra_conditions', 'out_template_options'];
	}

	static get relationMappings () {
		return {
			user:            {
				relation:   Model.HasOneRelation,
				modelClass: User,
				join:       {
					from: 'rule.user_id',
					to:   'user.id'
				},
				filter:     {
					is_deleted: 0
				},
				modify:     function (qb) {
					qb.omit(['is_deleted']);
				}
			},
			in_service:      {
				relation:   Model.HasOneRelation,
				modelClass: Service,
				join:       {
					from: 'rule.in_service_id',
					to:   'service.id'
				},
				filter:     {
					is_deleted: 0
				},
				modify:     function (qb) {
					qb.omit(['is_deleted', 'data']);
				}
			},
			in_service_data: {
				relation:   Model.HasOneRelation,
				modelClass: Service,
				join:       {
					from: 'rule.in_service_id',
					to:   'service.id'
				},
				filter:     {
					is_deleted: 0
				},
				modify:     function (qb) {
					qb.omit(['is_deleted']);
				}
			},
			out_service:     {
				relation:   Model.HasOneRelation,
				modelClass: Service,
				join:       {
					from: 'rule.out_service_id',
					to:   'service.id'
				},
				filter:     {
					is_deleted: 0
				},
				modify:     function (qb) {
					qb.omit(['is_deleted', 'data']);
				}
			},
			template:        {
				relation:   Model.HasOneRelation,
				modelClass: Template,
				join:       {
					from: 'rule.out_template_id',
					to:   'template.id'
				}
			}
		};
	}
}

module.exports = Rule;
