'use strict';

const _            = require('lodash');
const EventEmitter = require('events').EventEmitter;
const xmpp         = require('node-xmpp');
const Stanza       = xmpp.Stanza;

const NS_CHATSTATES = 'http://jabber.org/protocol/chatstates';

const GenericError = function (code, message) {
    Error.captureStackTrace(this, this.constructor);
    this.name    = this.constructor.name;
    this.message = message;
    this.code    = code;
};

/**
 * @param   {Object}  options
 * @param   {String}  options.host
 * @param   {Integer} options.port
 * @param   {String}  options.jid
 * @param   {String}  options.password
 * @returns {xmpp.Client|client}
 */
module.exports = function (options) {
    options.autostart = false;

    this.online = false;
    this.client = new xmpp.Client(options);
    this.events = new EventEmitter();

    this._whoami        = null;
    this._is_google     = options.host === 'talk.google.com';
    this._capabilities  = {};
    this._cap_buddies   = {};
    this._iq_callbacks  = {};
    this._probe_buddies = {};
    this._joined_rooms  = {};

    /***************************/
    /* Events                  */
    /***************************/

    /**
     * Add Event Listener
     *
     * @param  {String}   ev
     * @param  {Function} cb
     */
    this.on = function (ev, cb) {
        this.events.on.apply(this.events, Array.prototype.slice.call(arguments));
    };

    /**
     * Remove Event Listener
     */
    this.removeListener = function () {
        this.events.removeListener.apply(events, Array.prototype.slice.call(arguments));
    };

    /**
     * Online event
     */
    this.client.on('online', data => {
        this.client.send(new Stanza('presence'));
        this.online = true;
        this.events.emit('online', data);

        this._whoami = data;

        this.getRoster();

        // keepalive
        if (this.client.connection.socket) {
            this.client.connection.socket.setTimeout(0);
            this.client.connection.socket.setKeepAlive(true, 10000);
        }
    });

    /**
     * Close event
     */
    this.client.on('close', data => {
        this.online = false;
        this.events.emit('close', data);
    });

    /**
     * Error event
     */
    this.client.on('error', err => {
        this.events.emit('error', err);
    });

    /**
     * Status event
     */
    this.client.on('status', (status, value) => {
        this.events.emit('status', status, value);
    });

    /**
     * Stanza event, which we'll farm out to other events
     */
    this.client.on('stanza', stanza => {
        this.events.emit('stanza', stanza);

        // Detect uncaught errors
        if (typeof stanza.attrs.type !== 'undefined' && stanza.attrs.type === 'error') {
            let elm = stanza.getChildren('error').shift();
            this.events.emit('error', new GenericError(parseInt(elm.attrs.code, 10), elm.getChildText('text')));

        } else {
            // INCOMING MESSAGE
            if (stanza.is('message')) {
                if (stanza.attrs.type === 'chat') {
                    let body = stanza.getChild('body');
                    if (body) {
                        let message = body.getText();
                        let from    = stanza.attrs.from;
                        let id      = from.split('/')[0];
                        this.events.emit('chat', id, message);
                    }

                    let chatstate = stanza.getChildByAttr('xmlns', NS_CHATSTATES);
                    if (chatstate) {
                        this.events.emit('chatstate', stanza.attrs.from, chatstate.name);
                    }

                } else if (stanza.attrs.type === 'groupchat') {
                    let body = stanza.getChild('body');
                    if (body) {
                        let message    = body.getText();
                        let from       = stanza.attrs.from;
                        let conference = from.split('/')[0];
                        let id         = from.split('/')[1];
                        let stamp      = null;
                        let delay      = null;

                        if (stanza.getChild('x') && stanza.getChild('x').attrs.stamp) {
                            stamp = stanza.getChild('x').attrs.stamp;
                        }

                        if (stanza.getChild('delay')) {
                            delay = {
                                stamp:    stanza.getChild('delay').attrs.stamp,
                                from_jid: stanza.getChild('delay').attrs.from_jid
                            };
                        }

                        this.events.emit('groupchat', conference, id, message, stamp, delay);
                    }
                }

                // PRESENCE
            } else if (stanza.is('presence')) {
                let from = stanza.attrs.from;

                if (from) {
                    if (stanza.attrs.type === 'subscribe') {
                        //handling incoming subscription requests
                        this.events.emit('subscribe', from);
                    } else if (stanza.attrs.type === 'unsubscribe') {
                        //handling incoming unsubscription requests
                        this.events.emit('unsubscribe', from);
                    } else {
                        // l
                        // looking for presence stanza for availability changes
                        let id          = from.split('/')[0];
                        let resource    = from.split('/')[1];
                        let status_text = stanza.getChildText('status');
                        let state       = (stanza.getChild('show')) ? stanza.getChild('show').getText() : 'online';

                        state = state === 'chat' ? 'online' : state;
                        state = stanza.attrs.type === 'unavailable' ? 'offline' : state;

                        //checking if this is based on probe
                        if (this._probe_buddies[id]) {
                            this.events.emit('probe_' + id, state, status_text);
                            delete this._probe_buddies[id];
                        } else {
                            //specifying roster changes
                            if (this._joined_rooms[id]) {
                                let groupBuddy = from.split('/')[1];
                                this.events.emit('groupbuddy', id, groupBuddy, state, status_text);
                            } else {
                                this.events.emit('buddy', id, state, status_text, resource);
                            }
                        }

                        // Check if capabilities are provided
                        let caps = stanza.getChild('c', 'http://jabber.org/protocol/caps');
                        if (caps) {
                            let node = caps.attrs.node;
                            let ver  = caps.attrs.ver;

                            if (ver) {
                                let full_node = node + '#' + ver;

                                // Check if it's already been cached
                                if (this._capabilities[full_node]) {
                                    this.events.emit('buddyCapabilities', id, this._capabilities[full_node]);
                                } else {
                                    // Save this buddy so we can send the capability data when it arrives
                                    if (!this._cap_buddies[full_node]) {
                                        this._cap_buddies[full_node] = [];
                                    }

                                    this._cap_buddies[full_node].push(id);

                                    let get_caps = new Stanza('iq', {id: 'disco1', to: from, type: 'get'});
                                    get_caps.c('query', {
                                        xmlns: 'http://jabber.org/protocol/disco#info',
                                        node:  full_node
                                    });

                                    this.client.send(get_caps);
                                }
                            }
                        }
                    }
                }

                // ROSTER
            } else if (stanza.is('iq')) {
                if (stanza.getChild('ping', 'urn:xmpp:ping')) {
                    this.client.send(new Stanza('iq', {
                        id:   stanza.attrs.id,
                        to:   stanza.attrs.from,
                        type: 'result'
                    }));

                } else if (stanza.attrs.id === 'disco1') {

                    // Response to capabilities request?
                    let query = stanza.getChild('query', 'http://jabber.org/protocol/disco#info');

                    // Ignore it if there's no <query> element - Not much we can do in this case!
                    if (!query) {
                        return;
                    }

                    let node     = query.attrs.node;
                    let identity = query.getChild('identity');
                    let features = query.getChildren('feature');

                    let result = {
                        clientName: identity && identity.attrs.name,
                        features:   features.map(function (feature) {
                            return feature.attrs['var'];
                        })
                    };

                    this._capabilities[node] = result;

                    // Send it to all buddies that were waiting
                    if (this._cap_buddies[node]) {
                        this._cap_buddies[node].forEach((id) => {
                            this.events.emit('buddyCapabilities', id, result);
                        });
                        delete this._cap_buddies[node];
                    }

                } else if (stanza.attrs.id === 'roster_0' || stanza.attrs.id === 'google-roster-1') {
                    let children = stanza.getChildren('query');
                    let roster   = [];

                    _.map(children, child => {
                        let people = child.getChildren('item');
                        _.map(people, person => {
                            roster.push(person.attrs);
                        });
                    });

                    this.events.emit('roster', roster);
                }

                let cb = this._iq_callbacks[stanza.attrs.id];
                if (cb) {
                    cb(stanza);
                    delete this._iq_callbacks[stanza.attrs.id];
                }
            }
        }
    });

    /********************************/
    /* Methods                      */
    /********************************/

    /**
     * Connect!
     */
    this.connect = () => {
        this.client.connect();
    };

    /**
     * Get Roster
     */
    this.getRoster = () => {
        let roster;

        if (this._is_google) {
            roster = new Stanza('iq', {
                id:   'google-roster-1',
                type: 'get',
                from: this._whoami.jid._local + '@' + this._whoami.jid._domain + '/' + this._whoami.jid._resource
            });

            roster.c('query', {xmlns: 'jabber:iq:roster', 'xmlns:gr': 'google:roster', 'gr:ext': '2'});
        } else {
            roster = new Stanza('iq', {
                id:   'roster_0',
                type: 'get'
            });

            roster.c('query', {xmlns: 'jabber:iq:roster'});
        }

        this.client.send(roster);
    };

    /**
     * Send a message to a user or group
     *
     * @param {String}  to
     * @param {String}  message
     * @param {Boolean} group
     */
    this.send = function (to, message, group) {
        let stanza = new xmpp.Stanza('message', {
            to:   to,
            type: (group ? 'groupchat' : 'chat')
        });

        stanza.c('body').t(message);

        this.client.send(stanza);
    };

    /**
     *
     * @param {String}   show         "online" | "away" | "dnd" | "xa" | "offline"
     * @param {String}   status
     * @param {Integer}  [priority]
     */
    this.setPresence = (show, status, priority) => {
        let stanza = new Stanza('presence');
        if (show && show !== 'online') {
            stanza.c('show').t(show);
        }

        if (typeof(status) !== 'undefined') {
            stanza.c('status').t(status);
        }

        if (typeof priority !== 'undefined') {
            if (typeof priority !== 'number') {
                priority = 0;
            } else if (priority < -128) {
                priority = -128;
            } else if (priority > 127) {
                priority = 127;
            }
            stanza.c('priority').t(parseInt(priority, 10));
        }

        this.client.send(stanza);
    };

    /**
     * @param {String}  to
     * @param {String}  [password]
     */
    this.join = (to, password) => {
        let room = to.split('/')[0];
        if (!this._joined_rooms[room]) {
            this._joined_rooms[room] = true;
        }

        let stanza = new Stanza('presence', {to: to}).c('x', {xmlns: 'http://jabber.org/protocol/muc'});

        // XEP-0045 7.2.6 Password-Protected Rooms
        if (password) {
            stanza.c('password').t(password);
        }

        this.client.send(stanza);
    };

    /**
     * @param {String}  to
     * @param {String}  room
     * @param {String}  [reason]
     */
    this.invite = (to, room, reason) => {
        let stanza = new Stanza('message', {to: room}).c('x', {xmlns: 'http://jabber.org/protocol/muc#user'}).c('invite', {to: to});

        if (reason) {
            stanza.c('reason').t(reason);
        }

        this.client.send(stanza);
    };

    /**
     * @param {String} to
     */
    this.subscribe = to => {
        this.client.send(new Stanza('presence', {
            to:   to,
            type: 'subscribe'
        }));
    };

    /**
     * @param {String} to
     */
    this.unsubscribe = to => {
        this.client.send(new Stanza('presence', {
            to:   to,
            type: 'unsubscribe'
        }));
    };

    /**
     * @param {String}  to
     */
    this.acceptSubscription = to => {
        // Send a 'subscribed' notification back to accept the incoming
        // subscription request
        this.client.send(new Stanza('presence', {
            to:   to,
            type: 'subscribed'
        }));
    };

    /**
     * @param {String}  to
     */
    this.acceptUnsubscription = to => {
        this.client.send(new Stanza('presence', {
            to:   to,
            type: 'unsubscribed'
        }));
    };

    /**
     * @param {String} to
     * @param {String} state     "active" | "composing" | "paused" | "inactive" | "gone"
     */
    this.setChatstate = (to, state) => {
        this.client.send(new Stanza('message', {to: to}).c(state, {xmlns: NS_CHATSTATES}).up());
    };

    /**
     * Disconnect
     */
    this.disconnect = function () {
        if (this.online) {
            let stanza = new Stanza('presence', {type: 'unavailable'});
            stanza.c('status').t('Logged out');
            this.client.send(stanza);
        }

        let ref = this.client.connection;
        if (ref.socket.writable) {
            if (ref.streamOpened) {
                ref.socket.write('</stream:stream>');
                delete ref.streamOpened;
            } else {
                ref.socket.end();
            }
        }
    };

    return this;
};
