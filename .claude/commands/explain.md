Explica código o conceptos de forma clara y directa.

## Qué Explicar
$ARGUMENTS

---

## Proceso

1. Lee el código o archivo mencionado antes de explicar
2. Identifica el nivel de detalle apropiado según el contexto
3. Explica de lo general a lo específico

---

## Estilo de Explicación

- **Sin jerga innecesaria** — si usas un término técnico, defínelo brevemente
- **Ejemplos concretos** — muestra el código en acción
- **El "por qué" importa** — no solo qué hace el código, sino por qué está hecho así
- **Conectar con el proyecto** — relacionar con Vue 3, stores, router, API client

---

## Formatos según el tipo de consulta

### Para un componente o vista
```
## ¿Qué hace {nombre}?
{resumen en 1-2 oraciones}

## Flujo paso a paso
1. ...

## Puntos clave
- {algo no obvio}
```

### Para un concepto técnico
```
## {Concepto} en palabras simples
{analogía o explicación directa}

## Cómo aplica en este proyecto
{ejemplo específico del codebase}
```

### Para un error o comportamiento
```
## Por qué ocurre esto
{causa raíz}

## Cómo evitarlo
{patrón correcto}
```

---

## Contexto del Stack

- **Vue 3** con `<script setup>` y Composition API
- **Pinia** stores en `src/stores/` (`auth.js`, `club.js`)
- **Axios** centralizado en `src/api/index.js`
- **Vue Router 4** con guards `requiresAuth` / `hideForAuth`
- **Navbar** con menú estático (no depende de permisos)
- **Auth**: JWT en localStorage, refresh automático en interceptor de Axios
