'use strict';

const UserModel         = require('../models/user');
const NotificationModel = require('../models/notification');

let cache = {
    User: new UserModel.Model(),

    Session: {
        Users:         {
            sort:   'name.asc',
            offset: 0,
            limit:  100
        },
        Services:      {
            sort:   'name.asc',
            offset: 0,
            limit:  100
        },
        Rules:         {
            sort:   'priority_order.asc',
            offset: 0,
            limit:  300
        },
        Notifications: {
            sort:   'created_on.desc',
            offset: 0,
            limit:  25
        },
        Stats:         {
            last_updated:  null,
            notifications: new NotificationModel.Collection()
        }
    }
};

module.exports = cache;

