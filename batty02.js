//const mysql = require('mysql');
const mysql = require('mysql2')

const connection = mysql.createConnection({
  host: 'dic-alex-tst.mendoza.gov.ar',
  user: 'alextstdba',
  password: 'WWnXg7JpW2PVd+aJ',
  database: 'alextstbbdd'
});

connection.connect((error) => {
  if (error) {
    console.error('Error al conectar a MySQL: ', error);
    return;
  }

  console.log('Conexión exitosa a MySQL');

  connection.query('SELECT * FROM estadias', (error, results) => {
    if (error) {
      console.error('Error al ejecutar la consulta: ', error);
      return;
    }

    console.log('Resultados de la consulta:');
    console.log(results.slice(0, 100)); // Mostrar los primeros 10 registros

    connection.end((error) => {
      if (error) {
        console.error('Error al cerrar la conexión: ', error);
        return;
      }

      console.log('Conexión cerrada exitosamente');
    });
  });
});
