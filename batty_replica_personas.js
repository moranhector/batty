// batty_replica_incidencias.js
// PROGRAMA Node.JS DE PRUEBA CONCEPTO SE CONECTA A LA BASE DE META4
// Y A LA BASE MYSQL DEL SERVIDOR DE ALEX
// USA THICK CLIENT
// TOMA LOS REGISTROS DE LA TABLA std_person  con SOCIEDAD = '0080'
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
    std_id_person, 
    std_n_fam_name_1, 
    std_n_maiden_name, 
    std_n_first_name, 
    std_n_usual_name, 
    std_id_gender, 
    std_id_salutation, 
    std_dt_birth, 
    std_id_country, 
    std_id_geo_div, 
    std_id_sub_geo_div, 
    std_comment, 
    ssp_id_pais_emisor, 
    ssp_prim_apellido, 
    std_ssn, 
    sco_photo, 
    sco_home_page, 
    ssp_id_tp_doc, 
    sfr_n_maiden_name, 
    sfr_nm_birth_place, 
    std_id_geo_place, 
    std_ss_key, 
    std_ss_number, 
    sar_n_married_name, 
    sbr_id_raca, 
    sco_photo_inet, 
    sge_id_add_name, 
    sge_id_titel, 
    sge_id_vsw, 
    sge_n_name_compl, 
    suk_maiden_name, 
    suk_other_forename, 
    suk_previous_surna, 
    sus_death_date, 
    sco_smoker, 
    sco_gb_name, 
    sco_id_region, 
    sar_expedido, 
    sus_veteran, 
    sus_id_vet_dis_ty, 
    sus_id_veteran_whe, 
    sus_id_ethnicity, 
    scb_dig_ver, 
    sar_dt_defuncion, 
    id_approle, 
    sme_num_ss, 
    id_secuser, 
    sar_cuil, 
    scl_rut, 
    dt_last_update, 
    sme_rfc, 
    sme_curp, 
    sbr_cpf, 
    car_legajo
  from LAPN810P.std_person  
`;



// Consulta SQL para MySQL
const mysqlSQL = `
  INSERT INTO STD_PERSON (
    ID_ORGANIZATION,
    STD_ID_PERSON,
    STD_N_FAM_NAME_1,
    STD_N_MAIDEN_NAME,
    STD_N_FIRST_NAME,
    STD_N_USUAL_NAME,
    STD_ID_GENDER,
    STD_ID_SALUTATION,
    STD_DT_BIRTH,
    STD_ID_COUNTRY,
    STD_ID_GEO_DIV,
    STD_ID_SUB_GEO_DIV,
    STD_COMMENT,
    SSP_ID_PAIS_EMISOR,
    SSP_PRIM_APELLIDO,
    STD_SSN,
    SCO_PHOTO,
    SCO_HOME_PAGE,
    SSP_ID_TP_DOC,
    SFR_N_MAIDEN_NAME,
    SFR_NM_BIRTH_PLACE,
    STD_ID_GEO_PLACE,
    STD_SS_KEY,
    STD_SS_NUMBER,
    SAR_N_MARRIED_NAME,
    SBR_ID_RACA,
    SCO_PHOTO_INET,
    SGE_ID_ADD_NAME,
    SGE_ID_TITEL,
    SGE_ID_VSW,
    SGE_N_NAME_COMPL,
    SUK_MAIDEN_NAME,
    SUK_OTHER_FORENAME,
    SUK_PREVIOUS_SURNA,
    SUS_DEATH_DATE,
    SCO_SMOKER,
    SCO_GB_NAME,
    SCO_ID_REGION,
    SAR_EXPEDIDO,
    SUS_VETERAN,
    SUS_ID_VET_DIS_TY,
    SUS_ID_VETERAN_WHE,
    SUS_ID_ETHNICITY,
    SCB_DIG_VER,
    SAR_DT_DEFUNCION,
    ID_APPROLE,
    SME_NUM_SS,
    ID_SECUSER,
    SAR_CUIL,
    SCL_RUT,
    DT_LAST_UPDATE,
    SME_RFC,
    SME_CURP,
    SBR_CPF,
    CAR_LEGAJO
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