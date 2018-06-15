'use strict';

const {google} = require('googleapis');

class GoogleChatBot {

    /**
     * Creates an instance of GoogleChatBot.
     *
     * @param {Object} credentials
     * @param {String} credentials.type
     * @param {String} credentials.project_id
     * @param {String} credentials.private_key_id
     * @param {String} credentials.private_key
     * @param {String} credentials.client_email
     * @param {String} credentials.client_id
     * @param {String} credentials.auth_uri
     * @param {String} credentials.token_uri
     * @param {String} credentials.auth_provider_x509_cert_url
     * @param {String} credentials.client_x509_cert_url
     */
    constructor (credentials) {
        this.authorized  = false;
        this.credentials = credentials;
        this.api         = null;

        if (typeof credentials !== 'object' || credentials === null ||
            typeof credentials.client_email === 'undefined' || !credentials.client_email ||
            typeof credentials.private_key === 'undefined' || !credentials.private_key) {

            throw new Error('Credentials are invalid');
        } else {
            // configure a JWT auth client
            this.auth = new google.auth.JWT(
                credentials.client_email,
                null,
                credentials.private_key,
                ['https://www.googleapis.com/auth/chat.bot']
            );
        }
    }

    /**
     * Authorize
     *
     * @returns {Promise}
     */
    authorize () {
        return new Promise((resolve, reject) => {
            this.auth.authorize((err, tokens) => {
                if (err) {
                    this.authorized = false;
                    reject(err);
                } else {
                    this.authorized = true;

                    this.api = google.chat({
                        version: 'v1',
                        auth:    this.auth
                    });

                    resolve(tokens);
                }
            });
        });
    }

    /**
     * @returns {boolean}
     */
    isAuthorized () {
        return this.authorized;
    }

    /**
     * Get list of Spaces
     *
     * @returns {Promise}
     */
    listSpaces () {
        return new Promise((resolve, reject) => {
            if (this.isAuthorized()) {
                resolve(this.api.spaces.list());
            } else {
                reject(new Error('Google Chat is not authenticated'));
            }
        });
    }

    /**
     * Get list of Members in a Space
     *
     * @param   {String}  space_name    ie: "spaces/AE231R"
     * @returns {Promise}
     */
    listMembers (space_name) {
        return new Promise((resolve, reject) => {
            if (this.isAuthorized()) {
                resolve(this.api.spaces.members.list({
                    parent: space_name
                }));
            } else {
                reject(new Error('Google Chat is not authenticated'));
            }
        });
    }

    /**
     * Create a Message in a Space
     *
     * @param   {String}  space_name     ie: "spaces/AE231R"
     * @param   {Object}  message
     * @param   {String}  [thread_key]   Omitting a thread will create a new thread
     * @returns {Promise}
     */
    createMessage (space_name, message, thread_key) {
        return new Promise((resolve, reject) => {
            if (this.isAuthorized()) {
                let data = {
                    parent:      space_name,
                    requestBody: message
                };

                if (thread_key) {
                    data.threadKey = thread_key;
                }

                resolve(this.api.spaces.messages.create(data));
            } else {
                reject(new Error('Google Chat is not authenticated'));
            }
        });
    }

}

module.exports = GoogleChatBot;
