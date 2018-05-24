const {Signale} = require('signale');

module.exports = {
    global:    new Signale({scope: 'Global   '}),
    migrate:   new Signale({scope: 'Migrate  '}),
    services:  new Signale({scope: 'Services '}),

    // Specific services
    bitbucket: new Signale({scope: 'Bitbucket'}),
    jira:      new Signale({scope: 'Jira     '}),
    dockerhub: new Signale({scope: 'DockerHub'}),
    zendesk:   new Signale({scope: 'Zendesk  '})
};
