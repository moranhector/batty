const oracledb = require('oracledb');
const express = require('express');
const cors = require('cors');
oracledb.initOracleClient();
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

const { oracleConfig } = require('./credenciales.js');

const app = express();

// Configura CORS para permitir cualquier origen
app.use(cors());




// /////////////
// ALTAS Y BAJAS SUMARIZADAS POR PERIODO DESDE CAR_SIGNOS

app.get('/altasbajas/:periododesde/:periodohasta', async (req, res) => {
  try {
    console.log('entro altasbajas');
    const periododesde = req.params.periododesde;

    const periodohasta = req.params.periodohasta;
    console.log('periodos:', periododesde, periodohasta);

    // select periodo, alex_altas, alex_bajas FROM car_s2m where periodo >= '202301' and  periodo <= '202312' order by periodo      

    const connection = await oracledb.getConnection(oracleConfig);
    // const result = await connection.execute(`
    // select periodo, alex_altas, alex_bajas FROM car_s2m 
    // where periodo >= :periododesde and  periodo <= :periodohasta 
    // order by periodo
    // `, [periododesde, periodohasta ]);

    console.log('connection:', connection);

    const result = await connection.execute(`
      SELECT periodo, alex_altas, alex_bajas  FROM LAPN810P.CAR_S2M  
      WHERE periodo >= :periododesde AND periodo <= :periodohasta 
      ORDER BY periodo
    `, { periododesde, periodohasta });

    console.log('result:', result);

    console.log('linea190');
    await connection.close();

    res.json(result); // Devolvemos el JSON como respuesta
  } catch (error) {
    console.error('Error en la consulta:', error.message); // Logueamos el error
    res.status(500).json({ error: 'Ocurrió un error al ejecutar la consulta.' }); // Devolvemos un JSON de error
  }
});




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



    console.log('paso V3', periodo);
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

    console.log('resultMujeres');

    const tramitesIniciados = await connection.execute(`
    SELECT COUNT(DISTINCT S.DNI) as cantidad
    FROM LAPN810P.vw_car_signos S
    INNER JOIN STD_PERSON P ON S.DNI = P.STD_SSN
    INNER JOIN m4sar_h_fondo_pen F ON P.STD_ID_PERSON = F.STD_ID_HR
    INNER JOIN std_external_org E ON F.SAR_ID_FONDO_PENS = E.STD_ID_EXTERN_ORG
    WHERE S.periodo=:periodo 
      AND S.AJUB = 'S'
      AND F.ID_ORGANIZATION IN ('0080', '0083')    
      `, [periodo]);




    const countHombres = resultHombres.rows[0]['CANTIDAD'];
    const countMujeres = resultMujeres.rows[0]['CANTIDAD'];

    const countIniciados = tramitesIniciados.rows[0]['CANTIDAD'];

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




//GRAFICO 1
// JUBILACIONES_UOR_GENERO COMPLETO

