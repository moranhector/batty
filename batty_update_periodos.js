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

async function insertIntoCarS2M() {
  try {

const PERIODO_ANTERIOR = '202307';
const PERIODO_ACTUAL   = '202308';

    const sql = `    
    UPDATE LAPN810P.CAR_S2M
    SET alex_altas = (
      SELECT COUNT(DISTINCT dni)
      FROM LAPN810P.CAR_SIGNOS
      WHERE NOT (LQHISLEGPUERCA = '1' AND LQHISLEGPUERJU = '2')
        AND PERIODO = '202308' 
        AND estadolegajo = 1 AND admin_persona = 'S' AND rats <> '9999999'
        AND dni NOT IN (
          SELECT DISTINCT dni
          FROM LAPN810P.CAR_SIGNOS
          WHERE NOT (LQHISLEGPUERCA = '1' AND LQHISLEGPUERJU = '2')
            AND PERIODO = '202307'
            AND estadolegajo = 1 AND admin_persona = 'S' AND rats <> '9999999'
        )
    ), alex_bajas = 
    (
      SELECT COUNT(DISTINCT dni)
      FROM LAPN810P.CAR_SIGNOS
      WHERE NOT (LQHISLEGPUERCA = '1' AND LQHISLEGPUERJU = '2')
        AND PERIODO = '202307'
        AND estadolegajo = 1 AND admin_persona = 'S' AND rats <> '9999999'
        AND dni NOT IN (
          SELECT DISTINCT dni
          FROM LAPN810P.CAR_SIGNOS
          WHERE NOT (LQHISLEGPUERCA = '1' AND LQHISLEGPUERJU = '2')
            AND PERIODO = '202308'
            AND estadolegajo = 1 AND admin_persona = 'S' AND rats <> '9999999'
        )
    ), alex_update = (SYSTIMESTAMP)
    where periodo='202308'     `;    
    



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

  calcularPeriodos();
  
  try {
    await connectToOracle();

    // Llama a la función para ejecutar la inserción
    insertIntoCarS2M();
  } catch (error) {
    console.error('Error en la función principal:', error);
  }
}

main();

