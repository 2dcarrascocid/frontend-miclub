"En el proyecto frontend, quiero modificar la vista update jugador y eliminar jugador
[Funcionalidad: actualzar datos del jugadorm, eliminado logico del jugador].

debe tener la funcionalidad de: 
actualizar un jugador de un club en especifico
puede actulizar uno o mas campos
el campo activo puede ser true o false y es para activar o dar de baja al jugador. 
debe registrar el usuario que hizo la actualizacion y la fecha de la actualizacion.
ademas crea las funciones para salir de la vista de update y eliminar.
y muestra un mensaje de exito o error. en el un mensaje en mismo html bloqueando botones y campos para no producir mas acciones.

servicio 
PUT  | http://localhost:3000/clubes/{clubId}/jugadores/{id}
body dinamico:
{
"nombre_completo":"Actulizacion de jugador", 
"rut":"2222222-2", 
"email":"test123@gmail.com", 
"telefono":"66666", 
"fecha_nacimiento":"08-05-1977", 
"es_socio": true, 
"es_jugador": false, 
"folio":525,
"usuario_id":"1",
"activo":false,
"path_foto":"localo/host1"
}

Usa el stack: Vue 3, Vite y Axios.
modifica el componente en src/views/players/.
Configura la ruta en src/router/index.js. si es que fuera necesario
Usa estilos oscuros/modernos acorde al diseño actual."
Usa las clases de utilidad de style.css
