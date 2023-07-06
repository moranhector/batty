
Necesito conectar una app de Node.js a Mysql.
Las credenciales para Mysql son:

Base de datos: alextstbbdd
usuario: alextstdba
clave: WWnXg7JpW2PVd+aJ

Quiero que la app muestre a continuación de la consulta actual muestre 
el resultado de los primeros 10 registros de la tabla estadias

SELECT * FROM estadias


Este es el código:



const oracledb = require('oracledb');

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

const mypw = "i77ShxISNuG5m5iG"   // set mypw to the hr schema password GDE
async function run() {

    const connection = await oracledb.getConnection ({
        user          : "consulta01",
        password      : mypw,
        connectString: 'bbdd.gde4p.mendoza.gov.ar:1521/GDE4P'        //GDE
    
    });

const result = await connection.execute(`select codigo_reparticion_destino, expediente, tipo_operacion,  fecha_operacion from ee_ged.historialoperacion 
where expediente= :param_expediente order by fecha_operacion`,[`EX20194056143GDEMZA-MESA#MEIYE`] , { maxRows: 100 });   //OK FUNCIONA OK

    console.log(result.rows);
    await connection.close();
}

run();