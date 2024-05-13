// batty04oramy.js
// PROGRAMA Node.JS DE PRUEBA CONCEPTO SE CONECTA A LA BASE DE META4
// Y A LA BASE MYSQL EN LOCALHOST
// USA THIN CLIENT * NO REQUIERE ORACLE INSTANT CLIENT
// TOMA LOS REGISTROS DE LA TABLA ee_ged.historialoperacion
// Y LOS COPIA A LOCALHOST MYSQL PARA ALEX

const oracledb = require('oracledb');
const express = require('express');
const mysql = require('mysql2');

const app = express();

// Credenciales para Oracle
const oracleConfig = {
  user: "consulta01",
  password: "i77ShxISNuG5m5iG",
  connectString: 'bbdd.gde4p.mendoza.gov.ar:1521/GDE4P'
};

// Credenciales para MySQL
const mysqlConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'alex'
};

// Credenciales para MySQL
// const mysqlConfig = {
//     host: 'dic-alex-tst.mendoza.gov.ar',
//     user: 'alextstdba',
//     password: 'WWnXg7JpW2PVd+aJ',
//     database: 'alextstbbdd'
// };



// Consulta SQL para Oracle
const oracleSQL = `
  SELECT
    ID,
    TIPO_OPERACION,
    FECHA_OPERACION,
    USUARIO,
    EXPEDIENTE,
    ID_EXPEDIENTE,
    GRUPO_SELECCIONADO,
    DESTINATARIO,
    REPARTICION_USUARIO,
    substr(MOTIVO, 0, 40) as motivo,
    ESTADO_ANTERIOR,
    LOGGEDUSERNAME,
    ESTADO,
    USUARIO_SELECCIONADO,
    TIPO_OPERACION_DETALLE,
    TAREA_GRUPAL,
    SECTOR_USUARIO_ORIGEN,
    CODIGO_REPARTICION_DESTINO,
    CODIGO_SECTOR_DESTINO,
    DESCRIPCION_REPARTICION_ORIGEN,
    DESCRIPCION_SECTOR_ORIGEN,
    DESCRIPCION_SECTOR_DESTINO,
    DESCRIPCION_REPARTICION_DESTIN,
    CODIGO_JURISDICCION_ORIGEN,
    CODIGO_JURISDICCION_DESTINO,
    ORD_HIST
  FROM ee_ged.historialoperacion 
  WHERE (codigo_reparticion_destino ='CGPROV#MHYF' OR reparticion_usuario ='CGPROV#MHYF')
  AND id > 25373236
  ORDER BY id
  FETCH FIRST 1 ROWS ONLY
`;

// Consulta SQL para MySQL
const mysqlSQL = `
  INSERT INTO historial2 (
    id,
    TIPO_OPERACION,
    FECHA_OPERACION,
    USUARIO,
    EXPEDIENTE,
    ID_EXPEDIENTE,
    GRUPO_SELECCIONADO,
    DESTINATARIO,
    REPARTICION_USUARIO,
    MOTIVO,
    ESTADO_ANTERIOR,
    LOGGEDUSERNAME,
    ESTADO,
    USUARIO_SELECCIONADO,
    TIPO_OPERACION_DETALLE,
    TAREA_GRUPAL,
    SECTOR_USUARIO_ORIGEN,
    CODIGO_REPARTICION_DESTINO,
    CODIGO_SECTOR_DESTINO,
    DESCRIPCION_REPARTICION_ORIGEN,
    DESCRIPCION_SECTOR_ORIGEN,
    DESCRIPCION_SECTOR_DESTINO,
    DESCRIPCION_REPARTICION_DESTIN,
    CODIGO_JURISDICCION_ORIGEN,
    CODIGO_JURISDICCION_DESTINO,
    ORD_HIST
  ) VALUES ?
`;

async function connectToOracle() {
  try {
    await oracledb.createPool(oracleConfig);
    const connection = await oracledb.getConnection();
    const result = await connection.execute(oracleSQL);
    console.log('CONSULTA EN ORACLE: ', result );
    await connection.release();

    return result.rows;
  } catch (err) {
    console.error("Error connecting to Oracle:", err);
    throw err;
  }
}

async function insertToMySQL(data) {
  const values = data.map((row) => Object.values(row));

  const connection = mysql.createConnection(mysqlConfig);
  connection.query(mysqlSQL, [values], (error, results) => {
    if (error) {
      console.error("Error inserting into MySQL:", error);
      throw error;
    }

    console.log("Inserted rows:", results.affectedRows);
    connection.end();
  });
}

async function main() {
  try {
    const oracleData = await connectToOracle();
    if (oracleData.length > 0) {
      insertToMySQL(oracleData);
    } else {
      console.log("No records to insert.");
    }
  } catch (err) {
    console.error("Error in main function:", err);
  } finally {
    oracledb.getPool().close();
  }
}

main();
