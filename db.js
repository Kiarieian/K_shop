const { Pool } = require('pg');

//manage connection to the database
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'k_shop',
    password: 'kiarie',
    port: 5432,
});

//test the connection
pool.connect((err, client, release) => {
    if (err) {
        return console.error('❌Error acquiring client', err.stack);
    }   
    console.log('✅Database connected successfully');
    release();
}); 
module.exports = pool ;
