// constants.js
const MY_CONSTANT = 'Mi valor constante';

// Credenciales para Oracle
// const oracleConfig = {
//     user: "HMORAN",
//     password: "i77ShxISNuG5m5iG",
//     connectString: 'dicoda3-scan.mendoza.gov.ar:1521/RRHHPRD' 
//   };

  const oracleConfig = {
    user: "LAPN810P",
    password: "kHue-q173blJ4_xy",
    connectString: 'dicdb-rrhhtst.mendoza.gov.ar:1521/RRHHPRD' 
  };

 

// Credenciales para MySQL
const mysqlConfig = {
    host: 'dic-alex-tst.mendoza.gov.ar',
    user: 'alextstdba',
    password: 'WWnXg7JpW2PVd+aJ',
    database: 'alextstbbdd'
  };  

  module.exports = {
    oracleConfig, mysqlConfig
};
