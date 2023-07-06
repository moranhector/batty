const express = require('express');
const mysql = require('mysql2');

const app = express();

const connection = mysql.createConnection({
  host: 'dic-alex-tst.mendoza.gov.ar',
  user: 'alextstdba',
  password: 'WWnXg7JpW2PVd+aJ',
  database: 'alextstbbdd'
});

app.get('/', (req, res) => {
  connection.query('SELECT * FROM estadias', (error, results) => {
    if (error) {
      console.error('Error al ejecutar la consulta: ', error);
      res.status(500).send('Error al ejecutar la consulta');
      return;
    }

    res.send(results.slice(0, 10));
  });
});

app.listen(3000, () => {
  console.log('Servidor HTTP iniciado en el puerto 3000');
});
