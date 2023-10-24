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


// const oracledb = require('oracledb');
// const express = require('express');
// oracledb.initOracleClient();
// oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

// const { oracleConfig } = require('./credenciales.js');

// const app = express();

// app.get('/jubilados/:periodo', async (req, res) => {
//   try {
//     const periodo = req.params.periodo; // Obtiene el periodo de la URL

//     const connection = await oracledb.getConnection(oracleConfig);

//     const result = await connection.execute(`
//       SELECT count(*) 
//       FROM LAPN810P.CAR_SIGNOS 
//       WHERE estadolegajo=1 
//       AND admin_persona='S' 
//       AND rats<>'9999999' 
//       AND periodo=:periodo
//       AND genero='M' 
//       AND to_number(rtrim(trunc(months_between(sysdate,FECHANACIMIENTO)/12)))>=65
//     `, [periodo]); // Pasamos el periodo como parámetro

//     const count = result.rows[0]['COUNT(*)'];
//     console.log(`El número de jubilados para el período ${periodo} es: ${count}`);
    
//     await connection.close();

//     res.send(`El número de jubilados para el período ${periodo} es: ${count}`);
//   } catch (error) {
//     res.status(500).send('Ocurrió un error al ejecutar la consulta.');
//   }
// });

// const PORT = 3000;
// app.listen(PORT, () => {
//   console.log(`Servidor iniciado. Accede a http://localhost:${PORT}/jubilados/202307 Siendo este ultimo el periodo buscado`);
// });



const oracledb = require('oracledb');
const express = require('express');
const cors = require('cors');
oracledb.initOracleClient();
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

const { oracleConfig } = require('./credenciales.js');

const app = express();

// Configura CORS para permitir cualquier origen
app.use(cors());




app.get('/jubilados/:periodo', async (req, res) => {
  try {
    const periodo = req.params.periodo;
    const connection = await oracledb.getConnection(oracleConfig);
    const result = await connection.execute(`
      SELECT count(*) as cantidad
      FROM LAPN810P.CAR_SIGNOS 
      WHERE estadolegajo=1 
      AND admin_persona='S' 
      AND rats<>'9999999' 
      AND periodo=:periodo
      AND genero='M' 
      AND to_number(rtrim(trunc(months_between(sysdate,FECHANACIMIENTO)/12)))>=65
    `, [periodo]);

    const count = result.rows[0]['CANTIDAD']; // Cambiamos el nombre de la columna

    await connection.close();

    const responseJson = { cantidad: count }; // Creamos un objeto JSON

    res.json(responseJson); // Devolvemos el JSON como respuesta
  } catch (error) {
    res.status(500).json({ error: 'Ocurrió un error al ejecutar la consulta.' }); // Devolvemos un JSON de error
  }
});

app.get('/jubiladas/:periodo', async (req, res) => {
    try {
      const periodo = req.params.periodo;
      const connection = await oracledb.getConnection(oracleConfig);
      console.log( 'connection:', connection ); 

      const result = await connection.execute(`
        SELECT count(*) as cantidad
        FROM LAPN810P.CAR_SIGNOS 
        WHERE estadolegajo=1 
        AND admin_persona='S' 
        AND rats<>'9999999' 
        AND periodo=:periodo
        AND genero='F' 
        AND to_number(rtrim(trunc(months_between(sysdate,FECHANACIMIENTO)/12)))>=60
      `, [periodo]);
  
      const count = result.rows[0]['CANTIDAD']; // Cambiamos el nombre de la columna
  
      await connection.close();
  
      const responseJson = { cantidad: count }; // Creamos un objeto JSON
  
      res.json(responseJson); // Devolvemos el JSON como respuesta
    } catch (error) {
      res.status(500).json({ error: 'Ocurrió un error al ejecutar la consulta.' }); // Devolvemos un JSON de error
    }
  });


  // /////////////
  // ALTAS Y BAJAS SUMARIZADAS POR PERIODO DESDE CAR_SIGNOS

  app.get('/altasbajas/:periododesde/:periodohasta', async (req, res) => {
    try {
      console.log('entro altasbajas');
      const periododesde = req.params.periododesde;

      const periodohasta = req.params.periodohasta;      
      console.log( 'periodos:', periododesde, periodohasta );           

      // select periodo, alex_altas, alex_bajas FROM car_s2m where periodo >= '202301' and  periodo <= '202312' order by periodo      

      const connection = await oracledb.getConnection(oracleConfig);
      // const result = await connection.execute(`
      // select periodo, alex_altas, alex_bajas FROM car_s2m 
      // where periodo >= :periododesde and  periodo <= :periodohasta 
      // order by periodo
      // `, [periododesde, periodohasta ]);

      console.log( 'connection:', connection );      

      const result = await connection.execute(`
      SELECT periodo, alex_altas, alex_bajas  FROM LAPN810P.CAR_S2M  
      WHERE periodo >= :periododesde AND periodo <= :periodohasta 
      ORDER BY periodo
    `, { periododesde, periodohasta });

      console.log( 'result:', result );

      console.log( 'linea190' );
      await connection.close();
  
      res.json(result); // Devolvemos el JSON como respuesta
    } catch (error) {
      console.error('Error en la consulta:', error.message); // Logueamos el error
      res.status(500).json({ error: 'Ocurrió un error al ejecutar la consulta.' }); // Devolvemos un JSON de error
    }
  });


