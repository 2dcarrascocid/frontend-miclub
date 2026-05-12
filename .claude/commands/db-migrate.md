Crea o revisa migraciones de base de datos Supabase de forma segura.

## Migración a Crear o Revisar
$ARGUMENTS

---

**Nota**: Las migraciones SQL viven en el repo de backend (`backend-miclub/sql/`). Este skill aplica cuando trabajas en el frontend pero necesitas coordinar un cambio de schema.

---

## Proceso

1. Identificar qué columnas/tablas nuevas necesita el frontend
2. Comunicar al backend qué migración se necesita
3. Verificar que el backend ya ejecutó la migración antes de deployar el frontend

---

## Reglas de Compatibilidad Frontend-Backend

### Antes de consumir un endpoint nuevo:
- [ ] Verificar que la migración SQL ya se ejecutó en Supabase
- [ ] Verificar que el backend está deployado con el nuevo endpoint
- [ ] Verificar que `src/api/index.js` tiene el método correcto

### Al agregar campos nuevos a un formulario:
- [ ] El campo existe en la tabla de Supabase
- [ ] El endpoint del backend acepta ese campo
- [ ] El store actualiza correctamente el estado local

---

## Orden de Deploy con Migración

1. Ejecutar migración SQL en Supabase
2. Deployar backend con los nuevos handlers
3. Deployar frontend

**Nunca** deployar frontend que consume endpoints no existentes en producción.
