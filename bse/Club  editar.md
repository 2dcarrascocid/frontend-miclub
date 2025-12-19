En el proyecto frontend-miclub, necesito editar el componente clubs.vue, el modal  Editar Club

Funcionalidad:
- debe mostrar la propiedad deporte en la vista.
- actualizar los datos del club, la propiedad deporte.
- debe poder editar la propiedad deporte.
- debe existir un una lista para un select  
  'futbol',
  'futbolito',
  'babyfutbol',
  'futsal'
  'basquetbol',
  'voleibol',
  'rugby'
  'otro'
ademas se debe crear una funcion que asigne una imagen segun el deporte y sea remplazado dentro de la aplicacion para distinguir el club

'futbol'      → ⚽
'futbolito'   → ⚽
'babyfutbol'  → ⚽
'futsal'      → ⚽
'basquetbol'  → 🏀
'voleibol'    → 🏐
'rugby'       → 🏉
'otro'        → 🎽


json que espera el servicio
PUT /clubes/{clubId}
{
  "nombre": "Estrella Verde",
  "descripcion": "Club deportivo...",
  "path_foto": null, 
  "deporte":"futbol"
}


Usa el stack: Node.js 20, Serverless Framework v4 y Supabase.
Implementa la lógica en el handler utilizando la misma logica enterior de los demas endpoints.
actualizar archivo correspondiente 


