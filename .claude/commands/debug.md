Ayuda a diagnosticar y resolver un bug de forma sistemática.

## Problema a Debuggear
$ARGUMENTS

---

## Proceso de Debugging

### Paso 1: Entender el Problema
- ¿Qué debería pasar? ¿Qué está pasando en realidad?
- ¿Es reproducible siempre o de forma intermitente?
- ¿Cuándo empezó a ocurrir? ¿Hubo algún cambio reciente?
- ¿Hay un mensaje de error en consola o red disponible?

### Paso 2: Leer el Código Relevante
Antes de sugerir cualquier solución:
- Leer el componente o vista donde ocurre el error
- Leer el store si el error involucra estado global
- Revisar `src/api/index.js` si hay error de red

### Paso 3: Formular Hipótesis
Listar las causas más probables del problema, ordenadas por probabilidad.

### Paso 4: Verificar Hipótesis
Para cada hipótesis, identificar qué evidencia la confirma o descarta.

### Paso 5: Proponer Solución
Una sola solución clara con el diff exacto a aplicar.

---

## Errores Comunes en Este Frontend

### Vue 3
- `Cannot read properties of undefined` → dato llegó null antes de renderizar, falta `v-if` o valor por defecto
- `[Vue warn]: Component is missing template or render function` → import incorrecto del componente
- Store no reactivo → se usó `store.value` en lugar de `store.propiedad` o se desestructuró sin `storeToRefs`

### Axios / API
- `401` en todas las requests → token expirado, revisar refresh logic en `src/api/index.js`
- `403` → backend rechaza por API Key incorrecta (`VITE_API_KEY` en `.env`)
- `Network Error` → backend no está corriendo o URL incorrecta en `VITE_API_BASE_URL`

### Router
- Ruta redirige cuando no debería → revisar meta `requiresAuth` y `hideForAuth` en `router/index.js`
- Menú vacío → `authStore.permissions` está vacío; el menú es ESTÁTICO en `Navbar.vue` (array `menuItems`)

### Auth Store
- Usuario no persiste al recargar → revisar que `localStorage` se escribe correctamente en el store
- `isAuthenticated` incorrecto → revisar que el store inicializa desde `localStorage`

---

## Output Esperado

1. **Diagnóstico**: causa raíz identificada con evidencia del código
2. **Solución**: cambio específico (código antes y después)
3. **Verificación**: cómo confirmar que el fix funcionó
