const oracledb = require('oracledb');
const express = require('express');
const cors = require('cors');
oracledb.initOracleClient();
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

//const { oracleConfig } = require('./credenciales.js');

const app = express();

// Configura CORS para permitir cualquier origen
app.use(cors());

// Credenciales para Oracle
const oracleConfig = {
    user: "consulta01",
    password: "i77ShxISNuG5m5iG",
    connectString: 'bbdd.gde4p.mendoza.gov.ar:1521/GDE4P'
  };


// /////////////
// ALTAS Y BAJAS SUMARIZADAS POR PERIODO DESDE CAR_SIGNOS

app.get('/expedientes', async (req, res) => {
  try {
    console.log('entro expedientes');
    

    // select periodo, alex_altas, alex_bajas FROM car_s2m where periodo >= '202301' and  periodo <= '202312' order by periodo      

    const connection = await oracledb.getConnection(oracleConfig);

    console.log('connection:', connection);

    const result = await connection.execute(`
    SELECT
    ID,
    TIPO_OPERACION,
    FECHA_OPERACION,
    USUARIO,
    EXPEDIENTE,
    ID_EXPEDIENTE,
    ORD_HIST
  FROM ee_ged.historialoperacion 
  WHERE (codigo_reparticion_destino ='CGPROV#MHYF' OR reparticion_usuario ='CGPROV#MHYF')
  AND id > 25373236
  ORDER BY id
  FETCH FIRST 1 ROWS ONLY
    `);

    console.log('result:', result);

    // Modificamos la estructura del resultado para que sea un arreglo de objetos
    const formattedResult = result.rows.map(row => ({
      ID: row.ID,
      EXPEDIENTE: row.EXPEDIENTE
    }));


    await connection.close();    

    res.json({ data: formattedResult }); // Devolvemos el JSON en la nueva estructura    

  

 
  } catch (error) {
    console.error('Error en la consulta:', error.message); // Logueamos el error
    res.status(500).json({ error: 'Ocurrió un error al ejecutar la consulta.' }); // Devolvemos un JSON de error
  }
});



const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor iniciado. Esperando solicitudes Accede desde http://localhost:${PORT}`);
});




