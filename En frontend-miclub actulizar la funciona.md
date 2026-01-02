En frontend-miclub actulizar la funcionalidad de crear eequipo con las nuevas propiedades:
en dashboard en caso que no exista club y se necesita crear el primer club aplicar estas reglas
root/src/views/Dashboard.vue
en caso de = <!-- SCENARIO 1: NO CLUBS (CREATE FIRST CLUB) -->
Funcionalidad:

- crear un club con las siguientes atributos:

servicio:
POST: http://localhost:3000/clubes
body:
{
"nombre": "usuario_prueba_03@example.com", // MAX: 100
"descripcion": "Password123!", // MAX : 200
"path_foto":"/", // RUTA DE IMAGEN CLOUDINARY_CLOUD
"deporte": "futbol" // exportar la lista de sport-options.json y seleccionar 1
}

Usa el stack: Vue 3, Vite y Axios.
Usa estilos oscuros/modernos acorde al diseño actual.
crea o actulaiza las clases de utilidad de style.css

PASO PREVIO:
En frontend-miclub crear una vista que con acceso libre sin login:
Funcionalidad:

- crear uns vista con acceso general con la presentancion de los palnes segun el archivo ./planes.json
- con acceso al login cuando el usuario ya tiene cuenta.
- acceso al registro de usuario caundo seleccione el el plan gratis.
- los pagados van a un link externo para pagar con trasbank (dejar listo para implementar posteriormente)

Usa el stack: Vue 3, Vite y Axios.
Usa estilos oscuros/modernos acorde al diseño actual.
crea o actulaiza las clases de utilidad de style.css

PERFIL
En frontend-miclub editar el perfil del usuario logeado: Profile.vue
Funcionalidad:

- mostrar los datos del usuario logeado.
- editar los datos del usuario logeado.
- listar los clubes que posee el usuario
- poder editar los datos del club que posee el usuario
- mostarar clubes, roles, permisos y planes en un solo tarjeta separdos por pestañas

te dejo el json que carga el perfil de un usuario logeado:
{"usuario":{"id":"56697878-60c5-451d-9f11-345779695952","email":"dcarrascocid@gmail.com","provider":"local","metadata":{"nombre":"DAVID","apellido":"CARRASCO"},"created_at":"2025-12-31T22:22:47.171357+00:00","updated_at":"2025-12-31T22:22:47.171357+00:00","email_verified":true,"verification_token":null,"verification_token_expires_at":null},"roles":["administrador_basic"],"permisos":[{"nombre":"Dashboard","ruta":"/dashboard","icono":"🏠","puede_editar":false},{"nombre":"Jugadores","ruta":"/players","icono":"👥","puede_editar":false},{"nombre":"Eventos","ruta":"/events","icono":"📅","puede_editar":false}],"clubes":[{"id":"7f6b4c25-e0f4-4a6c-b15a-7102f03bd4c8","nombre":"ESTRELLA VERDE FUTBOL CLUB","descripcion":"JUEGUEN COMO TOMAN","admin_id":"56697878-60c5-451d-9f11-345779695952","created_at":"2026-01-02T18:07:10.686617+00:00","updated_at":"2026-01-02T18:07:10.686617+00:00","path_foto":"https://res.cloudinary.com/duy2zl3ut/image/upload/v1767377229/zgbtglrinaqkeixbna5t.jpg","deporte":"futbol"}],"tokens":{"access_token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1NjY5Nzg3OC02MGM1LTQ1MWQtOWYxMS0zNDU3Nzk2OTU5NTIiLCJyb2xlcyI6WyJhZG1pbmlzdHJhZG9yX2Jhc2ljIl0sImlhdCI6MTc2NzM3OTU3NSwiZXhwIjoxNzY3MzgwNDc1fQ.IjS99jVJl_Yo6JNN1A8huf7ucWAhXqzKkIsls5mEoMM","refresh_token":"f67632ebd98f342465ffddf157eac56660d196b1291b86423f59c7d4f41eafb75ac34e18633a25695518a09389b6561c7891eb54e4f75dccc67b950f6aded6c8","session_id":"1e09e332-93f3-4494-974d-725ba6ff3dc4"},"plan":{"id":111, "plan":"xxxxx"}}
Usa el stack: Vue 3, Vite y Axios.
Usa estilos oscuros/modernos acorde al diseño actual.
crea o actulaiza las clases de utilidad de style.css