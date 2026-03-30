Planifica e implementa una nueva funcionalidad frontend de forma estructurada.

## Funcionalidad a Implementar
$ARGUMENTS

---

## Proceso

```
1. Análisis de requerimientos
2. Plan técnico (vista + componentes + store + API)
3. Implementación
4. Verificación
```

---

## Fase 1: Análisis de Requerimientos

- **¿Qué problema resuelve?** — propósito en el flujo del usuario
- **¿Quién lo usa?** — admin del club
- **¿Qué datos muestra/modifica?** — qué endpoints del backend consume
- **¿Es módulo navegable?** — ¿necesita entrada en el menú de Navbar?
- **¿Rompe algo existente?** — backward compat check

---

## Fase 2: Plan Técnico

### Lo que típicamente necesita una nueva sección:
- [ ] Vista nueva en `src/views/NombreVista.vue`
- [ ] Ruta en `src/router/index.js` con `meta: { requiresAuth: true }`
- [ ] Métodos nuevos en `src/api/index.js` (módulo correspondiente)
- [ ] Si tiene estado complejo: store nuevo en `src/stores/`
- [ ] Si es módulo navegable: entrada en array `menuItems` de `Navbar.vue`
- [ ] Componentes reutilizables en `src/components/{dominio}/` si aplica

---

## Fase 3: Implementación

Orden recomendado:
1. Crear métodos API en `src/api/index.js`
2. Crear la vista con estados loading/error/data
3. Registrar ruta en router con lazy loading
4. Agregar entrada al menú de Navbar si es módulo navegable
5. Verificar que el flujo completo funciona con el backend

---

## Convenciones del Proyecto

```javascript
// Router — siempre lazy loading y meta correcta
{
  path: '/nueva-ruta',
  name: 'NombreVista',
  component: () => import('../views/NuevaVista.vue'),
  meta: { requiresAuth: true }
}

// API — usar apiClient de src/api/index.js
export const nuevoModuloAPI = {
  getAll: (clubId) => apiClient.get(`/clubes/${clubId}/recurso`),
  create: (clubId, data) => apiClient.post(`/clubes/${clubId}/recurso`, data),
}

// Menú — editar array estático en Navbar.vue
const menuItems = [
  // ... existentes ...
  { nombre: 'Nuevo Módulo', ruta: '/nueva-ruta', icono: '🔧' },
]
```

---

## Definition of Done

- [ ] Vista conectada al backend real (no mock)
- [ ] Estados loading, error y vacío manejados
- [ ] Ruta registrada correctamente en router
- [ ] Entrada en Navbar si es módulo navegable
- [ ] Sin lógica de permisos — acceso completo para usuario autenticado
- [ ] Build sin errores (`npm run build`)
