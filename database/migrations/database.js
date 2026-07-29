require('dotenv').config();

module.exports = {
    database_url: process.env.DATABASE_URL || 'postgresql://fammusic_app:password@localhost:5432/fam_music',
    migrations_table: 'pgmigrations',
    dir: 'migrations',
    schema: 'public',
    check_order: true,
    ignore_pattern: '\\..*',
    run_in_transaction: true
};
