// Objection Docs:
// http://vincit.github.io/objection.js/

'use strict';

const _       = require('lodash');
const db      = require('../db');
const Model   = require('objection').Model;
const Rule    = require('./rule');
const User    = require('./user');
const Service = require('./service');

Model.knex(db);

class NotificationQueue extends Model {
	$beforeInsert () {
		this.created_on  = Model.raw('NOW()');
		this.modified_on = Model.raw('NOW()');
	}

	$beforeUpdate () {
		this.modified_on = Model.raw('NOW()');
	}

	static get name () {
		return 'NotificationQueue';
	}

	static get tableName () {
		return 'notification_queue';
	}

	static get jsonAttributes () {
		return ['content'];
	}

	static get relationMappings () {
		return {
			user:        {
				relation:   Model.HasOneRelation,
				modelClass: User,
				join:       {
					from: 'notification_queue.user_id',
					to:   'user.id'
				},
				filter:     {
					is_deleted: 0
				},
				modify:     function (qb) {
					qb.omit(['is_deleted']);
				}
			},
			rule:  {
				relation:   Model.HasOneRelation,
				modelClass: Rule,
				join:       {
					from: 'notification_queue.rule_id',
					to:   'rule.id'
				},
				filter:     {
					is_deleted: 0
				},
				modify:     function (qb) {
					qb.omit(['is_deleted']);
				}
			},
			service: {
				relation:   Model.HasOneRelation,
				modelClass: Service,
				join:       {
					from: 'notification_queue.service_id',
					to:   'service.id'
				},
				filter:     {
					is_deleted: 0
				},
				modify:     function (qb) {
					qb.omit(['is_deleted']);
				}
			}
		};
	}
}

module.exports = NotificationQueue;
