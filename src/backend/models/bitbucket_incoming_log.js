// Objection Docs:
// http://vincit.github.io/objection.js/

'use strict';

const _     = require('lodash');
const db    = require('../db');
const Model = require('objection').Model;

Model.knex(db);

class BitbucketIncomingLog extends Model {
    $beforeInsert () {
        this.created_on  = Model.raw('NOW()');
        this.modified_on = Model.raw('NOW()');
    }

    $beforeUpdate () {
        this.modified_on = Model.raw('NOW()');
    }

    static get name () {
        return 'BitbucketIncomingLog';
    }

    static get tableName () {
        return 'bitbucket_incoming_log';
    }

    static get jsonAttributes () {
        return ['data'];
    }

}

module.exports = BitbucketIncomingLog;
