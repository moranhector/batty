// Aplicación Node.js
// UPDATE_PERIODOS
// Sirve para hacer un update de  la tabla car_s2m
// con un calculo de altas y bajas
// de los periodos 




const oracledb = require('oracledb');
oracledb.initOracleClient();
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

let pool; // Variable para almacenar la pool de conexiones

const { oracleConfig } = require('./credenciales.js');

async function connectToOracle() {
  try {
    pool = await oracledb.createPool(oracleConfig); // Almacenar la pool en la variable pool
    const connection = await oracledb.getConnection();
    await connection.release();

    console.log('Conexión a Oracle exitosa.');
  } catch (err) {
    console.error('Error connecting to Oracle:', err);
    throw err;
  }
}

async function insertIntoCarS2M( PERIODO ) {
  try {


  let PERIODO_ACTUAL   = PERIODO ;
  let PERIODO_ANTERIOR = GetPeriodoAnterior( PERIODO );


    const sql = `    
    UPDATE LAPN810P.CAR_S2M
    SET alex_altas = (
      SELECT COUNT(DISTINCT dni)
      FROM LAPN810P.CAR_SIGNOS
      WHERE NOT (LQHISLEGPUERCA = '1' AND LQHISLEGPUERJU = '2')
        AND PERIODO = '${ PERIODO_ACTUAL }' 
        AND estadolegajo = 1 AND admin_persona = 'S' AND rats <> '9999999'
        AND dni NOT IN (
          SELECT DISTINCT dni
          FROM LAPN810P.CAR_SIGNOS
          WHERE NOT (LQHISLEGPUERCA = '1' AND LQHISLEGPUERJU = '2')
            AND PERIODO = '${ PERIODO_ANTERIOR }'
            AND estadolegajo = 1 AND admin_persona = 'S' AND rats <> '9999999'
        )
    ), alex_bajas = 
    (
      SELECT COUNT(DISTINCT dni)
      FROM LAPN810P.CAR_SIGNOS
      WHERE NOT (LQHISLEGPUERCA = '1' AND LQHISLEGPUERJU = '2')
        AND PERIODO = '${ PERIODO_ANTERIOR }'
        AND estadolegajo = 1 AND admin_persona = 'S' AND rats <> '9999999'
        AND dni NOT IN (
          SELECT DISTINCT dni
          FROM LAPN810P.CAR_SIGNOS
          WHERE NOT (LQHISLEGPUERCA = '1' AND LQHISLEGPUERJU = '2')
            AND PERIODO = '${ PERIODO_ACTUAL }'
            AND estadolegajo = 1 AND admin_persona = 'S' AND rats <> '9999999'
        )
    ), alex_update = (SYSTIMESTAMP)
    where periodo='${ PERIODO_ACTUAL }'     `;    
    



    console.log('QUERY', sql);
    const connection = await oracledb.getConnection();
    const result = await connection.execute(sql);
    await connection.commit(); // Agrega esta línea para confirmar la transacción
    await connection.release();
    console.log('Inserción exitosa.');
  } catch (error) {
    console.error('Error en la inserción:', error);
  }
}



function GetPeriodoAnterior(PERIODO) {
  // Obtiene el año y el mes del período proporcionado
  const ANIO = PERIODO.substring(0, 4);
  const MES = PERIODO.substring(4, 6); // Debes usar 6 como segundo argumento para obtener los dos caracteres del mes

  // Convierte el mes a un número entero
  const mesActual = parseInt(MES, 10);

  // Calcula el período actual y el período anterior
  const PERIODO_ACTUAL = `${ANIO}${MES}`;
  const mesAnterior = mesActual === 1 ? 12 : mesActual - 1; // Maneja el caso de enero
  const mesAnteriorFormateado = mesAnterior.toString().padStart(2, '0');
  const ANIO_ANTERIOR = mesActual === 1 ? (parseInt(ANIO, 10) - 1).toString() : ANIO;
  const PERIODO_ANTERIOR = `${ANIO_ANTERIOR}${mesAnteriorFormateado}`;

  // Muestra los períodos actuales y anteriores
  console.log(`Período Actual: ${PERIODO_ACTUAL}, Período Anterior: ${PERIODO_ANTERIOR}`);

  return PERIODO_ANTERIOR;
}

// Llama a la función con un ejemplo de PERIODO
//GetPeriodoAnterior('202311');



function calcularPeriodos() {
  // Define el año 2023
  const ANIO = 2023;

  // Inicia el bucle desde enero (mes 1) hasta diciembre (mes 12)
  for (let mes = 1; mes <= 12; mes++) {
    // Formatea el mes como 'MM' con ceros a la izquierda si es necesario
    const mesActual = mes.toString().padStart(2, '0');

    // Calcula el período actual y el período anterior
    const PERIODO_ACTUAL = `${ANIO}${mesActual}`;
    const mesAnterior = mes === 1 ? 12 : mes - 1; // Maneja el caso de enero
    const mesAnteriorFormateado = mesAnterior.toString().padStart(2, '0');
    const PERIODO_ANTERIOR = mes === 1 ? `${ANIO - 1}${mesAnteriorFormateado}` : `${ANIO}${mesAnteriorFormateado}`;

    // Muestra los períodos actuales y anteriores
    console.log(`Período Actual: ${PERIODO_ACTUAL}, Período Anterior: ${PERIODO_ANTERIOR}`);
  }
}


async function main() {

  //calcularPeriodos();
  // const PERIODO = '202305';
  // let PERIODO_ANTERIOR = GetPeriodoAnterior( PERIODO );  
  
   try {
     await connectToOracle();

     // Llama a la función para ejecutar la inserción
    //  insertIntoCarS2M('202204');     
    //  insertIntoCarS2M('202205');     
    //  insertIntoCarS2M('202206');     
    //  insertIntoCarS2M('202207');     
    //  insertIntoCarS2M('202208');     
    //  insertIntoCarS2M('202209');     
    //  insertIntoCarS2M('202210');                                   
    //  insertIntoCarS2M('202211');     
    //  insertIntoCarS2M('202212');                                        
        insertIntoCarS2M('202309');                                            



   } catch (error) {
     console.error('Error en la función principal:', error);
   }
}

main();


