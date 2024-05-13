const oracledb = require('oracledb');
const express = require('express');
const app = express();

oracledb.initOracleClient();
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

// Credenciales para Oracle
const oracleConfig = {
    user: "HMORAN",
    password: "i77ShxISNuG5m5iG",
    connectString: 'dicoda3-scan.mendoza.gov.ar:1521/RRHHPRD' 
  };

// Endpoint para la consulta
app.get('/genero', async (req, res) => {
  let connection;

  try {
    connection = await oracledb.getConnection(oracleConfig);

    const query = `
      SELECT COUNT(*) AS cantidad, genero
      FROM LAPN810P.CAR_SIGNOS 
      WHERE estadolegajo=1 AND admin_persona='S' AND rats<>'9999999' AND periodo='202307' 
      GROUP BY genero
    `;

    const result = await connection.execute(query);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al ejecutar la consulta:", error);
    res.status(500).json({ error: "Ocurrió un error al procesar la consulta." });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error("Error al cerrar la conexión:", err);
      }
    }
  }
});


// Endpoint para la consulta de planta
app.get('/planta', async (req, res) => {
    let connection;
  
    try {
      connection = await oracledb.getConnection(oracleConfig);
  
      const query = `
        SELECT COUNT(*) AS personas
        FROM LAPN810P.CAR_SIGNOS
        WHERE estadolegajo=1 AND admin_persona='S' AND rats<>'9999999' AND periodo='202307'
      `;
  
      const result = await connection.execute(query);
      res.json(result.rows);
    } catch (error) {
      console.error("Error al ejecutar la consulta:", error);
      res.status(500).json({ error: "Ocurrió un error al procesar la consulta." });
    } finally {
      if (connection) {
        try {
          await connection.close();
        } catch (err) {
          console.error("Error al cerrar la conexión:", err);
        }
      }
    }
  });

  

// Endpoint para la consulta de planta
app.get('/todos', async (req, res) => {
    let connection;
  
    try {
      connection = await oracledb.getConnection(oracleConfig);
  
      const query = `
        SELECT CUIL, NOMBREAPELLIDO
        FROM LAPN810P.CAR_SIGNOS
        WHERE estadolegajo=1 AND admin_persona='S' AND rats<>'9999999' AND periodo='202307'
      `;
  
      const result = await connection.execute(query);
      res.json(result.rows);
    } catch (error) {
      console.error("Error al ejecutar la consulta:", error);
      res.status(500).json({ error: "Ocurrió un error al procesar la consulta." });
    } finally {
      if (connection) {
        try {
          await connection.close();
        } catch (err) {
          console.error("Error al cerrar la conexión:", err);
        }
      }
    }
  });
  


// Puerto en el que se ejecutará el servidor
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
