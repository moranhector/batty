const mysql = require('mysql2');

const mysqlConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'alex'
};

async function connectToMySQL() {
  return mysql.createConnection(mysqlConfig);
}

module.exports = {
  connectToMySQL
};
