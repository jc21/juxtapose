'use strict';

const ejs = require('ejs');

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
 * @param   {Boolean}       [for_preview]
 * @returns {String|Object}
 */
module.exports = function (content, data, for_preview) {
    let return_as = 'string';

    if (typeof content === 'object') {
        content   = JSON.stringify(content, null, 2);
        return_as = 'object';
    }

    data.prettyPrint = function (val) {
        return JSON.stringify(val, null, 2).replace(/\r/gim, '\\r').replace(/\n/gim, '\\n');
    };

    content = ejs.render(content, data, {});

    if (for_preview) {
        content = replacePreviewLinks(content);
    } else {
        // decode html entities while respecting json
        content = content.replace(/&#34;/gim, '\\"');
    }

    if (return_as === 'object') {
        content = JSON.parse(content);

        if (!content) {
            throw new Error('Content contains invalid JSON');
        }
    }

    return content;
};
