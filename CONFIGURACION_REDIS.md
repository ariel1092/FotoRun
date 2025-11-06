# 🔴 Configuración de Redis

## Estado Actual

Redis **NO está corriendo** en tu sistema. Es necesario para el procesamiento asíncrono de fotos.

## Opciones para Instalar Redis

### Opción 1: Docker (Recomendado - Más Fácil)

```bash
# Instalar Docker Desktop si no lo tienes
# Luego ejecutar:
docker run -d --name redis -p 6379:6379 redis:latest
```

**Verificar que funciona:**
```bash
docker ps
# Deberías ver redis corriendo
```

### Opción 2: Windows Native

1. **Descargar Redis para Windows:**
   - Ir a: https://github.com/microsoftarchive/redis/releases
   - Descargar la última versión para Windows
   - O usar WSL2 (Windows Subsystem for Linux)

2. **Instalar y ejecutar:**
   ```bash
   # Extraer el archivo descargado
   # Ejecutar redis-server.exe
   ```

### Opción 3: WSL2 (Windows Subsystem for Linux)

```bash
# En WSL2:
sudo apt-get update
sudo apt-get install redis-server
sudo service redis-server start
```

### Opción 4: Usar Redis Cloud (Gratis)

1. Crear cuenta en https://redis.com/try-free/
2. Crear una base de datos gratuita
3. Obtener la URL de conexión
4. Agregar al `.env`:
   ```env
   REDIS_HOST=tu-host.redis.cloud
   REDIS_PORT=12345
   REDIS_PASSWORD=tu-password
   ```

## Verificar Instalación

Una vez instalado, ejecuta:

```bash
cd Back
node scripts/check-redis.js
```

Deberías ver: `✅ Conexión a Redis exitosa`

## Configuración en .env

Si Redis está en localhost (default), no necesitas agregar nada al `.env`.

Si Redis está en otro servidor, agrega:

```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=  # Solo si Redis tiene password
REDIS_DB=0
```

## Importante

**Sin Redis, el sistema funcionará pero:**
- ❌ Las fotos NO se procesarán automáticamente
- ❌ Quedarán en estado "pending" indefinidamente
- ❌ No se detectarán dorsales automáticamente

**Con Redis:**
- ✅ Las fotos se procesan automáticamente
- ✅ Los dorsales se detectan en segundo plano
- ✅ El sistema funciona completamente

