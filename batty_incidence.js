// batty_replica_incidencias.js
// PROGRAMA Node.JS DE PRUEBA CONCEPTO SE CONECTA A LA BASE DE META4
// Y A LA BASE MYSQL DEL SERVIDOR DE ALEX
// USA THICK CLIENT
// TOMA LOS REGISTROS DE LA TABLA m4sco_incidence  con SOCIEDAD = '0080'
// Y LOS COPIA A MYSQL EN ALEX


const oracledb = require('oracledb');
oracledb.initOracleClient();
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;


const express = require('express');
const mysql = require('mysql2');

const app = express();


let pool; // Variable para almacenar la pool de conexiones

const {  oracleConfig, mysqlConfig  } = require('./credenciales.js');



 

// Consulta SQL para Oracle
const oracleSQL = `
    select 
    ID_ORGANIZATION, 
	SCO_ID_INCIDENCE, 
	SCO_INCIDENCEBRA, 
	SCO_INCIDENCEENG, 
	SCO_INCIDENCEESP, 
	SCO_INCIDENCEFRA, 
	SCO_INCIDENCEGEN, 
	SCO_INCIDENCEGER, 
	SCO_INCIDENCEITA, 
	DT_START, 
	DT_END, 
	SCO_ID_INC_GROUP, 
	SCO_ID_DEPENDENCE, 
	SCO_CK_IN_PAYROLL, 
	SCO_CK_CONTR_SUSP, 
	SCO_CK_PAID, 
	SCO_ID_INP_PAYPERI, 
	SCO_COMMENT, 
	SME_RAMA_INC, 
	SAR_CK_INTERRUP, 
	SAR_CK_ANTIGUEDAD, 
	SME_RIESGO_SUA, 
	ID_APPROLE, 
	ID_SECUSER, 
	DT_LAST_UPDATE, 
	CSCJ_ID_INC_SINGERH, 
	CAR_ID_INC_SIGNOS, 
	CAR_INC_HABILITA_SSE, 
	CAR_INC_NORMATIVA
  from LAPN810P.m4sco_incidence  
`;



// Consulta SQL para MySQL
const mysqlSQL = `
  INSERT INTO M4SCO_INCIDENCE (
    ID_ORGANIZATION, 
	SCO_ID_INCIDENCE, 
	SCO_INCIDENCEBRA, 
	SCO_INCIDENCEENG, 
	SCO_INCIDENCEESP, 
	SCO_INCIDENCEFRA, 
	SCO_INCIDENCEGEN, 
	SCO_INCIDENCEGER, 
	SCO_INCIDENCEITA, 
	DT_START, 
	DT_END, 
	SCO_ID_INC_GROUP, 
	SCO_ID_DEPENDENCE, 
	SCO_CK_IN_PAYROLL, 
	SCO_CK_CONTR_SUSP, 
	SCO_CK_PAID, 
	SCO_ID_INP_PAYPERI, 
	SCO_COMMENT, 
	SME_RAMA_INC, 
	SAR_CK_INTERRUP, 
	SAR_CK_ANTIGUEDAD, 
	SME_RIESGO_SUA, 
	ID_APPROLE, 
	ID_SECUSER, 
	DT_LAST_UPDATE, 
	CSCJ_ID_INC_SINGERH, 
	CAR_ID_INC_SIGNOS, 
	CAR_INC_HABILITA_SSE, 
	CAR_INC_NORMATIVA
  ) VALUES ?
`;

async function connectToOracle() {
    try {
      pool = await oracledb.createPool(oracleConfig); // Almacenar la pool en la variable pool
      const connection = await oracledb.getConnection();
      const result = await connection.execute(oracleSQL);
      console.log('CONSULTA EN ORACLE: ', result);
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

// ... Código anterior ...

const batchSize = 10000; // Cantidad de registros a insertar en cada batch

async function fetchOracleData(offset) {
  const offsetSQL = `OFFSET ${offset} ROWS`;
  const limitSQL = `FETCH FIRST ${batchSize} ROWS ONLY`;
  const paginatedSQL = oracleSQL.replace(/FETCH FIRST \d+ ROWS ONLY/, '');
  const paginatedSQLWithOffset = paginatedSQL + ` ${offsetSQL} ${limitSQL}`;

  const connection = await oracledb.getConnection();
  const result = await connection.execute(paginatedSQLWithOffset);
  await connection.release();

  return result.rows;
}

async function main() {
    try {
      await connectToOracle();
  
      let offset = 0;
      let totalInsertedRows = 0;
  
      while (true) {
        const oracleData = await fetchOracleData(offset);
        if (oracleData.length === 0) {
          break; // No más registros en Oracle, salimos del bucle
        }
  
        await insertToMySQL(oracleData);
        totalInsertedRows += oracleData.length;
        offset += batchSize;
  
        console.log(`Total inserted rows: ${totalInsertedRows}`);
      }
  
      // Cerrar la pool de conexiones cuando el proceso termine
      if (pool) {
        await pool.close();
        console.log('Pool de conexiones cerrada.');
      }
    } catch (err) {
      console.error("Error in main function:", err);
      // Si hay un error, asegurémonos de cerrar la pool de conexiones
      if (pool) {
        await pool.close();
        console.log('Pool de conexiones cerrada debido a un error.');
      }
    }
  }





main();