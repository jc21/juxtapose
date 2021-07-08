'use strict';

const _                     = require('lodash');
const error                 = require('../lib/error');
const templateModel         = require('../models/template');
const templateHasEventModel = require('../models/template_has_event');
const templateRender        = require('../lib/template_render');

function omissions () {
	return ['is_deleted', 'types'];
}

const internalTemplate = {

	/**
	 * @param   {Access}  access
	 * @param   {Object}  data
	 * @returns {Promise}
	 */
	create: (access, data) => {
		if (typeof data.is_disabled !== 'undefined') {
			data.is_disabled = data.is_disabled ? 1 : 0;
		}
		return access.can('templates:create', data)
			.then(() => {
				return internalTemplate.createRaw(data);
			})
			.then(template => {
				return internalTemplate.get(access, {id: template.id});
			});
	},

	/**
	 * @param   {Object}  data
	 * @returns {Promise}
	 */
	createRaw: data => {
		if (typeof data.is_disabled !== 'undefined') {
			data.is_disabled = data.is_disabled ? 1 : 0;
		}

		let event_types = null;

		if (typeof data.event_types !== 'undefined') {
			event_types = data.event_types;
			delete data.event_types;
		}

		return new Promise((resolve, reject) => {
			// This should fail if it can't compile
			try {
				templateRender(data.content, _.assign({}, data.example_data, data.default_options));
			} catch (err) {
				reject(new Error('Template failed to compile. Check all wildcards are correct.'));
				return;
			}

			resolve(templateModel
				.query()
				.omit(omissions())
				.insertAndFetch(data));
		})
			.then(template => {
				if (event_types !== null) {
					return internalTemplate.saveEventTypes(template.id, event_types)
						.then(() => {
							return template;
						});
				} else {
					return template;
				}
			});
	},

	/**
	 * @param  {Access}  access
	 * @param  {Object}  data
	 * @param  {Integer} data.id
	 * @param  {String}  [data.service_type]
	 * @param  {String}  [data.content]
	 * @param  {String}  [data.default_options]
	 * @param  {String}  [data.example_data]
	 * @param  {Array}   [data.event_types]
	 * @return {Promise}
	 */
	update: (access, data) => {
		return access.can('templates:update', data.id)
			.then(() => {

				// This should fail if it can't compile
				if (typeof data.content !== 'undefined' && typeof data.example_data !== 'undefined' && typeof data.default_options !== 'undefined') {
					try {
						templateRender(data.content, _.assign({}, data.example_data, data.default_options));
					} catch (err) {
						throw new Error('Template failed to compile. Check all wildcards are correct.');
					}
				}

				let event_types = null;

				if (typeof data.event_types !== 'undefined') {
					event_types = data.event_types;
					delete data.event_types;
				}

				return templateModel
					.query()
					.patch(data)
					.where('id', data.id)
					.then(() => {
						if (event_types !== null) {
							return internalTemplate.saveEventTypes(data.id, event_types);
						} else {
							return null;
						}
					})
					.then(() => {
						return internalTemplate.get(access, {id: data.id});
					});
			});
	},

	/**
	 * @param  {Access}   access
	 * @param  {Object}   data
	 * @param  {Integer}  data.id
	 * @param  {Array}    [data.expand]
	 * @param  {Array}    [data.omit]
	 * @return {Promise}
	 */
	get: (access, data) => {
		return access.can('templates:get', data.id)
			.then(() => {
				return internalTemplate.getRaw(data);
			});
	},

	/**
	 * @param  {Object}   data
	 * @param  {Integer}  data.id
	 * @param  {Array}    [data.expand]
	 * @param  {Array}    [data.omit]
	 * @return {Promise}
	 */
	getRaw: data => {
		let query = templateModel
			.query()
			.where('id', data.id)
			.allowEager('[types]')
			.eager('[types]')
			.first();

		if (typeof data.omit !== 'undefined' && data.omit !== null) {
			query.omit(data.omit);
		}

		return query
			.then(template => {
				if (template) {
					return _.omit(template, omissions());
				} else {
					throw new error.ItemNotFoundError(data.id);
				}
			});
	},

	/**
	 * @param {Access}  access
	 * @param {Object}  data
	 * @param {Integer} data.id
	 * @param {String}  [data.reason]
	 * @returns {Promise}
	 */
	delete: (access, data) => {
		return access.can('templates:delete', data.id)
			.then(() => {
				return internalTemplate.get(access, {id: data.id});
			})
			.then((template) => {
				if (!template) {
					throw new error.ItemNotFoundError(data.id);
				}

				return templateModel
					.query()
					.where('id', template.id)
					.patch({
						is_deleted: 1
					})
					.then(() => {
						return true;
					});
			});
	},

	/**
	 * This will only count the templates
	 *
	 * @param {Access}  access
	 * @param {String}  [service_type]
	 * @returns {*}
	 */
	getCount: (access, service_type) => {
		return access.can('templates:list')
			.then(() => {
				let query = templateModel
					.query()
					.count('id as count')
					.where('is_deleted', 0)
					.first('count');

				if (typeof service_type !== 'undefined' && service_type) {
					query.where('service_type', service_type);
				}

				return query;
			})
			.then((row) => {
				return parseInt(row.count, 10);
			});
	},

	/**
	 * All templates
	 *
	 * @param   {Access}  access
	 * @param   {Integer} [start]
	 * @param   {Integer} [limit]
	 * @param   {Array}   [sort]
	 * @param   {Array}   [expand]
	 * @param   {String}  [service_type]
	 * @param   {String}  [event_type]
	 * @returns {Promise}
	 */
	getAll: (access, start, limit, sort, expand, service_type, event_type) => {
		return access.can('templates:list')
			.then(() => {
				let query = templateModel
					.query()
					.where('is_deleted', 0)
					.limit(limit ? limit : 200)
					.omit(omissions())
					.allowEager('[types]')
					.eager('[types]');

				if (typeof event_type !== 'undefined' && event_type) {
					query.where('id', 'in', templateHasEventModel.query()
						.select('template_id')
						.where('event_type', event_type)
					);
				}

				if (typeof service_type !== 'undefined' && service_type) {
					query.where('service_type', service_type);
				}

				if (typeof start !== 'undefined' && start !== null) {
					query.offset(start);
				}

				if (typeof sort !== 'undefined' && sort !== null) {
					_.map(sort, item => {
						query.orderBy(item.field, item.dir);
					});
				} else {
					query.orderBy('created_on', 'DESC');
				}

				return query;
			});
	},

	/**
	 * delete from event_types
	 * add new event_types
	 *
	 * @param   {Integer}  template_id
	 * @param   {Array}    event_types
	 * @returns {Promise}
	 */
	saveEventTypes: (template_id, event_types) => {
		return templateHasEventModel
			.query()
			.delete()
			.where('template_id', template_id)
			.then(() => {
				let promises = [];

				_.map(event_types, function (event_type) {
					promises.push(templateHasEventModel
						.query()
						.insert({
							template_id: template_id,
							event_type:  event_type
						})
					);
				});

				return Promise.all(promises);
			});
	}
};

module.exports = internalTemplate;
