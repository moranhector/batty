// const oracledb = require('oracledb');
// const express = require('express');
// oracledb.initOracleClient();
// oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

// const { oracleConfig } = require('./credenciales.js'); // Ajusta la ruta según tu estructura de proyecto

// const app = express();

// app.get('/jubilados/202307', async (req, res) => {
//   try {
//     const connection = await oracledb.getConnection(oracleConfig);
//     console.log( "connection", connection );
//     const result = await connection.execute(`
//       SELECT count(*) 
//       FROM LAPN810P.CAR_SIGNOS 
//       WHERE estadolegajo=1 
//       AND admin_persona='S' 
//       AND rats<>'9999999' 
//       AND periodo='202307' 
//       AND genero='M' 
//       AND to_number(rtrim(trunc(months_between(sysdate,FECHANACIMIENTO)/12)))>=65
//     `);

//     console.log( "result", result);
//     //const count = result.rows[0][0];
//     const count = result.rows[0]['COUNT(*)'];
//     console.log(`El número de jubilados para el período 202307 es: ${count}`);
    
//     console.log( "count", count );

//     await connection.close();

//     res.send(`El número de jubilados para el período 202307 es: ${count}`);
//   } catch (error) {
//     res.status(500).send('Ocurrió un error al ejecutar la consulta.');
//   }
// });

// const PORT = 3000; // Puerta en la que se ejecutará el servidor (puedes cambiarlo)
// app.listen(PORT, () => {
//   console.log(`Servidor iniciado. Accede a http://localhost:${PORT}/jubilados/202307`);
// });


const oracledb = require('oracledb');
const express = require('express');
oracledb.initOracleClient();
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

const { oracleConfig } = require('./credenciales.js');

const app = express();

app.get('/jubilados/:periodo', async (req, res) => {
  try {
    const periodo = req.params.periodo; // Obtiene el periodo de la URL

    const connection = await oracledb.getConnection(oracleConfig);

    const result = await connection.execute(`
      SELECT count(*) 
      FROM LAPN810P.CAR_SIGNOS 
      WHERE estadolegajo=1 
      AND admin_persona='S' 
      AND rats<>'9999999' 
      AND periodo=:periodo
      AND genero='M' 
      AND to_number(rtrim(trunc(months_between(sysdate,FECHANACIMIENTO)/12)))>=65
    `, [periodo]); // Pasamos el periodo como parámetro

    const count = result.rows[0]['COUNT(*)'];
    console.log(`El número de jubilados para el período ${periodo} es: ${count}`);
    
    await connection.close();

    res.send(`El número de jubilados para el período ${periodo} es: ${count}`);
  } catch (error) {
    res.status(500).send('Ocurrió un error al ejecutar la consulta.');
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor iniciado. Accede a http://localhost:${PORT}/jubilados/202307 Siendo este ultimo el periodo buscado`);
});
