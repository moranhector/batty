
// PROGRAMA Node.JS DE PRUEBA CONCEPTO SE CONECTA A LA BASE DE META4
// Y MUESTRA LA VERSION DE ORACLE
// USA THICK CLIENT

const oracledb = require('oracledb');
oracledb.initOracleClient();

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
//const mypw = "M4ProdPA$$"   // set mypw to the hr schema password
const mypw = "i77ShxISNuG5m5iG"   // set mypw to the hr schema password GDE

async function run() {

    
    const connection = await oracledb.getConnection ({
        user          : "HMORAN",
        password      : mypw ,
        connectString: 'dicoda3-scan.mendoza.gov.ar:1521/RRHHPRD'    //M4PRD
    
    });

     const result = await connection.execute(
         `SELECT * FROM V$VERSION`
     );    

    console.log(result.rows);
    await connection.close();
}

run();