// Objection Docs:
// http://vincit.github.io/objection.js/

'use strict';

const db       = require('../db');
const Model    = require('objection').Model;

Model.knex(db);

class TemplateHasEvent extends Model {
	$beforeInsert () {
		this.created_on  = Model.raw('NOW()');
		this.modified_on = Model.raw('NOW()');
	}

	$beforeUpdate () {
		this.modified_on = Model.raw('NOW()');
	}

	static get name () {
		return 'TemplateHasEvent';
	}

	static get tableName () {
		return 'template_has_event';
	}
}

module.exports = TemplateHasEvent;
