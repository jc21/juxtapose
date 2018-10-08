'use strict';

const Push       = require('pushover-notifications');
const ProxyAgent = require('proxy-agent');

class Pushover {

    /**
     * Constructor
     *
     * @param {String} [app_token]
     */
    constructor (app_token) {
        this.app_token = app_token || 'a3xn9sya41d53y17j26yh1zrr84sab';

        let config = {
            token: this.app_token
        };

        if (typeof process.env.HTTP_PROXY !== 'undefined' && process.env.HTTP_PROXY) {
            config.httpOptions = {
                agent: ProxyAgent(process.env.HTTP_PROXY)
            };
        }

        this.api = new Push(config);
    }

    /**
     * @param   {String}          user_token
     * @param   {Object|String}   content
     * @param   {String}          content.message
     * @param   {String}          content.title
     * @param   {String}          [content.sound]
     * @param   {String|Number}   [content.priority]
     * @returns {Promise}
     */
    sendMessage (user_token, content) {
        return new Promise((resolve, reject) => {

            if (typeof content === 'string') {
                content = {
                    message: content
                };
            }

            let msg = {
                user:    user_token,
                title:   content.title || 'Juxtapose',
                message: content.message
            };

            if (typeof content.sound !== 'undefined' && content.sound) {
                msg.sound = content.sound;
            }

            if (typeof content.priority !== 'undefined' && content.priority) {
                switch (content.priority) {
                    case 'lowest':
                        content.priority = -2;
                        break;
                    case 'low':
                        content.priority = -1;
                        break;
                    case 'default':
                        content.priority = 0;
                        break;
                    case 'high':
                        content.priority = 1;
                        break;
                    case 'emergency':
                        content.priority = 2;
                        break;
                }

                msg.priority = content.priority;
            }

            this.api.send(msg, function (err, result) {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    }
}

module.exports = Pushover;
