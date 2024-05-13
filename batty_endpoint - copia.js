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
      FROM LAPN810P.vw_car_signos
      WHERE periodo=:periodo
      AND ajub ='S'       
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





////// FIN JUBILACIONES




app.get('/jubilaciones_v3', async (req, res) => {
// Extrae información de personas en condición de jubilarse
// Usa la vista VW_CAR_SIGNOS  6/11/2023

let periodo; // Inicializa la variable periodo

  try {

    console.log('Atendiendo ----------- /jubilaciones_V3 ...');    

 
      const connection = await oracledb.getConnection(oracleConfig);

      const resultDefaultPeriod = await connection.execute(`
        SELECT max(periodo) as max_periodo
        FROM LAPN810P.CAR_SIGNOS
      `);

      periodo = resultDefaultPeriod.rows[0]['MAX_PERIODO'];

      console.log('MAX_PERIODO', periodo);         

 

    console.log('paso V3', periodo );     
    // Realizar las consultas para hombres y mujeres usando el periodo

    // select count(*) as cantidad
    // from vw_car_signos where ajub='S' and periodo='202310' and genero='M'


    const resultHombres = await connection.execute(`
      SELECT count(*) as cantidad
      FROM LAPN810P.vw_car_signos
      where periodo=:periodo
      AND genero='M' 
      AND ajub='S'
    `, [periodo]);

    console.log('resultHombres'); 

    const resultMujeres = await connection.execute(`
    SELECT count(*) as cantidad
    FROM LAPN810P.vw_car_signos
    where periodo=:periodo
    AND genero='F' 
    AND ajub='S'
    `, [periodo]);


    const tramitesIniciados = await connection.execute(`
    SELECT COUNT(*) AS cantidad
    FROM LAPN810P.M4SAR_H_FONDO_PEN t
    WHERE sar_id_fondo_pens = 'J04'
      AND DT_START >= ADD_MONTHS(SYSDATE, -12) `);



  
    const countHombres = resultHombres.rows[0]['CANTIDAD'];
    const countMujeres = resultMujeres.rows[0]['CANTIDAD'];

    const countIniciados    = tramitesIniciados.rows[0]['CANTIDAD'];      

    const total = countHombres + countMujeres;

    const responseJson = {
      periodo,
      hombres: countHombres,
      mujeres: countMujeres,
      totales: total, 
      iniciados: countIniciados 
    };

    res.json(responseJson);
  } catch (error) {
    console.error('Error en la consulta SQL:', error);    
    res.status(500).json({ error: 'Ocurrió un error al ejecutar la consulta.' });
  }
});


// Jubilaciones por UOR
/// FUNCION LARAVEL
// public function uor(  ) 
// {
//  $cSelect = "SELECT ETIQUETA  as uor,EMPLEADOS as cantidad  FROM
//  (SELECT lqhislegpuerca,lqhislegpuerju, COUNT(DISTINCT cuil) AS EMPLEADOS FROM CAR_SIGNOS WHERE estadolegajo=1 AND admin_persona='S' AND rats<>'9999999' AND periodo='202307'  GROUP BY lqhislegpuerca,lqhislegpuerju) AS total
//  INNER JOIN INSTITUCIONES ON total.lqhislegpuerca=caracter AND total.lqhislegpuerju=jurisdiccion GROUP BY ETIQUETA, EMPLEADOS;
//  " ;
// $planta = DB::select(DB::raw($cSelect));  
//  return response()->json($planta);
// }


// app.get('/jub_uor', async (req, res) => {
//   const data = await db.query(`
//     SELECT ETIQUETA as uor,
//            EMPLEADOS as cantidad
//     FROM (
//       SELECT lqhislegpuerca,
//               lqhislegpuerju,
//               COUNT(DISTINCT cuil) AS EMPLEADOS
//       FROM CAR_SIGNOS
//       WHERE estadolegajo = 1
//       AND admin_persona = 'S'
//       AND rats <> '9999999'
//       AND periodo = '202307'
//       GROUP BY lqhislegpuerca,
//                lqhislegpuerju
//     ) AS total
//     INNER JOIN INSTITUCIONES
//       ON total.lqhislegpuerca = caracter
//       AND total.lqhislegpuerju = jurisdiccion
//     GROUP BY ETIQUETA,
//              EMPLEADOS;
//   `);

//   res.json(data);
// });

// app.listen(3000, () => {
//   console.log('Servidor iniciado en el puerto 3000');
// });

////////////////// API

