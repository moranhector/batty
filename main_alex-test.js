/* >> Script modelo para recibir info del Usuario en un Cliente de KEYCLOAK <<
   >> Guillermo Garcia / Hector Morán - DIC - 23/10/2023 <<

Antes de ejecutar el JS, es importante:
- Hacer LOGOUT de la Sesión
    url ejemplo en "alex-test": http://dicmxmkeycloakdev.mendoza.gov.ar/realms/DIC-test/protocol/openid-connect/logout
- Hacer un nuevo LOGIN
    url ejemplo en "alex-test": http://dicmxmkeycloakdev.mendoza.gov.ar/realms/DIC-test/protocol/openid-connect/auth?response_type=code&client_id=alex-test&redirect_uri=http://192.168.33.228:8000/dashboard&secret=dulcedelechechocolate&login=true&scope=openid
- Luego sí ejecutar el script, para obtener la info de usuario

Nota1: NO se puede volver a ejecutar el Script, una vez que se ejecutó 1 vez. Se debe volver a realizar el paso a paso descripto.
Nota2: NO funciona si se realiza un Refresh de la página, ya que cada consulta por JS debe ser con un CODE distinto, no es posible hacerlo con el mismo
*/

// Definición de Constantes
const keycloak = async () => {
const urlParams =
window.location.search && new
URLSearchParams(window.location.search);
if (urlParams && urlParams.get("code")) {
const code = urlParams.get("code");
  
// Mostrar CODE por pantalla
console.log("code", code);

// Definición de los parámetros para el Token
try {
const params = new URLSearchParams({
client_id: 'alex-test',
code: code,
redirect_uri: 'http://192.168.33.228:8000/dashboard', // Misma IP Base
grant_type: 'authorization_code',
client_secret: 'LqmIHsnF6xbwMuZFtf94JY2hd8uNPHpW', // NO es passphrease, es Secret
});
let result = await

// Generación del Token
fetch('http://dicmxmkeycloakdev.mendoza.gov.ar/realms/DIC-test/protocol/openid-connect/token',
{
method: 'POST',
headers: {'Content-Type':'application/x-www-form-urlencoded'},
body: params.toString()
});

// Mostrar PARAMS por Pantalla
console.log("params: ", params)

result = await result.json();
let userInfo = await

// Mostrar el TOKEN generado por Pantalla
console.log("result token: ", result.access_token)

// Generación de datos del usuario
fetch('http://dicmxmkeycloakdev.mendoza.gov.ar/realms/DIC-test/protocol/openid-connect/userinfo',
{
method: 'POST',
headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${result.access_token}`}
});
userInfo = await userInfo.json();

// Mostrar info del usuario por pantalla
console.log("keycloak ~ result userInfo:", userInfo);
} catch (error) {
console.log("keycloak ~ error:", error)
}
}
};
keycloak();