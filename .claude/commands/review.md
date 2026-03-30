Realiza una revisión de código profesional del área especificada.

## Área a Revisar
$ARGUMENTS

## Proceso

1. Lee todos los archivos relevantes antes de opinar
2. Evalúa cada dimensión del checklist
3. Entrega el reporte con severidades claras

---

## Checklist de Revisión (Vue 3 Frontend)

### Corrección Funcional
- [ ] La lógica hace lo que dice que hace
- [ ] Los edge cases están contemplados (null, undefined, array vacío, loading)
- [ ] Los errores de Axios se manejan correctamente
- [ ] No hay condiciones de carrera en llamadas async

### Seguridad
- [ ] No hay `v-html` con contenido de API o usuario
- [ ] No hay secrets en código frontend (visibles en browser)
- [ ] Tokens JWT no expuestos fuera del store
- [ ] Sin URLs de API hardcodeadas

### Calidad de Código Vue 3
- [ ] Usa `<script setup>` (no Options API)
- [ ] Estados `loading`, `error`, `data` implementados
- [ ] Axios importado de `src/api/index.js`
- [ ] Sin `authStore.permissions` para controlar acceso — menú es estático
- [ ] Lazy loading en rutas del router
- [ ] Iconos de Lucide Vue Next únicamente

### Mantenibilidad
- [ ] El componente tiene responsabilidad única
- [ ] Sin lógica duplicada entre componentes
- [ ] Props y emits correctamente tipados
- [ ] Nombres descriptivos para variables y funciones

---

## Severidades

| Nivel | Descripción |
|-------|-------------|
| 🔴 **BLOQUEANTE** | Bug real, vulnerabilidad de seguridad, lógica incorrecta |
| 🟡 **IMPORTANTE** | Deuda técnica significativa, difícil de mantener |
| 🟢 **SUGERENCIA** | Mejora de calidad, buena práctica, preferencia de estilo |

---

## Formato de Output

```
## Code Review: {archivo o área}

### Resumen
{1-2 oraciones del estado general}

### 🔴 Bloqueantes
- **[archivo:línea]** Descripción + corrección sugerida

### 🟡 Importantes
- **[archivo:línea]** Descripción + sugerencia

### 🟢 Sugerencias
- **[archivo:línea]** Mejora opcional

### Veredicto
APROBADO / APROBADO CON CAMBIOS / RECHAZADO
```
