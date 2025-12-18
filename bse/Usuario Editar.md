En el proyecto frontend-miclub, necesito editar el componente profile.vue,

Funcionalidad:
recuerda trabajar las alertas con html y no con alert()
- actualizar los datos del perfil de usuario

para la propiedad path_foto, utilizar npm i cloudinary para subir la imagen a cloudinary y obtener el url de la imagen.
se debe poder editar el nombre y apellido 
y mostrar los datos  segun el retorno de servicio
{
    "usuario": {
        "id": "0e05d871-9780-43c6-95b4-02f3d3db7444",
        "email": "usuario_prueba_03@example.com",
        "provider": "local", //google o facebook
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
            "nombre": "ESTRELLA VERDE FC",
            "descripcion": "FUNDADO EN 1963",
            "admin_id": "0e05d871-9780-43c6-95b4-02f3d3db7444",
            "created_at": "2025-12-04T01:00:47.479151+00:00",
            "updated_at": "2025-12-04T01:00:47.479151+00:00",
            "path_foto": "https://res.cloudinary.com/duy2zl3ut/image/upload/v1766017883/ghu3uzirddakfeazbjts.png"
        },
        {
            "id": "20daf933-d0dd-4f96-a0c8-85cf793141d0",
            "nombre": "estrella roja",
            "descripcion": null,
            "admin_id": "0e05d871-9780-43c6-95b4-02f3d3db7444",
            "created_at": "2025-12-04T01:27:07.060458+00:00",
            "updated_at": "2025-12-04T01:27:07.060458+00:00",
            "path_foto": null
        }
    ],

}

Usa el stack: Vue 3, Vite y Axios.
modifica el componente en src/views/dashboard/ y src/views/finance/
Configura la ruta en src/router/index.js. si es que fuera necesario

Usa estilos oscuros/modernos acorde al diseño actual."





