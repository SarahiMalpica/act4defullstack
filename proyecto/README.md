# Actividad 4 - Full Stack

Aplicación web de gestión de productos con autenticación JWT.

## Requisitos

- Node.js 18+ (recomendado 20)
- npm
- MongoDB Atlas (URI de conexión)

## Instrucciones para ejecutar la aplicación

1. Entra a la carpeta del proyecto:

```bash
cd proyecto
```

2. Instala dependencias:

```bash
npm install
```

3. Crea `proyecto/.env` con:

```env
MONGO_URI=mongodb+srv://<usuario>:<password>@<cluster>/<database>?retryWrites=true&w=majority
JWT_SECRET=tu_clave_secreta
JWT_EXPIRES_IN=1h
PORT=5000
```

4. Ejecuta en desarrollo:

```bash
npm run dev
```

5. Abre en navegador:

`http://localhost:5000`

## Scripts

- `npm run dev`: desarrollo
- `npm start`: producción local
- `npm test`: pruebas

## Despliegue (Vercel)

- El proyecto ya incluye `vercel.json`.
- En Vercel configura variables: `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`.

## CI/CD

El pipeline debe estar en:

`.github/workflows/ci.yml`

## Repositorio

`https://github.com/SarahiMalpica/act4defullstack`
