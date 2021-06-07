// Objection Docs:
// http://vincit.github.io/objection.js/

'use strict';

const db                 = require('../db');
const Model              = require('objection').Model;
const UserHasServiceData = require('./user_has_service_data');
const Service            = require('./service');

Model.knex(db);

class User extends Model {
	$beforeInsert () {
		this.created_on  = Model.raw('NOW()');
		this.modified_on = Model.raw('NOW()');
	}

	$beforeUpdate () {
		this.modified_on = Model.raw('NOW()');
	}

	static get name () {
		return 'User';
	}

	static get tableName () {
		return 'user';
	}

	static get jsonAttributes () {
		return ['roles'];
	}

	static get relationMappings () {
		return {
			services: {
				relation:   Model.ManyToManyRelation,
				modelClass: Service,
				join:       {
					from:    'user.id',
					through: {
						modelClass: UserHasServiceData,
						from:       'user_has_service_data.user_id',
						to:         'user_has_service_data.service_id',
						extra:      ['service_username', 'data']
					},
					to:      'service.id'
				},
				modify: function (qb) {
					qb.omit(['user_id', 'created_on', 'modified_on']);
				}
			}
		};
	}
}

module.exports = User;
