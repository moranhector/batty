// batty_replica_incidencias.js
// PROGRAMA Node.JS DE PRUEBA CONCEPTO SE CONECTA A LA BASE DE META4
// Y A LA BASE MYSQL DEL SERVIDOR DE ALEX
// USA THICK CLIENT
// TOMA LOS REGISTROS DE LA TABLA m4sco_real_tm_prd  con SOCIEDAD = '0080'
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
select id_organization,
       std_id_hr,
       std_or_hr_period,
       sco_id_incidence,
       sco_dt_start,
       sco_or_part_time,
       sco_dt_end,
       sco_start_time,
       sco_end_time,
       sco_id_time_unit,
       sco_units,
       sco_last_day_proce,
       sco_ck_in_payroll,
       sco_id_inp_payperi,
       cfr_date_debut_abs,
       cfr_nb_jrs_carence,
       sar_id_sit_revista,
       sar_dt_start_apl,
       sar_dt_end_apl,
       sco_comment,
       id_approle,
       id_secuser,
       dt_last_update
  from LAPN810P.m4sco_real_tm_prd WHERE id_organization='0080'  
`;



// Consulta SQL para MySQL
const mysqlSQL = `
  INSERT INTO M4SCO_REAL_TM_PRD (
        ID_ORGANIZATION,
        STD_ID_HR,
        STD_OR_HR_PERIOD,
        SCO_ID_INCIDENCE,
        SCO_DT_START,
        SCO_OR_PART_TIME,
        SCO_DT_END,
        SCO_START_TIME,
        SCO_END_TIME,
        SCO_ID_TIME_UNIT,
        SCO_UNITS,
        SCO_LAST_DAY_PROCE,
        SCO_CK_IN_PAYROLL,
        SCO_ID_INP_PAYPERI,
        CFR_DATE_DEBUT_ABS,
        CFR_NB_JRS_CARENCE,
        SAR_ID_SIT_REVISTA,
        SAR_DT_START_APL,
        SAR_DT_END_APL,
        SCO_COMMENT,
        ID_APPROLE,
        ID_SECUSER,
        DT_LAST_UPDATE
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
