const sql = require('mssql');

const config = {
  user: 'sharifbubuka256',
  password: 'Namilyango1998',
  server: 'sharifbubuka.database.windows.net',
  database: 'class_app',
  options: {
    encrypt: true,
    enableArithAbort: false,
  },
};

const connection = sql.connect(config, err => {
  if (!err) {
    console.log('Connected to database');
  } else {
    console.log('Connection to database failed');
    console.log(err);
  }
});

module.exports = connection;
