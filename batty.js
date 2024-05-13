const executeOracleQuery = require('./gdexpedienteSql');
const { insertToMySQL, getMaxIdFromMySQL } = require('./alexSql');

async function main() {


    
  try {
    const maxIdMySQL = await getMaxIdFromMySQL();
    console.log( 'El ultimo id en Mysql es : ', maxIdMySQL ) ;
    const oracleData = await executeOracleQuery( maxIdMySQL );
    if (oracleData.length > 0) {
      await insertToMySQL(oracleData);
    } else {
      console.log("No records to insert.");
    }
  } catch (err) {
    console.error("Error in main function:", err);
  }
}

main();
