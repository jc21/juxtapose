'use strict';

const _      = require('lodash');
const ejs    = require('ejs');
const liquid = require('liquidjs')();

liquid.registerFilter('unescape', v => _.unescape(v));
liquid.registerFilter('jsonstring', v => JSON.stringify(v));

/**
 * @param   {String}  content
 * @returns {String}
 */
const replacePreviewLinks = function (content) {
    return content.replace(/<(http[^>|]+)\|([^>]+)>/gim, '<a href=\'$1\'>$2</a>');
};

/**
 * @param   {Object|String} content
 * @param   {Object}        data
 * @param   {String}        engine    'ejs' or 'liquid'
 * @param   {Boolean}       [for_preview]
 * @returns {Promise}
 */
module.exports = async function (content, data, engine, for_preview) {
    if (typeof content === 'object') {
        content = JSON.stringify(content, null, 2);
    }

    data.prettyPrint = function (val) {
        return JSON.stringify(val, null, 2).replace(/\r/gim, '\\r').replace(/\n/gim, '\\n');
    };

    if (engine === 'ejs') {
        content = ejs.render(content, data, {});
    } else {
        // Liquid is now the default
        content = await liquid.parseAndRender(content, data);
    }

    if (for_preview) {
        content = replacePreviewLinks(content);
    } else {
        // decode html entities while respecting json
        content = content.replace(/&#34;/gim, '\\"');
    }

    return content;
};
