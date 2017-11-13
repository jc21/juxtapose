// Objection Docs:
// http://vincit.github.io/objection.js/

'use strict';

const db      = require('../db');
const Model   = require('objection').Model;
const Service = require('./service');

Model.knex(db);

class UserHasServiceData extends Model {
    $beforeInsert () {
        this.created_on  = Model.raw('NOW()');
        this.modified_on = Model.raw('NOW()');
    }

    $beforeUpdate () {
        this.modified_on = Model.raw('NOW()');
    }

    static get name () {
        return 'UserHasServiceData';
    }

    static get tableName () {
        return 'user_has_service_data';
    }

    static get jsonAttributes () {
        return ['data'];
    }

    static get relationMappings () {
        return {
            service: {
                relation:   Model.HasOneRelation,
                modelClass: Service,
                join:       {
                    from: 'user_has_service_data.service_id',
                    to:   'service.id'
                },
                filter:     {
                    is_deleted: 0
                },
                modify: function (qb) {
                    qb.omit(['is_deleted']);
                }
            }
        };
    }
}

module.exports = UserHasServiceData;
