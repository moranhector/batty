const dbUtils = require('./dbOracle');

async function executeOracleQuery(maxIdMySQL) {
    const oracleSQL = `
      SELECT
        ID,
        TIPO_OPERACION,
        FECHA_OPERACION,
        USUARIO,
        EXPEDIENTE,
        ID_EXPEDIENTE,
        GRUPO_SELECCIONADO,
        DESTINATARIO,
        REPARTICION_USUARIO,
        substr(MOTIVO, 0, 40) as motivo,
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
      FROM ee_ged.historialoperacion 
      WHERE (codigo_reparticion_destino ='CGPROV#MHYF' OR reparticion_usuario ='CGPROV#MHYF')
      AND id > ${maxIdMySQL}
      ORDER BY id
      FETCH FIRST 1 ROWS ONLY
    `;
  
    try {
      const connection = await dbUtils.connectToOracle();
      const result = await connection.execute(oracleSQL);
      console.log('CONSULTA EN ORACLE: ', result);
      await connection.release();
      return result.rows;
    } catch (err) {
      throw err;
    } finally {
      dbUtils.closeOracleConnection();
    }
  }
  

module.exports = executeOracleQuery;