////// JUBILACIONES

app.get('/jubilaciones/:periodo', async (req, res) => {
  try {
    console.log('Atendiendo /jubilaciones/:periodo ...');

    
    const periodo = req.params.periodo;
    const connection = await oracledb.getConnection(oracleConfig);

    const resultHombres = await connection.execute(`
      SELECT count(*) as cantidad
      FROM LAPN810P.CAR_SIGNOS 
      WHERE estadolegajo=1 
      AND admin_persona='S' 
      AND rats<>'9999999' 
      AND periodo=:periodo
      AND genero='M' 
      AND to_number(rtrim(trunc(months_between(sysdate,FECHANACIMIENTO)/12)))>=65
    `, [periodo]);

    const resultMujeres = await connection.execute(`
      SELECT count(*) as cantidad
      FROM LAPN810P.CAR_SIGNOS 
      WHERE estadolegajo=1 
      AND admin_persona='S' 
      AND rats<>'9999999' 
      AND periodo=:periodo
      AND genero='F' 
      AND to_number(rtrim(trunc(months_between(sysdate,FECHANACIMIENTO)/12)))>=60
    `, [periodo]);

// TRAMITES INICIADOS
 

  const tramitesIniciados = await connection.execute(`
  SELECT COUNT(*) AS cantidad
  FROM LAPN810P.M4SAR_H_FONDO_PEN t
  WHERE sar_id_fondo_pens = 'J04'
    AND DT_START >= ADD_MONTHS(SYSDATE, -12) `);






    // console.log('pasa');

  
    const countHombres      = resultHombres.rows[0]['CANTIDAD'];
    const countMujeres      = resultMujeres.rows[0]['CANTIDAD'];
    const countIniciados    = tramitesIniciados.rows[0]['CANTIDAD'];    

    const total = countHombres + countMujeres; // Calcular el total    

    await connection.close();

    const responseJson = {
      hombres: countHombres,
      mujeres: countMujeres,
      totales: total, 
      iniciados: countIniciados       
    };    


    res.json(responseJson); // Devolver el JSON como respuesta
  } catch (error) {
    res.status(500).json({ error: 'Ocurrió un error al ejecutar la consulta.' }); // Devolver un JSON de error
  }
});

// JUBILIACIONES DETALLES

////// JUBILACIONES

app.get('/jubilaciones_detalle/:periodo', async (req, res) => {
  try {
    console.log('Atendiendo /jubilaciones/:periodo ...');

    
    const periodo = req.params.periodo;
    const connection = await oracledb.getConnection(oracleConfig);

    const resultJubilaciones = await connection.execute(`
    select cuil, 
    SUBSTR(nombreapellido, 1, 40) AS nombreapellido,
    TO_CHAR(fechanacimiento, 'DD/MM/YYYY') AS fechanacimiento,
    TO_CHAR(fechaingreso, 'DD/MM/YYYY') AS fechaingreso,    
    genero, periodo, descripcionuor  
      FROM LAPN810P.CAR_SIGNOS 
      WHERE estadolegajo=1 
      AND admin_persona='S' 
      AND rats<>'9999999' 
      AND periodo=:periodo
      AND genero='M' 
      AND to_number(rtrim(trunc(months_between(sysdate,FECHANACIMIENTO)/12)))>=65
    `, [periodo]);


    const responseJson = {
      data: resultJubilaciones.rows
    };  

 
    


    res.json(responseJson); // Devolver el JSON como respuesta
  } catch (error) {
    res.status(500).json({ error: 'Ocurrió un error al ejecutar la consulta.' }); // Devolver un JSON de error
  }
});


// FIN JUBILACIONES DETALLE


