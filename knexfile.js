module.exports = {
    development: {
        client: 'mysql',
        migrations: {
            tableName: 'migrations',
            stub: 'src/backend/lib/migrate_template.js'
        }
    },

    production: {
        client: 'mysql',
        migrations: {
            tableName: 'migrations',
            stub: 'src/backend/lib/migrate_template.js'
        }
    }
};
