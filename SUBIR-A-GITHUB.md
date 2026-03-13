# 🚀 Subir ITFlow a GitHub

## 📋 Pasos para subir a GitHub

### 1. Crear Repositorio en GitHub

1. **Ve a [github.com](https://github.com)**
2. **Inicia sesión** con tu cuenta
3. **Haz clic en "New repository"** (o "Nuevo repositorio")
4. **Configura el repositorio:**
   - **Repository name**: `tzompantepec-itflow`
   - **Description**: `Sistema de gestión de tickets para el H. Ayuntamiento de Tzompantepec`
   - **Visibility**: Private (recomendado para datos municipales)
   - **NO marcar** "Add a README file" (ya existe)
   - **NO marcar** "Add .gitignore" (ya existe)
   - **NO marcar** "Choose a license" (ya existe)

5. **Haz clic en "Create repository"**

### 2. Conectar tu repositorio local

GitHub te mostrará los comandos para conectar. Copia y ejecuta en tu terminal:

```bash
# Añadir el remoto (reemplaza TU_USUARIO)
git remote add origin https://github.com/TU_USUARIO/tzompantepec-itflow.git

# Renombrar la rama a main
git branch -M main

# Subir el código
git push -u origin main
```

### 3. Verificar el repositorio

1. **Ve a tu repositorio en GitHub**
2. **Deberías ver todos los archivos del proyecto**
3. **Verifica que los archivos sensibles no estén subidos** (deberían estar en .gitignore)

### 4. Configurar Vercel (Opcional pero recomendado)

1. **Ve a [vercel.com](https://vercel.com)**
2. **"Import Git Repository"**
3. **Busca tu repositorio `tzompantepec-itflow`**
4. **Configura:**
   - Framework Preset: Other
   - Root Directory: .
   - Build Command: (dejar vacío)
   - Output Directory: (dejar vacío)

5. **"Deploy"**

### 5. Archivos que NO deben estar en GitHub

✅ **Ignorados correctamente por .gitignore:**
- `README-PRODUCCION.md` (contiene credenciales)
- `setup-users.js` (script de setup)
- Archivos `.env` o de configuración local
- Archivos temporales

### 6. Comandos útiles para el futuro

```bash
# Ver el estado del repositorio
git status

# Añadir cambios
git add .

# Hacer commit
git commit -m "tu mensaje descriptivo"

# Subir cambios
git push

# Ver historial
git log --oneline

# Ver branches
git branch
```

### 7. Flujo de trabajo recomendado

```bash
# 1. Actualizar tu repositorio local
git pull origin main

# 2. Crear nueva rama para cambios
git checkout -b feature/nueva-funcionalidad

# 3. Hacer tus cambios
# ... editar archivos ...

# 4. Hacer commit
git add .
git commit -m "feat: agregar nueva funcionalidad"

# 5. Subir la rama
git push origin feature/nueva-funcionalidad

# 6. Crear Pull Request en GitHub
# 7. Hacer merge a main
git checkout main
git pull origin main
```

## 🎯 URLs Importantes

- **Repositoritorio GitHub**: `https://github.com/TU_USUARIO/tzompantepec-itflow`
- **Vercel (si lo configuras)**: `https://tzompantepec-itflow.vercel.app`

## ✅ Checklist Final

- [ ] Repositorio creado en GitHub
- [ ] Código subido correctamente
- [ ] Archivos sensibles en .gitignore
- [ ] README.md visible
- [ ] LICENSE visible
- [ ] Vercel configurado (opcional)
- [ ] Despliegue funcionando

## 🚀 ¡Listo para producción!

Una vez en GitHub y Vercel, el sistema estará:
- ✅ Disponible online
- ✅ Con HTTPS gratuito
- ✅ Con CDN global
- ✅ Listo para usar

---

**Nota:** Mantén el repositorio como **Private** para proteger los datos municipales.
