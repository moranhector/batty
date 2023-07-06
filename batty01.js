// myscript.js
// USERNAME :LAPN810P
// DATABASE: M4PNET_LX_PROD
// PASSWOERD M4ProdPA$$

const oracledb = require('oracledb');

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

const mypw = "i77ShxISNuG5m5iG"   // set mypw to the hr schema password GDE
// const mypw = "M4ProdPA$$"   // set mypw to the hr schema password
//const mypw = "M4DesaPA$$"   // set mypw to the hr schema password

async function run() {

    const connection = await oracledb.getConnection ({
        user          : "consulta01",
        //user          : "LAPN810P",
        password      : mypw,
        //connectString: '(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=dicoda3-scan)(PORT=1521))(CONNECT_DATA=(SERVER=DEDICATED)(SERVICE_NAME=RRHHTST)))',
        connectString: 'bbdd.gde4p.mendoza.gov.ar:1521/GDE4P'        //GDE
        // connectString: 'dicoda3-scan.mendoza.gov.ar:1521/RRHHPRD'    //M4PRD
        //connectString: 'm4pndbdes-scan.mendoza.gov.ar:1521/RRHHDES'  //M4DESA
    
    });

    //const result = await connection.execute("SELECT * FROM V$VERSION" );

    // SELECT COUNT(*) FROM historialoperaciones WHERE SUBSTR(FECHA_OPERACION,4,4)='2021'    

    //const result = await connection.execute("SELECT COUNT(*) FROM EE_GED.historialoperaciones WHERE SUBSTR(FECHA_OPERACION,4,4)='2021'" );
    //const result = await connection.execute( "SELECT * FROM ALL_TAB_PRIVS WHERE GRANTEE = 'eu_ged'" );    
    //const result = await connection.execute('SELECT username FROM all_users');      //ESTO FUNCIONA OK


    // Establecer el contexto de usuario
    //await connection.execute('ALTER SESSION SET CURRENT_SCHEMA = EE_GED');

    // const result = await connection.execute(
    //     `SELECT department_id, department_name
    //     FROM departments
    //     WHERE department_id = :did`,
    //     [180],
    //     { maxRows: 10 }  // a maximum of 10 rows will be returned
    // );
   



    // Ejecutar la consulta en el contexto de usuario establecido
    //const result = await connection.execute(`SELECT count(*) FROM ee_ged.historialoperacion`,[] , { maxRows: 10 });    ///ok

//     select codigo_reparticion_destino, fecha_operacion from ee_ged.historialoperacion 
// where expediente='EX20194056143GDEMZA-MESA#MEIYE' order by fecha_operacion

const result = await connection.execute(`select codigo_reparticion_destino, expediente, tipo_operacion,  fecha_operacion from ee_ged.historialoperacion 
where expediente= :param_expediente order by fecha_operacion`,[`EX20194056143GDEMZA-MESA#MEIYE`] , { maxRows: 100 });   //OK FUNCIONA OK





    // const result = await connection.execute(
    //     `SELECT * FROM V$VERSION`,
    //     [18083471],  // bind value for :id
    // );    

    console.log(result.rows);
    await connection.close();
}

run();