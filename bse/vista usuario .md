"En el proyecto frontend, quiero modificar la vista dashboard 
[Funcionalidad: modificar la vista dashboard].
la carga del subtitulo principal debe mostrar el nombre del club seleccionado. y luego el usuario conectado. 
con el detalle de su nombre, apellido  y perfil
al igual que el navbar tambien existen los datos del usuario conectado tambien modificar segun el servicio de autenticacion login 

Usa el stack: Vue 3, Vite y Axios.
modifica el componente en src/views/players/.
Configura la ruta en src/router/index.js. si es que fuera necesario
logica
Asegúrate de consumir el endpoint del backend: 
POST : http://localhost:3000/auth/login
return: 
{
    "usuario": {
        "id": "0e05d871-9780-43c6-95b4-02f3d3db7444",
        "email": "usuario_prueba_03@example.com",
        "provider": "local",
        "metadata": {
            "nombre": "Juan",
            "apellido": "Perez"
        },
        "created_at": "2025-12-03T20:17:56.830233+00:00",
        "updated_at": "2025-12-03T20:17:56.830233+00:00"
    },
    "roles": [
        "admin"
    ],
    "permisos": [],
    "clubes": [
        {
            "id": "0017c061-4f9b-439a-90d7-2afe19f2cda3",
            "nombre": "estrella verde",
            "descripcion": null,
            "admin_id": "0e05d871-9780-43c6-95b4-02f3d3db7444",
            "created_at": "2025-12-04T01:00:47.479151+00:00",
            "updated_at": "2025-12-04T01:00:47.479151+00:00"
        },
        {
            "id": "20daf933-d0dd-4f96-a0c8-85cf793141d0",
            "nombre": "estrella roja",
            "descripcion": null,
            "admin_id": "0e05d871-9780-43c6-95b4-02f3d3db7444",
            "created_at": "2025-12-04T01:27:07.060458+00:00",
            "updated_at": "2025-12-04T01:27:07.060458+00:00"
        }
    ],
    "tokens": {
        "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwZTA1ZDg3MS05NzgwLTQzYzYtOTViNC0wMmYzZDNkYjc0NDQiLCJyb2xlcyI6WyJhZG1pbiJdLCJpYXQiOjE3NjUyNDU0MjUsImV4cCI6MTc2NTI0NjMyNX0.9L5Z0fjbAhyf6EzpaUc10uLl8cFzbrfufzrX4dLwAAQ",
        "refresh_token": "94706495d8ab263589e60d09ac071f1de1b22b1ce1f419bf7a1a80a8ae86432c5e3cf5ded04d114028fd8bf7671d7320a7f3ca54031422df6701023d5b68ccfc",
        "session_id": "3a0dd985-61db-423e-9aba-54771073a004"
    }
} 


stylos
Usa estilos oscuros/modernos acorde al diseño actual."
Usa las clases de utilidad de style.css