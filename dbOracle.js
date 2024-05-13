const oracledb = require('oracledb');


const oracleConfig = {
  user: "consulta01",
  password: "i77ShxISNuG5m5iG",
  connectString: 'bbdd.gde4p.mendoza.gov.ar:1521/GDE4P'
};



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



async function closeOracleConnection() {
  await oracledb.getPool().close();
}



module.exports = {
  connectToOracle,
  closeOracleConnection,
};
