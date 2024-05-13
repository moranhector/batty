const dbUtils = require('./dbMysql');

// Consulta SQL para MySQL
const mysqlSQL = `
  INSERT INTO historial2 (
    id,
    TIPO_OPERACION,
    FECHA_OPERACION,
    USUARIO,
    EXPEDIENTE,
    ID_EXPEDIENTE,
    GRUPO_SELECCIONADO,
    DESTINATARIO,
    REPARTICION_USUARIO,
    MOTIVO,
    ESTADO_ANTERIOR,
    LOGGEDUSERNAME,
    ESTADO,
    USUARIO_SELECCIONADO,
    TIPO_OPERACION_DETALLE,
    TAREA_GRUPAL,
    SECTOR_USUARIO_ORIGEN,
    CODIGO_REPARTICION_DESTINO,
    CODIGO_SECTOR_DESTINO,
    DESCRIPCION_REPARTICION_ORIGEN,
    DESCRIPCION_SECTOR_ORIGEN,
    DESCRIPCION_SECTOR_DESTINO,
    DESCRIPCION_REPARTICION_DESTIN,
    CODIGO_JURISDICCION_ORIGEN,
    CODIGO_JURISDICCION_DESTINO,
    ORD_HIST
  ) VALUES ?
`;

async function insertToMySQL(data) {
  const values = data.map((row) => Object.values(row));
  const connection = await dbUtils.connectToMySQL();

  connection.query(mysqlSQL, [values], (error, results) => {
    if (error) {
      console.error("Error inserting into MySQL:", error);
      throw error;
    }

    console.log("Inserted rows:", results.affectedRows);
    connection.end();
  });
}

async function getMaxIdFromMySQL() {
    const connection = await dbUtils.connectToMySQL();    
    return new Promise((resolve, reject) => {
      connection.query('SELECT MAX(id) AS maxId FROM historial2', (error, results) => {
        connection.end();
        if (error) {
          reject(error);
        } else {
          resolve(results[0].maxId);
        }
      });
    });
  }





module.exports = {
    insertToMySQL, 
    getMaxIdFromMySQL
  };