app.get('/jubilaciones_uor', async (req, res) => {
  try {
    console.log('Entró a jubilaciones_uor');

    const connection = await oracledb.getConnection(oracleConfig);

    const resultDefaultPeriod = await connection.execute(`
    SELECT max(periodo) as max_periodo
    FROM LAPN810P.CAR_SIGNOS
  `);

    periodo = resultDefaultPeriod.rows[0]['MAX_PERIODO'];

    console.log('MAX_PERIODO', periodo);

    // const { GEN } = req.query; // Obtener el argumento GEN de la consulta    
    // console.log('genero', GEN )


    const result = await connection.execute(`
    select i.etiqueta as uor, count( * ) AS CANTIDAD from
    LAPN810P.vw_car_signos s
    inner join car_instituciones i on
    s.car = i.caracter and
    s.jur = i.jurisdiccion and
    s.uor = i.unidar_org and
    s.dep = i.nro_dep
    where periodo=:periodo  and ajub='S'
    group by etiqueta
    `, { periodo: periodo });


    // const result = await connection.execute(`
    // Select DESCRIPCIONUOR as UOR, count(*) as CANTIDAD from     LAPN810P.vw_car_signos
    // where ajub='S' and periodo='202310' group by DESCRIPCIONUOR
    // `);

    //console.log('Result:', result);

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

// JUBILACIONES_UOR_GENERO

app.get('/jubilaciones_uor_gen', async (req, res) => {
  try {
    console.log('Entró a jubilaciones_uor_gen');

    const connection = await oracledb.getConnection(oracleConfig);

    const resultDefaultPeriod = await connection.execute(`
    SELECT max(periodo) as max_periodo
    FROM LAPN810P.CAR_SIGNOS
  `);

    periodo = resultDefaultPeriod.rows[0]['MAX_PERIODO'];

    console.log('MAX_PERIODO', periodo);

    const { GEN } = req.query; // Obtener el argumento GEN de la consulta    
    console.log('genero', GEN)


    const result = await connection.execute(`
    select i.etiqueta as uor, count( * ) AS CANTIDAD 
    from     LAPN810P.vw_car_signos s
    inner join car_instituciones i on
    s.car = i.caracter and
    s.jur = i.jurisdiccion and
    s.uor = i.unidar_org and
    s.dep = i.nro_dep
    where periodo=:periodo  and ajub='S'
    ${GEN ? 'and genero = :genero' : ''} 
    group by etiqueta
    `, { periodo: periodo, genero: GEN });


    // const result = await connection.execute(`
    // Select DESCRIPCIONUOR as UOR, count(*) as CANTIDAD from     LAPN810P.vw_car_signos
    // where ajub='S' and periodo='202310' group by DESCRIPCIONUOR
    // `);

    //console.log('Result:', result);

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



// ████████╗ ██████╗ ████████╗ █████╗ ██╗     ███████╗███████╗
// ╚══██╔══╝██╔═══██╗╚══██╔══╝██╔══██╗██║     ██╔════╝██╔════╝
//    ██║   ██║   ██║   ██║   ███████║██║     █████╗  ███████╗
//    ██║   ██║   ██║   ██║   ██╔══██║██║     ██╔══╝  ╚════██║
//    ██║   ╚██████╔╝   ██║   ██║  ██║███████╗███████╗███████║
//    ╚═╝    ╚═════╝    ╚═╝   ╚═╝  ╚═╝╚══════╝╚══════╝╚══════╝





// GRAFICO SEGUNDO NIVEL

app.get('/jubilaciones_uor2', async (req, res) => {


  try {

    const connection = await oracledb.getConnection(oracleConfig);

    const resultDefaultPeriod = await connection.execute(`
    SELECT max(periodo) as max_periodo
    FROM LAPN810P.CAR_SIGNOS
  `);

    periodo = resultDefaultPeriod.rows[0]['MAX_PERIODO'];

    console.log('MAX_PERIODO', periodo);

    const { JUR } = req.query; // Obtener el argumento JUR de la consulta
    // const { GEN } = req.query; // Obtener el argumento GEN de la consulta    
    // console.log('genero', GEN )


    const result = await connection.execute(`
    select i.uni_org_desc as uor, count( * ) AS CANTIDAD 
    from LAPN810P.vw_car_signos s
    inner join car_instituciones i on
    s.car = i.caracter and
    s.jur = i.jurisdiccion and
    s.uor = i.unidar_org and
    s.dep = i.nro_dep
    where periodo=:periodo and ajub='S' 
    and i.etiqueta = :etiqueta 
    group by i.uni_org_desc
  `, { periodo: periodo, etiqueta: JUR });



    console.log('Result:', result);

    await connection.close();

    const formattedResult = result.rows.map(row => ({
      UOR: row.UOR,
      CANTIDAD: row.CANTIDAD
    }));

    res.json({ data: formattedResult });
  } catch (error) {
    console.error('Error en la consulta:', error.message);
    res.status(500).json({ error: 'Ocurrió un error al ejecutar la consulta.' });
  }
});



// GRAFICO SEGUNDO NIVEL

// ███╗   ███╗██╗   ██╗     ██╗███████╗██████╗ ███████╗███████╗    ██╗   ██╗    ██╗  ██╗ ██████╗ ███╗   ███╗██████╗ ██████╗ ███████╗███████╗
// ████╗ ████║██║   ██║     ██║██╔════╝██╔══██╗██╔════╝██╔════╝    ╚██╗ ██╔╝    ██║  ██║██╔═══██╗████╗ ████║██╔══██╗██╔══██╗██╔════╝██╔════╝
// ██╔████╔██║██║   ██║     ██║█████╗  ██████╔╝█████╗  ███████╗     ╚████╔╝     ███████║██║   ██║██╔████╔██║██████╔╝██████╔╝█████╗  ███████╗
// ██║╚██╔╝██║██║   ██║██   ██║██╔══╝  ██╔══██╗██╔══╝  ╚════██║      ╚██╔╝      ██╔══██║██║   ██║██║╚██╔╝██║██╔══██╗██╔══██╗██╔══╝  ╚════██║
// ██║ ╚═╝ ██║╚██████╔╝╚█████╔╝███████╗██║  ██║███████╗███████║       ██║       ██║  ██║╚██████╔╝██║ ╚═╝ ██║██████╔╝██║  ██║███████╗███████║
// ╚═╝     ╚═╝ ╚═════╝  ╚════╝ ╚══════╝╚═╝  ╚═╝╚══════╝╚══════╝       ╚═╝       ╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝╚═════╝ ╚═╝  ╚═╝╚══════╝╚══════╝




app.get('/jubilaciones_uor_gen2', async (req, res) => {


  try {

    const connection = await oracledb.getConnection(oracleConfig);

    const resultDefaultPeriod = await connection.execute(`
    SELECT max(periodo) as max_periodo
    FROM LAPN810P.CAR_SIGNOS
  `);

    periodo = resultDefaultPeriod.rows[0]['MAX_PERIODO'];

    console.log('MAX_PERIODO', periodo);
    console.log('entro a jubilaciones_uor_gen2');

    const { JUR } = req.query; // Obtener el argumento JUR de la consulta
    const { GEN } = req.query; // Obtener el argumento GEN de la consulta    
    console.log('genero', GEN)
    console.log('jur', JUR)


    const result = await connection.execute(`
    select i.uni_org_desc as uor, count( * ) AS CANTIDAD 
    from LAPN810P.vw_car_signos s
    inner join car_instituciones i on
    s.car = i.caracter and
    s.jur = i.jurisdiccion and
    s.uor = i.unidar_org and
    s.dep = i.nro_dep
    where periodo=:periodo and ajub='S' and i.etiqueta = :etiqueta
    ${GEN ? 'and genero = :genero' : ''} 
    group by i.uni_org_desc
  `, { periodo: periodo, etiqueta: JUR, genero: GEN });



    console.log('Result:', result);

    await connection.close();

    const formattedResult = result.rows.map(row => ({
      UOR: row.UOR,
      CANTIDAD: row.CANTIDAD
    }));

    res.json({ data: formattedResult });
  } catch (error) {
    console.error('Error en la consulta:', error.message);
    res.status(500).json({ error: 'Ocurrió un error al ejecutar la consulta.' });
  }
});




////// EXCEL por uor

app.get('/excel_jubilaciones_detalle_uor/:uor/:gen', async (req, res) => {

  const connection = await oracledb.getConnection(oracleConfig);


  try {



    const resultDefaultPeriod = await connection.execute(`
    SELECT max(periodo) as max_periodo
    FROM LAPN810P.CAR_SIGNOS
  `);

    periodo = resultDefaultPeriod.rows[0]['MAX_PERIODO'];

    console.log('MAX_PERIODO', periodo);

    //const { JUR } = req.query; // Obtener el argumento JUR de la consulta
    console.log(' PARAMETROS ', req.params)

    GEN = req.params.gen; // Obtener el argumento GEN de la consulta    

    console.log('genero', GEN)



    console.log('Atendiendo /excel_jubilaciones_detalle_uor ...');

    const uor = req.params.uor;

    console.log('parametro UOR', uor)

    //const connection = await oracledb.getConnection(oracleConfig);

    const resultJubilaciones = await connection.execute(`
    select 
    cuil, 
    SUBSTR(nombreapellido, 1, 40) AS nombreapellido,
    TO_CHAR(fechanacimiento, 'DD/MM/YYYY') AS fechanacimiento,
    TO_CHAR( round( to_number(rtrim(trunc(months_between(sysdate,FECHANACIMIENTO)/12))))) AS edad,    
    TO_CHAR(fechaingreso, 'DD/MM/YYYY') AS fechaingreso,    
    genero, periodo, descripcionuor, s.dependencia , s.rats, s.clase       
    from LAPN810P.vw_car_signos s
    inner join car_instituciones i on
    s.car = i.caracter and
    s.jur = i.jurisdiccion and
    s.uor = i.unidar_org and
    s.dep = i.nro_dep        
    where periodo=:periodo and ajub='S' and i.uni_org_desc =  :uor
    ${GEN ? ' and s.genero = :genero' : ''}     
    `, { periodo: periodo, uor: uor, genero: GEN });


    const responseJson = {
      data: resultJubilaciones.rows
    };

    console.log('responseJson', responseJson);

    res.json(responseJson); // Devolver el JSON como respuesta
  } catch (error) {
    res.status(500).json({ error: 'Ocurrió un error al ejecutar la consulta.' }); // Devolver un JSON de error
  }
});

// EXCEL DE JUBILADOS TOTALES POR UOR 


app.get('/excel_jubilaciones_detalle_uor_todos/:uor', async (req, res) => {

  const connection = await oracledb.getConnection(oracleConfig);


  try {



    const resultDefaultPeriod = await connection.execute(`
    SELECT max(periodo) as max_periodo
    FROM LAPN810P.CAR_SIGNOS
  `);

    periodo = resultDefaultPeriod.rows[0]['MAX_PERIODO'];

    console.log('MAX_PERIODO', periodo);

    //const { JUR } = req.query; // Obtener el argumento JUR de la consulta
    console.log(' PARAMETROS ', req.params)



    console.log('Atendiendo /excel_jubilaciones_detalle_uor_todos ...');

    const uor = req.params.uor;

    console.log('parametro UOR', uor)

    //const connection = await oracledb.getConnection(oracleConfig);

    const resultJubilaciones = await connection.execute(`
    select 
    cuil, 
    SUBSTR(nombreapellido, 1, 40) AS nombreapellido,
    TO_CHAR(fechanacimiento, 'DD/MM/YYYY') AS fechanacimiento,
    TO_CHAR( round( to_number(rtrim(trunc(months_between(sysdate,FECHANACIMIENTO)/12))))) AS edad,    
    TO_CHAR(fechaingreso, 'DD/MM/YYYY') AS fechaingreso,    
    genero, periodo, descripcionuor, s.dependencia , s.rats, s.clase       
    from LAPN810P.vw_car_signos s
    inner join car_instituciones i on
    s.car = i.caracter and
    s.jur = i.jurisdiccion and
    s.uor = i.unidar_org and
    s.dep = i.nro_dep
    where periodo=:periodo and ajub='S' and i.uni_org_desc =  :uor
    `, { periodo: periodo, uor: uor, });


    const responseJson = {
      data: resultJubilaciones.rows
    };

    console.log('responseJson', responseJson);

    res.json(responseJson); // Devolver el JSON como respuesta
  } catch (error) {
    res.status(500).json({ error: 'Ocurrió un error al ejecutar la consulta.' }); // Devolver un JSON de error
  }
});

// EXCEL DE JUBILADOS TOTAL POR GENERO
// PARAMETRO OPCIONAL GENERO

app.get('/excel_jubi_infocompleta/:gen', async (req, res) => {

  const connection = await oracledb.getConnection(oracleConfig);

  try {

    const resultDefaultPeriod = await connection.execute(`
    SELECT max(periodo) as max_periodo
    FROM LAPN810P.CAR_SIGNOS
  `);

    periodo = resultDefaultPeriod.rows[0]['MAX_PERIODO'];

    console.log('MAX_PERIODO', periodo);

    //const { JUR } = req.query; // Obtener el argumento JUR de la consulta
    console.log(' PARAMETROS ', req.params)

    console.log('Atendiendo /excel_jubi_infocompleta ...');

    const GEN = req.params.gen;

    console.log('parametro GEN', GEN)



    // Construir la cadena SQL sin ejecutarla
    const sqlQuery = `
  SELECT 
    cuil, 
    SUBSTR(nombreapellido, 1, 40) AS nombreapellido,
    TO_CHAR(fechanacimiento, 'DD/MM/YYYY') AS fechanacimiento,
    TO_CHAR(ROUND(TO_NUMBER(RTRIM(TRUNC(MONTHS_BETWEEN(SYSDATE, FECHANACIMIENTO) / 12))))) AS edad,    
    TO_CHAR(fechaingreso, 'DD/MM/YYYY') AS fechaingreso,    
    genero, periodo, s.car, s.jur, descripcionuor, s.dependencia, s.rats, s.clase, i.jur_descrip, i.uni_org_desc, i.dependencia, i.etiqueta      
  FROM LAPN810P.vw_car_signos s
  inner JOIN car_instituciones i ON
    s.car = i.caracter AND
    s.jur = i.jurisdiccion AND
    s.uor = i.unidar_org AND
    s.dep = i.nro_dep    
  WHERE periodo = :periodo AND ajub = 'S' 
    ${GEN ? 'AND s.genero = :genero' : ''} 
`;

    console.log('SQL Query:', sqlQuery);

    const resultJubilaciones = await connection.execute(sqlQuery, { periodo: periodo, genero: GEN });




    const responseJson = {
      data: resultJubilaciones.rows
    };

    console.log('responseJson', responseJson);

    res.json(responseJson); // Devolver el JSON como respuesta
  } catch (error) {
    res.status(500).json({ error: 'Ocurrió un error al ejecutar la consulta.' }); // Devolver un JSON de error
  }
});


// EXCEL DE JUBILADOS TOTAL SIN GENERO

app.get('/excel_jubi_infocompleta', async (req, res) => {

  const connection = await oracledb.getConnection(oracleConfig);

  try {

    const resultDefaultPeriod = await connection.execute(`
    SELECT max(periodo) as max_periodo
    FROM LAPN810P.CAR_SIGNOS
  `);

    periodo = resultDefaultPeriod.rows[0]['MAX_PERIODO'];

    console.log('MAX_PERIODO', periodo);

    //const { JUR } = req.query; // Obtener el argumento JUR de la consulta
    console.log(' PARAMETROS ', req.params)

    console.log('Atendiendo /excel_jubi_infocompleta_SIN_GENERO ...');


    // Construir la cadena SQL sin ejecutarla
    const sqlQuery = `
  SELECT 
    cuil, 
    SUBSTR(nombreapellido, 1, 40) AS nombreapellido,
    TO_CHAR(fechanacimiento, 'DD/MM/YYYY') AS fechanacimiento,
    TO_CHAR(ROUND(TO_NUMBER(RTRIM(TRUNC(MONTHS_BETWEEN(SYSDATE, FECHANACIMIENTO) / 12))))) AS edad,    
    TO_CHAR(fechaingreso, 'DD/MM/YYYY') AS fechaingreso,    
    genero, periodo, s.car, s.jur, descripcionuor, s.dependencia, s.rats, s.clase, i.jur_descrip, i.uni_org_desc, i.dependencia, i.etiqueta      
  FROM LAPN810P.vw_car_signos s
  INNER JOIN car_instituciones i ON
    s.car = i.caracter AND
    s.jur = i.jurisdiccion AND
    s.uor = i.unidar_org AND
    s.dep = i.nro_dep    
  WHERE periodo = :periodo AND ajub = 'S' 
`;

    console.log('SQL Query:', sqlQuery);

    const resultJubilaciones = await connection.execute(sqlQuery, { periodo: periodo });


    const responseJson = {
      data: resultJubilaciones.rows
    };

    console.log('responseJson', responseJson);

    res.json(responseJson); // Devolver el JSON como respuesta
  } catch (error) {
    res.status(500).json({ error: 'Ocurrió un error al ejecutar la consulta.' }); // Devolver un JSON de error
  }
});






// ENDPOINT PLANTA


// ██████╗ ██╗      █████╗ ███╗   ██╗████████╗ █████╗ 
// ██╔══██╗██║     ██╔══██╗████╗  ██║╚══██╔══╝██╔══██╗
// ██████╔╝██║     ███████║██╔██╗ ██║   ██║   ███████║
// ██╔═══╝ ██║     ██╔══██║██║╚██╗██║   ██║   ██╔══██║
// ██║     ███████╗██║  ██║██║ ╚████║   ██║   ██║  ██║
// ╚═╝     ╚══════╝╚═╝  ╚═╝╚═╝  ╚═══╝   ╚═╝   ╚═╝  ╚═╝



app.get('/planta', async (req, res) => {
  // Extrae información de personas en condición de jubilarse
  // Usa la vista VW_CAR_SIGNOS  6/11/2023

  let periodo; // Inicializa la variable periodo

  try {

    console.log('Atendiendo ----------- /planta ...');


    const connection = await oracledb.getConnection(oracleConfig);

    const resultDefaultPeriod = await connection.execute(`
          SELECT max(periodo) as max_periodo
          FROM LAPN810P.CAR_SIGNOS
        `);

    periodo = resultDefaultPeriod.rows[0]['MAX_PERIODO'];

    console.log('MAX_PERIODO', periodo);

    const resultPlanta = await connection.execute(`
     SELECT 
        COUNT(distinct cuil) as total,
        COUNT(distinct CASE WHEN genero = 'M' THEN cuil END) as hombres,
        COUNT(distinct CASE WHEN genero = 'F' THEN cuil END) as mujeres
     FROM LAPN810P.vw_car_signos
     WHERE periodo = :periodo
  `, [periodo]);

    const countPlanta = resultPlanta.rows[0]['TOTAL'];
    const countPlantaM = resultPlanta.rows[0]['HOMBRES'];
    const countPlantaF = resultPlanta.rows[0]['MUJERES'];



    const resultFechaProcesado = await connection.execute(`
      select prcesado  
      from car_signos where 
      periodo=:periodo
      `, [periodo]);


    const fechaProcesado = resultFechaProcesado.rows[0]['PRCESADO'];

    // Fecha original
    const fechaOriginal = fechaProcesado;

    // Crear un objeto de fecha a partir de la fecha original
    const fecha = new Date(fechaOriginal);

    // Obtener los componentes de la fecha (día, mes, año)
    const dia = fecha.getUTCDate();
    const mes = fecha.getUTCMonth() + 1; // Los meses van de 0 a 11, por eso se suma 1
    const anio = fecha.getUTCFullYear();

    // Formatear la fecha al formato dd/mm/yyyy
    const fechaFormateada = `${dia < 10 ? '0' : ''}${dia}/${mes < 10 ? '0' : ''}${mes}/${anio}`;

    console.log(fechaFormateada); // Mostrará: 30/11/2023



    // const countPlanta = resultPlanta.rows[0]['CANTIDAD'];
    // const countPlantaM = resultPlantaM.rows[0]['CANTIDAD'];      
    // const countPlantaF = resultPlantaF.rows[0]['CANTIDAD'];            




    const lastUpdate = periodo;



    let cadenaOriginal = periodo;
    let periodoFrances = cadenaOriginal.substring(4) + '-' + cadenaOriginal.substring(0, 4);

    console.log(periodoFrances);


    const responseJson = {
      totales: countPlanta,
      periodo: periodoFrances,
      fechaProcesado: fechaFormateada,
      plantahombres: countPlantaM,
      plantamujeres: countPlantaF,
    };

    res.json(responseJson);
  } catch (error) {
    console.error('Error en la consulta SQL:', error);
    res.status(500).json({ error: 'Ocurrió un error al ejecutar la consulta.' });
  }
});



//GRAFICO 1
// JUBILACIONES_UOR_GENERO COMPLETO


// ██████╗ ██╗      █████╗ ███╗   ██╗████████╗ █████╗ 
// ██╔══██╗██║     ██╔══██╗████╗  ██║╚══██╔══╝██╔══██╗
// ██████╔╝██║     ███████║██╔██╗ ██║   ██║   ███████║
// ██╔═══╝ ██║     ██╔══██║██║╚██╗██║   ██║   ██╔══██║
// ██║     ███████╗██║  ██║██║ ╚████║   ██║   ██║  ██║
// ╚═╝     ╚══════╝╚═╝  ╚═╝╚═╝  ╚═══╝   ╚═╝   ╚═╝  ╚═╝



app.get('/planta_uor', async (req, res) => {
  try {
    console.log('Entró a planta_uor');

    const connection = await oracledb.getConnection(oracleConfig);

    const resultDefaultPeriod = await connection.execute(`
    SELECT max(periodo) as max_periodo
    FROM LAPN810P.CAR_SIGNOS
  `);

    periodo = resultDefaultPeriod.rows[0]['MAX_PERIODO'];

    console.log('MAX_PERIODO', periodo);

    // const { GEN } = req.query; // Obtener el argumento GEN de la consulta    
    // console.log('genero', GEN )


    const result = await connection.execute(`
    select i.etiqueta as uor, count( * ) AS CANTIDAD from     LAPN810P.vw_car_signos s
    left join car_instituciones i on
    s.car = i.caracter and
    s.jur = i.jurisdiccion and
    s.uor = i.unidar_org and
    s.dep = i.nro_dep
    where periodo=:periodo 
    group by etiqueta
    `, { periodo: periodo });


    // const result = await connection.execute(`
    // Select DESCRIPCIONUOR as UOR, count(*) as CANTIDAD from     LAPN810P.vw_car_signos
    // where ajub='S' and periodo='202310' group by DESCRIPCIONUOR
    // `);

    //console.log('Result:', result);

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


// ██████╗ ██╗      █████╗ ███╗   ██╗████████╗ █████╗     ██╗   ██╗ ██████╗ ██████╗     ███████╗███████╗ ██████╗ ██╗   ██╗███╗   ██╗██████╗  ██████╗ 
// ██╔══██╗██║     ██╔══██╗████╗  ██║╚══██╔══╝██╔══██╗    ██║   ██║██╔═══██╗██╔══██╗    ██╔════╝██╔════╝██╔════╝ ██║   ██║████╗  ██║██╔══██╗██╔═══██╗
// ██████╔╝██║     ███████║██╔██╗ ██║   ██║   ███████║    ██║   ██║██║   ██║██████╔╝    ███████╗█████╗  ██║  ███╗██║   ██║██╔██╗ ██║██║  ██║██║   ██║
// ██╔═══╝ ██║     ██╔══██║██║╚██╗██║   ██║   ██╔══██║    ██║   ██║██║   ██║██╔══██╗    ╚════██║██╔══╝  ██║   ██║██║   ██║██║╚██╗██║██║  ██║██║   ██║
// ██║     ███████╗██║  ██║██║ ╚████║   ██║   ██║  ██║    ╚██████╔╝╚██████╔╝██║  ██║    ███████║███████╗╚██████╔╝╚██████╔╝██║ ╚████║██████╔╝╚██████╔╝
// ╚═╝     ╚══════╝╚═╝  ╚═╝╚═╝  ╚═══╝   ╚═╝   ╚═╝  ╚═╝     ╚═════╝  ╚═════╝ ╚═╝  ╚═╝    ╚══════╝╚══════╝ ╚═════╝  ╚═════╝ ╚═╝  ╚═══╝╚═════╝  ╚═════╝ 



// GRAFICO SEGUNDO NIVEL

app.get('/planta_uor2', async (req, res) => {


  try {

    const connection = await oracledb.getConnection(oracleConfig);

    const resultDefaultPeriod = await connection.execute(`
    SELECT max(periodo) as max_periodo
    FROM LAPN810P.CAR_SIGNOS
  `);

    periodo = resultDefaultPeriod.rows[0]['MAX_PERIODO'];

    console.log('MAX_PERIODO', periodo);

    const { JUR } = req.query; // Obtener el argumento JUR de la consulta
    // const { GEN } = req.query; // Obtener el argumento GEN de la consulta    
    // console.log('genero', GEN )


    const result = await connection.execute(`
    select i.uni_org_desc as uor, count( * ) AS CANTIDAD from LAPN810P.vw_car_signos s
    inner join car_instituciones i on
    s.car = i.caracter and
    s.jur = i.jurisdiccion and
    s.uor = i.unidar_org and
    s.dep = i.nro_dep
    where periodo=:periodo and i.etiqueta = :etiqueta  
    group by i.uni_org_desc
  `, { periodo: periodo, etiqueta: JUR });



    console.log('Result:', result);

    await connection.close();

    const formattedResult = result.rows.map(row => ({
      UOR: row.UOR,
      CANTIDAD: row.CANTIDAD
    }));

    res.json({ data: formattedResult });
  } catch (error) {
    console.error('Error en la consulta:', error.message);
    res.status(500).json({ error: 'Ocurrió un error al ejecutar la consulta.' });
  }
});




//////////////////// FIN UOR



app.get('/jubilaciones_v4/:fecha', async (req, res) => {
  // Extrae información de personas en condición de jubilarse

  let periodo; // Inicializa la variable periodo

  // Obtén la fecha de la URL
  const fechaParam = req.params.fecha;

  // Verifica si se proporcionó la fecha y úsala en tu consulta SQL
  const fechaCalc = fechaParam ? fechaParam : '01/02/2024';

  try {

    console.log('Atendiendo ----------- /jubilaciones_V4 ...');

    const connection = await oracledb.getConnection(oracleConfig);

    const resultDefaultPeriod = await connection.execute(`
          SELECT max(periodo) as max_periodo
          FROM LAPN810P.CAR_SIGNOS
        `);

    periodo = resultDefaultPeriod.rows[0]['MAX_PERIODO'];

    //fechaCalc = '31/12/2024';

    console.log('MAX_PERIODO', periodo);




    // Realizar las consultas para hombres y mujeres usando el periodo

    // select count(*) as cantidad
    // from vw_car_signos where ajub='S' and periodo='202310' and genero='M'



    const resultHombres = await connection.execute(`
      SELECT count(*) as cantidad
      FROM LAPN810P.car_signos
      where periodo =: periodo
      and genero='M'
      and admin_persona = 'S'
      AND rats <> '9999999' 
      AND estadolegajo = 1         
      and ( to_number(rtrim(trunc(months_between(to_date( :fechaCalc ,'DD/MM/YYYY'), FECHANACIMIENTO)/12))) >= 65)
      `, [periodo, fechaCalc]);

    console.log('resultHombres');

    const resultMujeres = await connection.execute(`
      SELECT count(*) as cantidad
      FROM LAPN810P.car_signos
      where periodo =: periodo 
      and genero='F'
      and admin_persona = 'S'
      AND rats <> '9999999' 
      AND estadolegajo = 1         
      and ( to_number(rtrim(trunc(months_between(to_date( :fechaCalc ,'DD/MM/YYYY'), FECHANACIMIENTO)/12))) >= 60)
      `, [periodo, fechaCalc]);


    const tramitesIniciados = await connection.execute(`
      SELECT COUNT(*) AS cantidad
      FROM LAPN810P.M4SAR_H_FONDO_PEN t
      WHERE sar_id_fondo_pens = 'J04'
        AND DT_START >= ADD_MONTHS(SYSDATE, -12) `);



    const countHombres = resultHombres.rows[0]['CANTIDAD'];
    const countMujeres = resultMujeres.rows[0]['CANTIDAD'];

    const countIniciados = tramitesIniciados.rows[0]['CANTIDAD'];

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

// 2024-02-24
// TARJETA TRAMITES INICIADOS 
// SELECT COUNT(DISTINCT S.DNI)
// FROM vw_car_signos S
// INNER JOIN STD_PERSON P ON S.DNI = P.STD_SSN
// INNER JOIN m4sar_h_fondo_pen F ON P.STD_ID_PERSON = F.STD_ID_HR
// INNER JOIN std_external_org E ON F.SAR_ID_FONDO_PENS = E.STD_ID_EXTERN_ORG
// WHERE S.PERIODO = '202401'
//   AND S.AJUB = 'S'
//   AND F.ID_ORGANIZATION IN ('0080', '0083')

app.get('/tramites_iniciados', async (req, res) => {
  try {
    console.log('tramites_iniciados');

    const connection = await oracledb.getConnection(oracleConfig);

    const resultDefaultPeriod = await connection.execute(`
    SELECT max(periodo) as max_periodo
    FROM LAPN810P.CAR_SIGNOS
  `);

    periodo = resultDefaultPeriod.rows[0]['MAX_PERIODO'];

    console.log('MAX_PERIODO', periodo);


    const result = await connection.execute(`
    SELECT COUNT(DISTINCT S.DNI) as cantidad
    FROM vw_car_signos S
    INNER JOIN STD_PERSON P ON S.DNI = P.STD_SSN
    INNER JOIN m4sar_h_fondo_pen F ON P.STD_ID_PERSON = F.STD_ID_HR
    INNER JOIN std_external_org E ON F.SAR_ID_FONDO_PENS = E.STD_ID_EXTERN_ORG
    WHERE S.periodo=:periodo 
      AND S.AJUB = 'S'
      AND F.ID_ORGANIZATION IN ('0080', '0083')    
    `, { periodo: periodo });



    await connection.close();

    // Modificamos la estructura del resultado para que sea un arreglo de objetos
    const formattedResult = result.rows.map(row => ({
      CANTIDAD: row.CANTIDAD
    }));

    res.json({ data: formattedResult }); // Devolvemos el JSON en la nueva estructura
  } catch (error) {
    console.error('Error en la consulta:', error.message);
    res.status(500).json({ error: 'Ocurrió un error al ejecutar la consulta.' });
  }
});


// TRAMITES EXCEL  
// TRAMITES EXCEL 
// TRAMITES EXCEL  
app.get('/excel_tramites', async (req, res) => {

  const connection = await oracledb.getConnection(oracleConfig);

  try {

    const resultDefaultPeriod = await connection.execute(`
    SELECT max(periodo) as max_periodo
    FROM LAPN810P.CAR_SIGNOS
  `);

    periodo = resultDefaultPeriod.rows[0]['MAX_PERIODO'];

    console.log('MAX_PERIODO', periodo);

    //const { JUR } = req.query; // Obtener el argumento JUR de la consulta
    console.log(' PARAMETROS ', req.params)

    console.log('Atendiendo /excel_TRAMITES ...');

    // const GEN = req.params.gen;    

    // console.log('parametro GEN', GEN )



    // Construir la cadena SQL sin ejecutarla
    const sqlQuery = `
  SELECT DISTINCT S.DNI, S.NOMBREAPELLIDO,
  TO_CHAR(TO_DATE(S.FECHANACIMIENTO), 'DD/MM/YYYY') as fecha_nacimiento ,
  to_number(rtrim(trunc(months_between(sysdate,S.FECHANACIMIENTO)/12))) AS EDAD,  
  TO_CHAR(TO_DATE(S.FECHAINGRESO), 'DD/MM/YYYY') as fecha_ingreso ,
    s.car, s.jur, s.uor, s.descripcionuor,
  s.dependencia,s.rats,s.clase
  FROM LAPN810P.vw_car_signos S
  INNER JOIN STD_PERSON P ON S.DNI = P.STD_SSN
  INNER JOIN m4sar_h_fondo_pen F ON P.STD_ID_PERSON = F.STD_ID_HR
  INNER JOIN std_external_org E ON F.SAR_ID_FONDO_PENS = E.STD_ID_EXTERN_ORG
  WHERE S.periodo= :periodo
    AND S.AJUB = 'S'
    AND F.ID_ORGANIZATION IN ('0080', '0083') 
`;

    console.log('SQL Query:', sqlQuery);

    const resultTramites = await connection.execute(sqlQuery, { periodo: periodo });

    const responseJson = {
      data: resultTramites.rows
    };

    console.log('responseJson', responseJson);

    res.json(responseJson); // Devolver el JSON como respuesta
  } catch (error) {
    res.status(500).json({ error: 'Ocurrió un error al ejecutar la consulta.' }); // Devolver un JSON de error
  }
});

/////////////// FIN EXCEL TRAMITES


// EXCEL TRAMITES CON PASOS DETALLADOS
app.get('/excel_tramites_detallado', async (req, res) => {

  const connection = await oracledb.getConnection(oracleConfig);

  try {

    const resultDefaultPeriod = await connection.execute(`
    SELECT max(periodo) as max_periodo
    FROM LAPN810P.CAR_SIGNOS
  `);

    periodo = resultDefaultPeriod.rows[0]['MAX_PERIODO'];

    console.log('MAX_PERIODO', periodo);

    //const { JUR } = req.query; // Obtener el argumento JUR de la consulta
    console.log(' PARAMETROS ', req.params)

    console.log('Atendiendo /excel_TRAMITES_detallado ...');


    // Construir la cadena SQL sin ejecutarla
    const sqlQuery = `
  SELECT I.DNI, I.NOMBREAPELLIDO, I.DESCRIPCIONUOR, I.DEPENDENCIA  , i.genero,
  j.id_organization, j.std_id_hr as id_m4, j.sar_id_fondo_pens as cod_jubilacion,  j.descrip, j.sar_comment as observacion,
  j.id_secuser, TO_CHAR(TO_DATE(j.dt_last_update), 'DD/MM/YYYY') AS fecha_actualiza


  FROM (
      SELECT P.STD_ID_PERSON, S.DNI, S.NOMBREAPELLIDO, S.DESCRIPCIONUOR, S.DEPENDENCIA, s.genero
      FROM (
          SELECT
              S.DNI, S.NOMBREAPELLIDO, S.FECHANACIMIENTO, S.FECHAINGRESO, S.DESCRIPCIONUOR,
              S.DEPENDENCIA, S.RATS, S.CLASE, s.genero
          FROM LAPN810P.vw_car_signos S
          WHERE PERIODO =:periodo
              and ajub='S'
      ) S
      INNER JOIN STD_PERSON P ON S.DNI = P.STD_SSN
  ) I
  INNER JOIN (
      SELECT E.STD_N_EXT_ORGESP AS DESCRIP, F.*
      FROM m4sar_h_fondo_pen F
      INNER JOIN std_external_org E ON F.SAR_ID_FONDO_PENS = E.STD_ID_EXTERN_ORG
      WHERE F.ID_ORGANIZATION IN ('0080', '0083')
  ) J
  ON I.STD_ID_PERSON = J.STD_ID_HR
  WHERE J.ID_ORGANIZATION IN ('0080', '0083')
  ORDER BY J.STD_ID_HR, J.DT_START
`;

    console.log('SQL Query:', sqlQuery);

    const resultTramites = await connection.execute(sqlQuery, { periodo: periodo });

    const responseJson = {
      data: resultTramites.rows
    };

    console.log('responseJson', responseJson);

    res.json(responseJson); // Devolver el JSON como respuesta
  } catch (error) {
    res.status(500).json({ error: 'Ocurrió un error al ejecutar la consulta.' }); // Devolver un JSON de error
  }
});

/////////////// FIN EXCEL TRAMITES CON PASOS DETALLADOS

///////// EXCEL COMPLEMENTARIO - EMPLEADO SIN TRAMITE
///////// EXCEL COMPLEMENTARIO - EMPLEADO SIN TRAMITE



app.get('/excel_sin_tramites', async (req, res) => {

  const connection = await oracledb.getConnection(oracleConfig);

  try {

    const resultDefaultPeriod = await connection.execute(`
          SELECT max(periodo) as max_periodo
          FROM LAPN810P.CAR_SIGNOS
        `);

    periodo = resultDefaultPeriod.rows[0]['MAX_PERIODO'];

    console.log('MAX_PERIODO', periodo);

    //const { JUR } = req.query; // Obtener el argumento JUR de la consulta
    console.log(' PARAMETROS ', req.params)

    console.log('Atendiendo /excel_sin_tramites ...');


    // Construir la cadena SQL sin ejecutarla
    const sqlQuery = `
        select DISTINCT DNI,NOMBREAPELLIDO,
        TO_CHAR(TO_DATE(FECHANACIMIENTO), 'DD/MM/YYYY') as fecha_nacimiento ,
        to_number(rtrim(trunc(months_between(sysdate,FECHANACIMIENTO)/12))) AS EDAD,          
        TO_CHAR(TO_DATE(FECHAINGRESO), 'DD/MM/YYYY') as fecha_ingreso ,
        car, jur, uor, descripcionuor from vw_car_signos 
        where periodo=:periodo
        AND AJUB = 'S' and dni not in(
        SELECT DISTINCT S.DNI as cantidad
        FROM LAPN810P.vw_car_signos S
        INNER JOIN STD_PERSON P ON S.DNI = P.STD_SSN
        INNER JOIN m4sar_h_fondo_pen F ON P.STD_ID_PERSON = F.STD_ID_HR
        INNER JOIN std_external_org E ON F.SAR_ID_FONDO_PENS = E.STD_ID_EXTERN_ORG
        WHERE S.periodo=:periodo
          AND S.AJUB = 'S'
          AND F.ID_ORGANIZATION IN ('0080', '0083')) order by car, jur, uor, descripcionuor,NOMBREAPELLIDO 
      `;

    console.log('SQL Query:', sqlQuery);

    const resultTramites = await connection.execute(sqlQuery, { periodo: periodo });

    const responseJson = {
      data: resultTramites.rows
    };

    console.log('responseJson', responseJson);

    res.json(responseJson); // Devolver el JSON como respuesta
  } catch (error) {
    res.status(500).json({ error: 'Ocurrió un error al ejecutar la consulta.' }); // Devolver un JSON de error
  }
});


///////// FIN EXCEL COMPLEMENTARIO - EMPLEADO SIN TRAMITE
///////// FIN EXCEL COMPLEMENTARIO - EMPLEADO SIN TRAMITE


//////////////////  LISTA DE UNIDADES ORGANIZATIVAS
//////////////////  LISTA DE UNIDADES ORGANIZATIVAS


app.get('/instituciones', async (req, res) => {

  const connection = await oracledb.getConnection(oracleConfig);

  try {

    const resultDefaultPeriod = await connection.execute(`
    SELECT max(periodo) as max_periodo
    FROM LAPN810P.CAR_SIGNOS
  `);

    periodo = resultDefaultPeriod.rows[0]['MAX_PERIODO'];

    console.log('MAX_PERIODO', periodo);

    //const { JUR } = req.query; // Obtener el argumento JUR de la consulta
    console.log(' PARAMETROS ', req.params)

    console.log('Atendiendo /instituciones ...');


    // Construir la cadena SQL sin ejecutarla
    const sqlQuery = `
  select i.etiqueta as uor, count( * ) AS CANTIDAD from
  LAPN810P.vw_car_signos s
  inner join car_instituciones i on
  s.car = i.caracter and
  s.jur = i.jurisdiccion and
  s.uor = i.unidar_org and
  s.dep = i.nro_dep
  where periodo=:periodo  and ajub='S'
  group by etiqueta order by etiqueta
`;

    console.log('SQL Query:', sqlQuery);

    const resultTramites = await connection.execute(sqlQuery, { periodo: periodo });

    const responseJson = {
      data: resultTramites.rows
    };

    console.log('responseJson', responseJson);

    res.json(responseJson); // Devolver el JSON como respuesta
  } catch (error) {
    res.status(500).json({ error: 'Ocurrió un error al ejecutar la consulta.' }); // Devolver un JSON de error
  }
});


///////// FIN EXCEL COMPLEMENTARIO - EMPLEADO SIN TRAMITE
///////// FIN EXCEL COMPLEMENTARIO - EMPLEADO SIN TRAMITE




//////////////////  LISTA DE UNIDADES ORGANIZATIVAS
//////////////////  LISTA DE UNIDADES ORGANIZATIVAS
//////////////////  LISTA DE UNIDADES ORGANIZATIVAS



app.get('/excel_jubilaciones_detalle_etiqueta/:etiqueta', async (req, res) => {

  const connection = await oracledb.getConnection(oracleConfig);


  try {



    const resultDefaultPeriod = await connection.execute(`
    SELECT max(periodo) as max_periodo
    FROM LAPN810P.CAR_SIGNOS
  `);

    periodo = resultDefaultPeriod.rows[0]['MAX_PERIODO'];

    console.log('MAX_PERIODO', periodo);

    //const { JUR } = req.query; // Obtener el argumento JUR de la consulta
    console.log(' PARAMETROS ', req.params)



    console.log('Atendiendo /excel_jubilaciones_detalle_etiqueta ...');

    const etiqueta = req.params.etiqueta;

    console.log('parametro etiqueta', etiqueta)

    //const connection = await oracledb.getConnection(oracleConfig);

    const resultJubilaciones = await connection.execute(`
    select 
    cuil, 
    SUBSTR(nombreapellido, 1, 40) AS nombreapellido,
    TO_CHAR(fechanacimiento, 'DD/MM/YYYY') AS fechanacimiento,
    TO_CHAR( round( to_number(rtrim(trunc(months_between(sysdate,FECHANACIMIENTO)/12))))) AS edad,    
    TO_CHAR(fechaingreso, 'DD/MM/YYYY') AS fechaingreso,    
    genero, periodo, descripcionuor, s.dependencia , s.rats, s.clase       
    from LAPN810P.vw_car_signos s
    inner join car_instituciones i on
    s.car = i.caracter and
    s.jur = i.jurisdiccion and
    s.uor = i.unidar_org and
    s.dep = i.nro_dep
    where periodo=:periodo and ajub='S' and i.etiqueta =  :etiqueta
    order by s.dependencia, genero
    `, { periodo: periodo, etiqueta: etiqueta });


    const responseJson = {
      data: resultJubilaciones.rows
    };

    console.log('responseJson', responseJson);

    res.json(responseJson); // Devolver el JSON como respuesta
  } catch (error) {
    res.status(500).json({ error: 'Ocurrió un error al ejecutar la consulta.' }); // Devolver un JSON de error
  }
});

// EXCEL DE JUBILADOS TOTAL POR GENERO

// CONSULTA POR DNI



// app.get('/personas/:documento?', async (req, res) => {

//   const connection = await oracledb.getConnection(oracleConfig);

//   try {
//     const resultDefaultPeriod = await connection.execute(`
//     SELECT max(periodo) as max_periodo
//     FROM LAPN810P.CAR_SIGNOS
//   `);

//   periodo = resultDefaultPeriod.rows[0]['MAX_PERIODO'];

//     console.log( ' PARAMETROS ', req.params )
//     console.log('Atendiendo /personas por documento ...');
//     const documento = req.params.documento ;    
//     console.log('parametro documento', documento )
//     const resultPersonas = await connection.execute(`
//     select pe.id_organization as idorg ,
//     p.std_id_person as id_persona, 
//     sco_gb_name,
//     car_legajo,
//     e.std_email,
//     p.std_ssn,
//     p.std_ss_number,
//     p.std_id_person, 
//     e.id_secuser, 
//     e.std_id_locat_type from std_person p 
//     left join std_hr_period pe on p.std_id_person = pe.std_id_hr 
//     left join std_email e 
//     on  p.std_id_person = e.std_id_person 
//     ${documento ? ' where  p.std_ssn = :documento' : ''} 
//     `, { documento: documento  });    


//     const responseJson = {
//       data: resultPersonas.rows
//     };  

//     console.log('responseJson',responseJson);

//     res.json(responseJson); // Devolver el JSON como respuesta
//   } catch (error) {
//     res.status(500).json({ error: 'Ocurrió un error al ejecutar la consulta de personas.' }); // Devolver un JSON de error
//   }
// });


app.get('/personas/:documento?', async (req, res) => {
  const connection = await oracledb.getConnection(oracleConfig);
  try {
    const resultDefaultPeriod = await connection.execute(`
      SELECT max(periodo) as max_periodo
      FROM LAPN810P.CAR_SIGNOS
    `);
    const periodo = resultDefaultPeriod.rows[0]['MAX_PERIODO'];

    const documento = req.params.documento;

    if (documento !== undefined) {
      // El parámetro está definido
      console.log('El parámetro documento está definido:', documento);


      const resultPersonas = await connection.execute(`
      SELECT pe.id_organization as idorg,
      p.std_id_person as id_persona, 
      sco_gb_name, car_legajo, e.std_email, p.std_ssn, p.std_ss_number,
      p.std_id_person, e.id_secuser, e.std_id_locat_type
      FROM std_person p 
      LEFT JOIN std_hr_period pe ON p.std_id_person = pe.std_id_hr 
      LEFT JOIN std_email e ON p.std_id_person = e.std_id_person 
      ${documento ? ' WHERE p.std_ssn = :documento' : ''} 
    `, { documento: documento });

      const responseJson = {
        data: resultPersonas.rows
      };


      res.json(responseJson);


      // Tu lógica adicional aquí, si es necesario
    } else {
      // El parámetro no está definido
      console.log('El parámetro documento no está definido');

      const resultPersonas = await connection.execute(`
      SELECT p.std_id_person as id_persona , 
      sco_gb_name,  p.std_ssn       
      FROM std_person p 
      WHERE p.std_id_person NOT LIKE 'M%' ORDER BY sco_gb_name   
      `);

      const responseJson = {
        data: resultPersonas.rows
      };


      res.json(responseJson);



      // Puedes manejar el caso en que el parámetro no está definido
    }







  } catch (error) {
    console.log(error)
    res.status(500).json({ error: 'Ocurrió un error al ejecutar la consulta de personas.' });
  }
});




// PERSONAS VERSION 2
// REDUCE EL UNIVERSO A LAS PERSONAS QUE ESTAN EN SIGNOS
// EVENTO DE POBLACION DE DATATABLE DE PERSONAS
// TRAE TODAS LAS PERSONAS EMPLEADOS Y CONTRATADAS

app.get('/personas2/', async (req, res) => {
  const connection = await oracledb.getConnection(oracleConfig);
  try {

    // El parámetro no está definido
    console.log('El parámetro documento no está definido');
/// HAGO UNION DE LOS EMPLEADOS DE PLANTA Y DE LOS CONTRATADOS
    const resultPersonas = await connection.execute(`
    SELECT distinct sco_gb_name, p.std_ssn, p.std_id_person, 'P' as tipo_empleado      
    FROM std_person p 
    INNER JOIN 
    car_signos s
    on p.std_ssn = s.dni
    WHERE s.periodo='202404' 
union       
    SELECT distinct sco_gb_name, p.std_ssn, p.std_id_person , 'C' as tipo_empleado
    FROM std_person p 
    INNER JOIN 
    car_contratados s
    on p.std_ssn = substr( s.cuil, 4, 8)
    WHERE s.periodo= '202403' 
      `);

    const responseJson = {
      data: resultPersonas.rows

    }
    res.json(responseJson);





  } catch (error) {
    console.log(error)
    res.status(500).json({ error: 'Ocurrió un error al ejecutar la consulta de personas.' });
  }
});



// PERSONAS POR ID 
// BOTON VER
app.get('/personas_id/:id?', async (req, res) => {
  const connection = await oracledb.getConnection(oracleConfig);
  try {
    const resultDefaultPeriod = await connection.execute(`
      SELECT max(periodo) as max_periodo
      FROM LAPN810P.CAR_SIGNOS
    `);
    const periodo = resultDefaultPeriod.rows[0]['MAX_PERIODO'];

    const id = req.params.id;

    if (id !== undefined) {
      // El parámetro está definido
      console.log('El ID está definido:', id);

      const resultPersonas = await connection.execute(`
      SELECT distinct sco_gb_name, p.std_ssn, p.std_id_person, 'P' as tipo_empleado      
      FROM std_person p 
      INNER JOIN 
      car_signos s
      on p.std_ssn = s.dni
      WHERE s.periodo='202404' and
      p.std_id_person = :id       
      union
      SELECT distinct sco_gb_name, p.std_ssn, p.std_id_person,  'C' as tipo_empleado
      FROM std_person p 
      INNER JOIN 
      car_contratados s
      on p.std_ssn = substr( s.cuil, 4, 8)
      WHERE s.periodo= '202403'
      and
      p.std_id_person = :id     
    `, { id: id });

      const responseJson = {
        data: resultPersonas.rows
      };


      res.json(responseJson);


      // Tu lógica adicional aquí, si es necesario
    } else {
      // El parámetro no está definido
      console.log('El parámetro documento no está definido');

    };



  } catch (error) {
    console.log(error)
    res.status(500).json({ error: 'Ocurrió un error al ejecutar la consulta de personas.' });
  }
});


// FIN PERSONAS POR ID

// PLANTA ENDPOINT
// PLANTA ENDPOINT




// PERSONAS POR ID COMPLETO 18/3/2024
// PERSONAS POR ID COMPLETO 18/3/2024
// PERSONAS POR ID COMPLETO 18/3/2024
// PERSONAS POR ID COMPLETO 18/3/2024

// POBLAR FORMULARIO DE BUSCADOR ALEX CON DATOS

app.get('/personas_id_completo/:id?', async (req, res) => {

  const connection = await oracledb.getConnection(oracleConfig);
  try {
    const resultDefaultPeriod = await connection.execute(`
      SELECT max(periodo) as max_periodo
      FROM LAPN810P.CAR_SIGNOS
    `);
    const periodo = resultDefaultPeriod.rows[0]['MAX_PERIODO'];

    const id = req.params.id;

    if (id !== undefined) {
      // El parámetro está definido
      console.log('El ID está definido:', id);

      const resultPersonas = await connection.execute(`
          SELECT distinct sco_gb_name, p.std_ssn, p.std_id_person, s.cuil   , 'P' as tipo_empleado      
          FROM std_person p 
          INNER JOIN 
          car_signos s
          on p.std_ssn = s.dni
          WHERE s.periodo='202404' and
          p.std_id_person = :id       
          union
          SELECT distinct sco_gb_name, p.std_ssn, p.std_id_person, p.sar_cuil as cuil, 'C' as tipo_empleado
          FROM std_person p 
          INNER JOIN 
          car_contratados s
          on p.std_ssn = substr( s.cuil, 4, 8)
          WHERE s.periodo= '202403' 
          and
          p.std_id_person = :id     
        `, { id: id });

      // Inicializamos un objeto para almacenar las respuestas de ambas consultas
      const responseJson = {
        data: {
          persona: [],
          domicilio: [],
          jubilacion: []
        }
      };

      // Verificamos si se encontraron resultados para el primer query
      if (resultPersonas.rows.length > 0) {

        // Agregamos los resultados del primer query al objeto responseJson
        responseJson.data.persona.push(...resultPersonas.rows);
        console.log('Formando data.persona:', responseJson.data.persona);

        // Obtenemos el valor std_id_person de la primera fila
        //console.log('______aqui tengo el CUIL _____', resultPersonas.rows[0].CUIL);
        console.log('______aqui tambien        _____', responseJson.data.persona[0].CUIL);
        const cCUIL = responseJson.data.persona[0].CUIL;
        //const std_id_person = resultPersonas.rows[0].std_id_person;


        // Realizamos la segunda consulta utilizando std_id_person
        const segundaConsulta = await connection.execute(`
        select STD_ADDRESS_LINE_1 AS domi_calle, 
        STD_ADDRESS_LINE_2  AS domi_numero, 
        std_id_geo_place  AS domi_lugar,
        STD_ZIP_CODE  AS domi_cp,
        sco_gb_address as domicilio
        from std_address  where std_id_person = :id  and 
        std_dt_end = TO_DATE('4000-01-01', 'YYYY-MM-DD')        
        `, { id: id });

        // Agregamos los resultados del segundo query al objeto responseJson
        responseJson.data.domicilio.push(...segundaConsulta.rows);
        console.log('Formando data.domicilio :', responseJson.data.domicilio);

        // TERCERA CONSULTA - JUBILACIONES

        // Realizamos la tercera consulta utilizando cuil
        const terceraConsulta = await connection.execute(`
        select genero, fechaingreso, fechanacimiento,
        car, jur, uor, dep, ajub,descripcionuor, 
        dependencia, rats, clase from LAPN810P.vw_car_signos 
        where cuil= :cuil and periodo=:periodo   
                `, { periodo: periodo, cuil: cCUIL });

        responseJson.data.jubilacion.push(...terceraConsulta.rows);

        // Devolvemos los datos en formato JSON
        res.json(responseJson);



      } else {
        // Si no se encontraron resultados para el primer query
        res.status(404).json({ error: 'No se encontraron resultados para el ID proporcionado' });
        return; // Terminamos la ejecución del código
      }
    }
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: 'Ocurrió un error al ejecutar la consulta de personas.' });
  } // Agregamos el cierre del bloque catch
});


// FIN PERSONAS POR ID

app.get('/planta_uor', async (req, res) => {
  try {
    console.log('Entró a planta_uor');

    const connection = await oracledb.getConnection(oracleConfig);

    const resultDefaultPeriod = await connection.execute(`
    SELECT max(periodo) as max_periodo
    FROM LAPN810P.CAR_SIGNOS
  `);

    periodo = resultDefaultPeriod.rows[0]['MAX_PERIODO'];

    console.log('MAX_PERIODO', periodo);

    const result = await connection.execute(`
    select i.etiqueta as uor, count( * ) AS CANTIDAD from
    LAPN810P.vw_car_signos s
    inner join car_instituciones i on
    s.car = i.caracter and
    s.jur = i.jurisdiccion and
    s.uor = i.unidar_org and
    s.dep = i.nro_dep
    where periodo=:periodo  
    group by etiqueta
    `, { periodo: periodo });

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



// GRAFICO SEGUNDO NIVEL

app.get('/planta_uor2', async (req, res) => {


  try {

    const connection = await oracledb.getConnection(oracleConfig);

    const resultDefaultPeriod = await connection.execute(`
    SELECT max(periodo) as max_periodo
    FROM LAPN810P.CAR_SIGNOS
  `);

    periodo = resultDefaultPeriod.rows[0]['MAX_PERIODO'];

    console.log('MAX_PERIODO', periodo);

    const { JUR } = req.query; // Obtener el argumento JUR de la consulta
    // const { GEN } = req.query; // Obtener el argumento GEN de la consulta    
    // console.log('genero', GEN )


    const result = await connection.execute(`
    select i.uni_org_desc as uor, count( * ) AS CANTIDAD 
    from LAPN810P.vw_car_signos s
    inner join car_instituciones i on
    s.car = i.caracter and
    s.jur = i.jurisdiccion and
    s.uor = i.unidar_org and
    s.dep = i.nro_dep
    where periodo=:period
    and i.etiqueta = :etiqueta 
    group by i.uni_org_desc
  `, { periodo: periodo, etiqueta: JUR });



    console.log('Result:', result);

    await connection.close();

    const formattedResult = result.rows.map(row => ({
      UOR: row.UOR,
      CANTIDAD: row.CANTIDAD
    }));

    res.json({ data: formattedResult });
  } catch (error) {
    console.error('Error en la consulta:', error.message);
    res.status(500).json({ error: 'Ocurrió un error al ejecutar la consulta.' });
  }
});

// FIN PLANTA ENDPOINT
// FIN PLANTA ENDPOINT


app.get('/futurosjubilados', async (req, res) => {

  const connection = await oracledb.getConnection(oracleConfig);


  try {



    const resultDefaultPeriod = await connection.execute(`
    SELECT max(periodo) as max_periodo
    FROM LAPN810P.CAR_SIGNOS
  `);

    periodo = resultDefaultPeriod.rows[0]['MAX_PERIODO'];

    console.log('MAX_PERIODO', periodo);

    //const { JUR } = req.query; // Obtener el argumento JUR de la consulta
    console.log(' PARAMETROS ', req.params)



    console.log('Atendiendo futurosjubilados ...');


    //const connection = await oracledb.getConnection(oracleConfig);

    const resultJubilaciones = await connection.execute(`
    select distinct p.std_id_person, pp.id_organization,
    cuil, 
    SUBSTR(nombreapellido, 1, 40) AS nombreapellido,
    TO_CHAR(fechanacimiento, 'DD/MM/YYYY') AS fechanacimiento,
    TO_CHAR( round( to_number(rtrim(trunc(months_between(sysdate,FECHANACIMIENTO)/12))))) AS edad,    
    TO_CHAR(fechaingreso, 'DD/MM/YYYY') AS fechaingreso,    
    genero, periodo, descripcionuor, s.dependencia , i.etiqueta, s.rats, s.clase,
    j.sar_id_fondo_pens as last_cod_jub, 
    E.STD_N_EXT_ORGESP as last_cod_jub_desc , 
    j.dt_start as last_fecha_desde,    
    j.dt_end as last_fecha_hasta,
    j.sar_comment as last_observacion,
    j.id_secuser, 
    TO_CHAR(TO_DATE(j.dt_last_update), 'DD/MM/YYYY') AS fecha_actualiza           
    from LAPN810P.vw_car_signos s
    left join LAPN810P.car_instituciones i on
    s.car = i.caracter and
    s.jur = i.jurisdiccion and
    s.uor = i.unidar_org and
    s.dep = i.nro_dep
    left JOIN LAPN810P.STD_PERSON P ON S.dni= P.STD_SSN
    inner join LAPN810P.std_hr_period pp on p.std_id_person = pp.std_id_hr 
    left JOIN LAPN810P.m4sar_h_fondo_pen J ON J.STD_ID_HR = P.STD_ID_PERSON 
    left join LAPN810P.m4sar_fondo_pens F on f.sar_id_fondo_pens=j.sar_id_fondo_pens
    left JOIN (select * from LAPN810P.std_external_org E where e.id_organization in ( '0080', '0083' )) E ON J.SAR_ID_FONDO_PENS=E.STD_ID_EXTERN_ORG    
    where periodo=:periodo  and ajub='S'  and pp.id_organization in ( '0080', '0083' ) 
    and ( j.dt_end   = (
        SELECT MAX(j2.dt_end)
        FROM LAPN810P.m4sar_h_fondo_pen j2
        WHERE j2.STD_ID_HR = p.std_id_person
    ) or j.dt_end is null )
    `, { periodo: periodo });


    const responseJson = {
      data: resultJubilaciones.rows
    };

    console.log('responseJson', responseJson);

    res.json(responseJson); // Devolver el JSON como respuesta
  } catch (error) {
    console.error('Error al ejecutar la consulta:', error);
    res.status(500).json({ error: 'Ocurrió un error al ejecutar la consulta.', detalle: error.message });
  }
});








// NO TOCAR SECCION LISTEN PORT
// NO TOCAR 
// NO TOCAR 
// NO TOCAR 
// NO TOCAR SECCION LISTEN PORT

app.get('/futurosjubiladoshisto/:documento', async (req, res) => {

  const documento = req.params.documento;
  const connection = await oracledb.getConnection(oracleConfig);

  try {

    const resultDefaultPeriod = await connection.execute(`
    SELECT max(periodo) as max_periodo
    FROM LAPN810P.CAR_SIGNOS
  `);

    periodo = resultDefaultPeriod.rows[0]['MAX_PERIODO'];

    console.log('MAX_PERIODO', periodo);

    //const { JUR } = req.query; // Obtener el argumento JUR de la consulta
    console.log(' PARAMETROS ', req.params)



    console.log('Atendiendo futurosjubilados historico ...');


    //const connection = await oracledb.getConnection(oracleConfig);

    const resultJubilaciones = await connection.execute(`
    SELECT 
      S.DNI, 
      S.NOMBREAPELLIDO, 
      J.STD_ID_HR AS id_m4, 
      J.DT_START, 
      J.DT_END,
      J.SAR_ID_FONDO_PENS AS cod_jubilacion, 
      E.STD_N_EXT_ORGESP, 
      J.SAR_COMMENT AS observacion,
      J.ID_SECUSER, 
      TO_CHAR(TO_DATE(J.DT_LAST_UPDATE), 'DD/MM/YYYY') AS fecha_actualiza
    FROM LAPN810P.vw_car_signos S
    INNER JOIN STD_PERSON P ON S.dni = P.STD_SSN
    INNER JOIN m4sar_h_fondo_pen J ON J.STD_ID_HR = P.STD_ID_PERSON
    INNER JOIN std_external_org E ON J.SAR_ID_FONDO_PENS = E.STD_ID_EXTERN_ORG
    WHERE J.ID_ORGANIZATION IN ('0080', '0083') 
      AND S.PERIODO = :periodo  
      AND S.AJUB = 'S'  
      AND S.DNI = :documento
    ORDER BY J.DT_START
  `, { periodo: periodo, documento: documento });    

  //   const resultJubilaciones = await connection.execute(`
  //   SELECT S.DNI, S.NOMBREAPELLIDO, 
  //   j.std_id_hr as id_m4,J.DT_START,J.DT_END ,j.sar_id_fondo_pens as cod_jubilacion, E.STD_N_EXT_ORGESP, j.sar_comment as observacion,
  //    j.id_secuser, TO_CHAR(TO_DATE(j.dt_last_update), 'DD/MM/YYYY') AS fecha_actualiza
  //  FROM LAPN810P.vw_car_signos S
  //  INNER JOIN STD_PERSON P ON S.dni= P.STD_SSN
  //  INNER JOIN m4sar_h_fondo_pen J ON J.STD_ID_HR =P.STD_ID_PERSON
  //  INNER JOIN std_external_org E ON J.SAR_ID_FONDO_PENS=E.STD_ID_EXTERN_ORG
  //  WHERE J.ID_ORGANIZATION in ('0080','0083') AND S.PERIODO = :periodo  and ajub='S'  
  //  and dni = '10276434'
  //  ORDER BY  J.DT_START
  //   `, { periodo: periodo, documento: documento });


    const responseJson = {
      data: resultJubilaciones.rows
    };

    console.log('responseJson', responseJson);

    res.json(responseJson); // Devolver el JSON como respuesta
  } catch (error) {
    console.error('Error al ejecutar la consulta:', error);
    res.status(500).json({ error: 'Ocurrió un error al ejecutar la consulta.', detalle: error.message });
  }
});








const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor iniciado. Esperando solicitudes Accede desde http://localhost:${PORT}`);
});







