// Objection Docs:
// http://vincit.github.io/objection.js/

'use strict';

const _       = require('lodash');
const db      = require('../db');
const Model   = require('objection').Model;

Model.knex(db);

class JiraIssueStatus extends Model {
	$beforeInsert () {
		this.created_on  = Model.raw('NOW()');
		this.modified_on = Model.raw('NOW()');
	}

	$beforeUpdate () {
		this.modified_on = Model.raw('NOW()');
	}

	static get name () {
		return 'JiraIssueStatus';
	}

	static get tableName () {
		return 'jira_issue_status';
	}

}

module.exports = JiraIssueStatus;
