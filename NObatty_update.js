const oracledb = require('oracledb');
oracledb.initOracleClient();
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

const express = require('express');
const mysql = require('mysql2');
const app = express();

let pool; // Variable para almacenar la pool de conexiones

const { oracleConfig, mysqlConfig } = require('./credenciales.js');
const oracleSQL = 'SELECT * FROM LAPN810P.CAR_S2M'; // Reemplaza con tu consulta Oracle

async function connectToOracle() {
  try {
    pool = await oracledb.createPool(oracleConfig); // Almacenar la pool en la variable pool
    const connection = await oracledb.getConnection();
    const result = await connection.execute(oracleSQL);
    //console.log('CONSULTA EN ORACLE:', result);
    await connection.release();

    return result.rows;
  } catch (err) {
    console.error('Error connecting to Oracle:', err);
    throw err;
  }
}

const commonCriteria = `
  estadolegajo = 1
  AND admin_persona = 'S'
  AND rats <> '9999999'
`;

async function updateCarS2M() {
  try {


    const sql = `
      UPDATE LAPN810P.CAR_S2M
      SET
        alex_altas = 1,
        alex_bajas = 1
      WHERE periodo = '202308'
      AND ${commonCriteria}
    `;

    console.log('QUERY ',sql);
    const connection = await oracledb.getConnection();
    await connection.startTransaction(); // Agrega esta línea para iniciar una transacción
    const result = await connection.execute(sql);
    await connection.commit(); // Agrega esta línea para confirmar la transacción
    await connection.release();
    console.log('Actualización exitosa.');
  } catch (error) {
    console.error('Error en la actualización:', error);
    await connection.rollback(); // Agrega esta línea para deshacer los cambios en caso de error
  }
}

async function main() {
  try {
    await connectToOracle();

    // Llama a la función para ejecutar la actualización
    updateCarS2M();
  } catch (error) {
    console.error('Error en la función principal:', error);
  }
}

main();
