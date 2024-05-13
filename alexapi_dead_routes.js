

app.get('/NOjubilados/:periodo', async (req, res) => {
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
  
  app.get('/NOjubiladas/:periodo', async (req, res) => {
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

    

////// JUBILACIONES

app.get('/NOjubilaciones/:periodo', async (req, res) => {
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
  
  ////// EXCEL TOTAL JUBILACIONES
  
  app.get('/NOjubilaciones_detalle/:periodo', async (req, res) => {
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
  
      console.log('responseJson',responseJson);
  
      res.json(responseJson); // Devolver el JSON como respuesta
    } catch (error) {
      res.status(500).json({ error: 'Ocurrió un error al ejecutar la consulta.' }); // Devolver un JSON de error
    }
  });
  
  
  // FIN JUBILACIONES DETALLE
  
  
  app.get('/NOjubilacionesv2/:periodo?', async (req, res) => {
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
  
  
  