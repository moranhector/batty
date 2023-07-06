// mysoda.js

const oracledb = require('oracledb');

let clientOpts = {};

  clientOpts = 'C:\Oracle\instantclient_21_7_64'  ;
 // else on other platforms the system library search path
  // must always be set before Node.js is started.

// enable Thick mode which is needed for SODA
oracledb.initOracleClient(clientOpts);


const mypw = "M4ProdPA$$"   // set mypw to the hr schema password

oracledb.autoCommit = true;

async function run() {
    connection = await oracledb.getConnection( {
        user          : "LAPN810P",
        password      : mypw,
        connectString: '(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=dicoda3-scan)(PORT=1521))(CONNECT_DATA=(SERVER=DEDICATED)(SERVICE_NAME=RRHHTST)))',
    });

    // Create a new (or open an existing) document collection
    const soda = connection.getSodaDatabase();
    const collectionName = 'nodb_soda_collection';
    const myCollection = await soda.createCollection(collectionName);

    // Insert a new document
    const myContent = { name: "Sally", address: {city: "Melbourne"} };
    await myCollection.insertOne(myContent);

    // Print names of people living in Melbourne
    const filterSpec = { "address.city": "Melbourne" };
    const myDocuments = await myCollection.find().filter(filterSpec).getDocuments();
    myDocuments.forEach(function(element) {
        const content = element.getContent();
        console.log(content.name + ' lives in Melbourne.');
    });

    await connection.close();
}

run();