const winston = require('winston');

winston.remove(winston.transports.Console);

winston.add(winston.transports.Console, {
    colorize:    true,
    timestamp:   true,
    prettyPrint: true,
    depth:       3
});

winston.setLevels({
    error:             0,
    warn:              1,
    info:              2,
    success:           2,
    migrate:           2,
    service_worker:    2,
    jira_webhook:      2,
    bitbucket_webhook: 2,
    verbose:           3,
    debug:             4
});

winston.addColors({
    error:             'red',
    warn:              'yellow',
    info:              'cyan',
    success:           'green',
    migrate:           'blue',
    service_worker:    'green',
    jira_webhook:      'magenta',
    bitbucket_webhook: 'blue',
    verbose:           'blue',
    debug:             'magenta'
});

module.exports = winston;
