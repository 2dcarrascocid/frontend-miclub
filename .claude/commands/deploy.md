Checklist de pre-deploy del frontend para producción.

## Target de Deploy
$ARGUMENTS

---

## Checklist de Pre-Deploy

### Código
- [ ] No hay `console.log` en código de producción
- [ ] No hay credenciales hardcodeadas (API keys, tokens)
- [ ] No hay `TODO` críticos sin resolver
- [ ] No hay referencias a `localhost` en el código

### Variables de Entorno
- [ ] `.env.production` tiene `VITE_API_BASE_URL` apuntando al backend de producción
- [ ] `.env.production` tiene `VITE_API_KEY` correcto para producción
- [ ] `.env` local NO se commitea (está en `.gitignore`)

### Calidad Vue 3
- [ ] No hay `console.error` activos en producción
- [ ] Todos los componentes manejan estado `loading` y `error`
- [ ] No hay `v-html` con contenido no sanitizado
- [ ] Lazy loading funciona en todas las rutas

### Funcionalidad
- [ ] Flujo de login / registro funciona
- [ ] Flujo de recuperación de contraseña funciona
- [ ] Navegación entre módulos funciona (menú estático en Navbar)
- [ ] La funcionalidad existente no fue rota

### Git
- [ ] Todo el código a deployar está commiteado
- [ ] Estás en el branch correcto

---

## Build y Deploy

```bash
# Build de producción
npm run build

# Verificar que el build no tiene errores
# Subir carpeta dist/ al hosting (S3, Netlify, etc.)
```

## Post-Deploy

- [ ] Verificar que la app carga correctamente en producción
- [ ] Probar login con usuario real
- [ ] Confirmar que conecta con el backend de producción (no localhost)