app.get('/jubilacionesv2/:periodo?', async (req, res) => {
  try {

    console.log('Atendiendo /jubilaciones/:periodo ...');    
    let periodo = req.params.periodo;
    console.log(req.params.periodo);    
    // Si no se proporciona el periodo, obtén el valor por defecto
    if (!periodo) {
      const connection = await oracledb.getConnection(oracleConfig);

      const resultDefaultPeriod = await connection.execute(`
        SELECT max(periodo) as max_periodo
        FROM LAPN810P.CAR_SIGNOS
      `);

      periodo = resultDefaultPeriod.rows[0]['MAX_PERIODO'];

      console.log('MAX_PERIODO', periodo);         

      await connection.close();
    }

    console.log('paso', periodo );     
    // Realizar las consultas para hombres y mujeres usando el periodo
    const resultHombres = await connection.execute(`
      SELECT count(*) as cantidad
      FROM LAPN810P.CAR_SIGNOS 
      WHERE estadolegajo=1 
      AND admin_persona='S' 
      AND rats<>'9999999' 
      AND periodo=:periodo
      AND genero='M' 
      AND to_number(rtrim(trunc(months_between(sysdate,FECHANACIMIENTO)/12)))>=65
    `, [periodo]);

    console.log('resultHombres'); 

    const resultMujeres = await connection.execute(`
      SELECT count(*) as cantidad
      FROM LAPN810P.CAR_SIGNOS 
      WHERE estadolegajo=1 
      AND admin_persona='S' 
      AND rats<>'9999999' 
      AND periodo=:periodo
      AND genero='F' 
      AND to_number(rtrim(trunc(months_between(sysdate,FECHANACIMIENTO)/12)))>=60
    `, [periodo]);
  
    const countHombres = resultHombres.rows[0]['CANTIDAD'];
    const countMujeres = resultMujeres.rows[0]['CANTIDAD'];

    const total = countHombres + countMujeres;

    const responseJson = {
      periodo,
      hombres: countHombres,
      mujeres: countMujeres,
      totales: total
    };

    res.json(responseJson);
  } catch (error) {
    res.status(500).json({ error: 'Ocurrió un error al ejecutar la consulta.' });
  }
});




    
    // select max( periodo ) as max_periodo from LAPN810P.CAR_SIGNOS    

    // SELECT COUNT(*) as cantidad
    // FROM LAPN810P.CAR_SIGNOs S WHERE estadolegajo=1 and admin_persona='S' and rats<>'9999999' and periodo='202308' and 
    // ( genero='F' AND to_number(rtrim(trunc(months_between(sysdate,FECHANACIMIENTO)/12)))>=60   )
    // or
    // ( genero='M' AND to_number(rtrim(trunc(months_between(sysdate,FECHANACIMIENTO)/12)))>= 65  )






////// FIN JUBILACIONES




  // /////////////
  // ALTAS Y BAJAS SUMARIZADAS POR PERIODO agrupadas por uor




  app.get('/altas_agrupadas_por_uor/:periododesde', async (req, res) => {
    try {
      console.log('Entró a altas_bajas');
      const periododesde = req.params.periododesde;
      
      console.log('Periodo:', periododesde);
  
      const connection = await oracledb.getConnection(oracleConfig);
  
      const result = await connection.execute(`
        SELECT descripcionuor as uor, count(distinct dni) as cantidad
        FROM LAPN810P.CAR_SIGNOS
        WHERE NOT (LQHISLEGPUERCA = '1' AND LQHISLEGPUERJU = '2')
          AND PERIODO = :periododesde
          AND estadolegajo = 1
          AND admin_persona = 'S'
          AND rats <> '9999999'
          AND dni NOT IN (
            SELECT DISTINCT dni
            FROM LAPN810P.CAR_SIGNOS
            WHERE NOT (LQHISLEGPUERCA = '1' AND LQHISLEGPUERJU = '2')
              AND PERIODO = '202212'
              AND estadolegajo = 1
              AND admin_persona = 'S'
              AND rats <> '9999999')
        GROUP BY descripcionuor
        ORDER BY 2
      `, { periododesde });
  
      console.log('Result:', result);
  
      await connection.close();
  
      // Modificamos la estructura del resultado para que sea un arreglo de objetos
      const formattedResult = result.rows.map(row => ({
        UOR: row.UOR,
        CANTIDAD: row.CANTIDAD
      }));
  
      res.json({ data: formattedResult }); // Devolvemos el JSON en la nueva estructura
    } catch (error) {
      console.error('Error en la consulta:', error.message);
      res.status(500).json({ error: 'Ocurrió un error al ejecutar la consulta.' });
    }
  });
    






const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor iniciado. Esperando solicitudes Accede desde http://localhost:${PORT}`);
});