// app.get('/jub_uor', async (req, res) => {
//   // Extrae información de personas en condición de jubilarse
//   // Usa la vista VW_CAR_SIGNOS  6/11/2023
  
//   let periodo; // Inicializa la variable periodo
  
//     try {
  
//       console.log('Atendiendo ----------- /jub_uor ...');    
  
   
//         const connection = await oracledb.getConnection(oracleConfig);
  
//         const resultDefaultPeriod = await connection.execute(`
//           SELECT max(periodo) as max_periodo
//           FROM LAPN810P.CAR_SIGNOS
//         `);
  
//         periodo = resultDefaultPeriod.rows[0]['MAX_PERIODO'];
  
//         console.log('MAX_PERIODO', periodo);         
  
   
  
//       console.log('paso V3', periodo );     
//       // Realizar las consultas para hombres y mujeres usando el periodo
  
//       // select count(*) as cantidad
//       // from vw_car_signos where ajub='S' and periodo='202310' and genero='M'
  
//       // ESTOY ACA 1209
//       const jubilaciones = await connection.execute(`
//       SELECT ETIQUETA as uor,
//       EMPLEADOS as cantidad
//       FROM (
//       SELECT lqhislegpuerca,
//               lqhislegpuerju,
//               COUNT(DISTINCT cuil) AS EMPLEADOS
//       FROM CAR_SIGNOS
//       WHERE estadolegajo = 1
//       AND admin_persona = 'S'
//       AND rats <> '9999999'
//       AND periodo = '202307'
//       GROUP BY lqhislegpuerca,
//                 lqhislegpuerju
//       ) AS total
//       INNER JOIN INSTITUCIONES
//       ON total.lqhislegpuerca = caracter
//       AND total.lqhislegpuerju = jurisdiccion
//       GROUP BY ETIQUETA,
//         EMPLEADOS;
//       `, [periodo]);
  
  
  
    
//       const countHombres = resultHombres.rows[0]['CANTIDAD'];
//       const countMujeres = resultMujeres.rows[0]['CANTIDAD'];
  
//       const countIniciados    = tramitesIniciados.rows[0]['CANTIDAD'];      
  
//       const total = countHombres + countMujeres;
  
//       const responseJson = {
//         periodo,
//         hombres: countHombres,
//         mujeres: countMujeres,
//         totales: total, 
//         iniciados: countIniciados 
//       };
  
//       res.json(responseJson);
//     } catch (error) {
//       console.error('Error en la consulta SQL:', error);    
//       res.status(500).json({ error: 'Ocurrió un error al ejecutar la consulta.' });
//     }
//   });
  
  



// Jubilaciones por UOR


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
    

//////////////////// UOR


// public function uor(  ) 
// {
//  $cSelect = "SELECT ETIQUETA  as uor,EMPLEADOS as cantidad  FROM
//  (SELECT lqhislegpuerca,lqhislegpuerju, COUNT(DISTINCT cuil) AS EMPLEADOS FROM CAR_SIGNOS WHERE estadolegajo=1 AND admin_persona='S' AND rats<>'9999999' AND periodo='202307'  GROUP BY lqhislegpuerca,lqhislegpuerju) AS total
//  INNER JOIN INSTITUCIONES ON total.lqhislegpuerca=caracter AND total.lqhislegpuerju=jurisdiccion GROUP BY ETIQUETA, EMPLEADOS;
//  " ;

// $planta = DB::select(DB::raw($cSelect));  

// //dd( $planta ) ;
//  return response()->json($planta);

// }



app.get('/jubilaciones_uor', async (req, res) => {
  try {
    console.log('Entró a altas_bajas');

    const connection = await oracledb.getConnection(oracleConfig);

    const result = await connection.execute(`
    select i.jur_descrip as uor, count( * ) AS CANTIDAD from     LAPN810P.vw_car_signos s
    left join car_instituciones i on
    s.car = i.caracter and
    s.jur = i.jurisdiccion and
    s.uor = i.unidar_org and
    upper( s.dependencia )  =  upper ( i.dependencia )
    where periodo = '202310'  and ajub='S'
    group by jur_descrip
    `);
    

    // const result = await connection.execute(`
    // Select DESCRIPCIONUOR as UOR, count(*) as CANTIDAD from     LAPN810P.vw_car_signos
    // where ajub='S' and periodo='202310' group by DESCRIPCIONUOR
    // `);

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
  


//////////////////// FIN UOR







const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor iniciado. Esperando solicitudes Accede desde http://localhost:${PORT}`);
});
