
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


////////////////////////////////////////////////////////////////





 
 "SELECT ETIQUETA  as uor,EMPLEADOS as cantidad  FROM
 (SELECT lqhislegpuerca,lqhislegpuerju, COUNT(DISTINCT cuil) AS EMPLEADOS FROM CAR_SIGNOS WHERE estadolegajo=1 AND admin_persona='S' AND rats<>'9999999' AND periodo='202307'  GROUP BY lqhislegpuerca,lqhislegpuerju) AS total
 INNER JOIN INSTITUCIONES ON total.lqhislegpuerca=caracter AND total.lqhislegpuerju=jurisdiccion GROUP BY ETIQUETA, EMPLEADOS;
 " ;

 



app.get('/jubilaciones_uor', async (req, res) => {
    try {
      console.log('Atendiendo /jubilaciones/:periodo ...');
  
      
      const periodo = req.params.periodo;
      const connection = await oracledb.getConnection(oracleConfig);
  
      const resultJubilaciones = await connection.execute(`
      select cuil, 
      SUBSTR(nombreapellido, 1, 40) AS nombreapellido,
      TO_CHAR(fechanacimiento, 'DD/MM/YYYY') AS fechanacimiento,
      TO_CHAR(fechaingreso, 'DD/MM/YYYY') AS fechaingreso,    
      genero, periodo, descripcionuor  
        FROM LAPN810P.CAR_SIGNOS 
        WHERE estadolegajo=1 
        AND admin_persona='S' 
        AND rats<>'9999999' 
        AND periodo=:periodo
        AND genero='M' 
        AND to_number(rtrim(trunc(months_between(sysdate,FECHANACIMIENTO)/12)))>=65
      `, [periodo]);
  
  
      const responseJson = {
        data: resultJubilaciones.rows
      };  
  
  
      Doy gracias a la luna por ser la luna, a los peces por ser los peces, a la piedra imán por ser el imán.
      Doy gracias por aquel Alonso Quijano que, a fuer de crédulo lector, logró ser don Quijote.
      Doy gracias por la torre de Babel, que nos ha dado la diversidad de las lenguas.
      Doy gracias por la vasta bondad que inunda como el aire la tierra y por la belleza que acecha.
      Doy gracias por aquel viejo asesino, que en una habitación desmantelada de la calle Cabrera, me dio una naranja y me dijo: "No me gusta que la gente salga de mi casa con las manos vacías". Serían las doce de la noche y no nos vimos más.
      Doy gracias por el mar, que nos ha deparado la Odisea.
      Doy gracias por un árbol en Santa Fe y por un árbol en Wisconsin.
      Doy gracias a De Quincey por haber sido, a despecho del opio o por virtud del opio, De Quincey.
      Doy gracias por los labios que no he besado, por las ciudades que no he visto.
      Doy gracias a las mujeres que me han dejado o que yo he dejado, lo mismo da.
      Doy gracias por el sueño en el que me pierdo, como en aquel abismo en que los astros no conocían su camino.
      Doy gracias por aquella señora anciana que, con la voz muy tenue, dijo a quienes rodeaban su agonía "Dejenmé morir tranquila" y después la mala palabra, que por única vez le oímos decir.
      Doy gracias por las dos rectas espadas que Mansilla y Borges cambiaron, en la víspera de una de sus batallas.
      Doy gracias por la muerte de mi conciencia y por la muerte de mi carne.
      Sólo un hombre a quien no le queda otra cosa que el universo pudo haber escrito estas líneas.
      .
      En 'Sur', Buenos Aires, N° 325, julio-agosto 1970