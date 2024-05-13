const oracledb = require('oracledb');
oracledb.initOracleClient();
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;


const express = require('express');
const mysql = require('mysql2');

const app = express();

// Credenciales para Oracle
const oracleConfig = {
  user: "HMORAN",
  password: "i77ShxISNuG5m5iG",
  connectString: 'dicoda3-scan.mendoza.gov.ar:1521/RRHHPRD' 
};




// Credenciales para MySQL
const mysqlConfig = {
  host: 'dic-alex-tst.mendoza.gov.ar',
  user: 'alextstdba',
  password: 'WWnXg7JpW2PVd+aJ',
  database: 'alextstbbdd'
};

// Servidor: dic-alex-tst.mendoza.gov.ar
// Base de datos: alextstbbdd
// usuario: alextstdba
// clave: WWnXg7JpW2PVd+aJ




// Consulta SQL para Oracle
const oracleSQL = `
select
id_organization,
clave,
cuil,
nombreapellido,
fechanacimiento,
legajosignos,
legajomt4,
situacionrevista,
estadolegajo,
fechaingreso,
lqhislegpuerca,
lqhislegpuerju,
lqhislegpueruo,
descripcionuor,
lqhislegdepnro,
dependencia,
rats,
clase,
horascatedras,
puntos,
lqhislegpuenro,
fechabaja,
periodo,
genero,
admin_persona,
prcesado,
registro,
id_approle,
id_secuser,
dt_last_update,
dni
FROM LAPN810P.CAR_SIGNOS WHERE PERIODO='202307'  
FETCH FIRST 200000 ROWS ONLY
`;

// FROM LAPN810P.CAR_SIGNOS WHERE CLAVE='202107157'  

// Consulta SQL para MySQL
const mysqlSQL = `
  INSERT INTO CAR_SIGNOS (
    ID_ORGANIZATION,
    CLAVE,
    CUIL,
    NOMBREAPELLIDO,
    FECHANACIMIENTO,
    LEGAJOSIGNOS,
    LEGAJOMT4,
    SITUACIONREVISTA,
    ESTADOLEGAJO,
    FECHAINGRESO,
    LQHISLEGPUERCA,
    LQHISLEGPUERJU,
    LQHISLEGPUERUO,
    DESCRIPCIONUOR,
    LQHISLEGDEPNRO,
    DEPENDENCIA,
    RATS,
    CLASE,
    HORASCATEDRAS,
    PUNTOS,
    LQHISLEGPUENRO,
    FECHABAJA,
    PERIODO,
    GENERO,
    ADMIN_PERSONA,
    PRCESADO,
    REGISTRO,
    ID_APPROLE,
    ID_SECUSER,
    DT_LAST_UPDATE,
    DNI
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
