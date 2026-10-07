# ARCA Med — Frontend

Frontend web de **ARCA Med**, aplicación orientada al apoyo de la evaluación musculoesquelética y seguimiento de pacientes.

Desarrollado con **React, TypeScript y Vite**, conectado a una API desarrollada con **FastAPI y PostgreSQL**.

## Tecnologías

- React
- TypeScript
- Vite
- Tailwind CSS
- FastAPI
- PostgreSQL

## Instalación

Clonar el repositorio:

```bash
git clone URL_DEL_REPOSITORIO
cd arca-med-web
```

Instalar las dependencias:

```bash
npm install
```

Las librerías no se almacenan en GitHub. `npm install` utiliza `package.json` y `package-lock.json` para descargar automáticamente las dependencias y generar `node_modules`.

## Variables de entorno

Crear un archivo `.env.local` en la raíz del proyecto:

```env
VITE_API_URL=http://localhost:8000

VITE_ADMIN_EMAIL=
VITE_ADMIN_PASSWORD=

VITE_MEDICO_EMAIL=
VITE_MEDICO_PASSWORD=
```

Completar las credenciales con los usuarios de prueba disponibles en la base de datos.

> `.env.local` está incluido en `.gitignore` y no debe subirse al repositorio.

También se puede utilizar `.env.example` como referencia para conocer las variables necesarias.

## Ejecutar el proyecto

Primero debe estar ejecutándose el backend de ARCA Med en:

```text
http://localhost:8000
```

Luego iniciar el frontend:

```bash
npm run dev
```

El frontend estará disponible normalmente en:

```text
http://localhost:5173
```

## Accesos rápidos

Durante el desarrollo, el inicio de sesión dispone de:

- **Acceso rápido Admin**
- **Acceso rápido Médico**

Estos botones utilizan las credenciales configuradas en `.env.local` y realizan una autenticación real contra el backend.

## Estructura principal

```text
src/
├── components/    # Componentes de interfaz
├── routes/        # Páginas y rutas
├── services/      # Comunicación con la API
└── lib/           # Utilidades y configuración
```

## Comandos principales

```bash
npm run dev      # Servidor de desarrollo
npm run build    # Generar build
npm run lint     # Revisar código
npm run preview  # Previsualizar build
```

## Importante

Los siguientes archivos y carpetas no deben subirse al repositorio:

```text
node_modules/
.env.local
dist/
```

`node_modules` se vuelve a generar ejecutando:

```bash
npm install
```

---

**ARCA Med** se encuentra actualmente en desarrollo.
