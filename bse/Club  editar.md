En el proyecto frontend-miclub, necesito editar el componente clubs.vue, el modal  Editar Club

Funcionalidad:
- actualizar los datos del club
json que espera el servicio
PUT /clubes/{clubId}
{
  "nombre": "Estrella Verde",
  "descripcion": "Club deportivo...",
  "path_foto": null
}
para la propiedad path_foto, utilizar npm i cloudinary para subir la imagen a cloudinary y obtener el url de la imagen.

para ello cuento con las variables de entonrno
VITE_CLOUDINARY_CLOUD_NAME
VITE_CLOUDINARY_API_KEY
VITE_CLOUDINARY_API_SECRET
VITE_CLOUDINARY_URL

Usa el stack: Node.js 20, Serverless Framework v4 y Supabase.
Implementa la lógica en el handler utilizando la misma logica enterior de los demas endpoints.
actualizar archivo correspondiente 


