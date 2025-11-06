# Scripts de Utilidad

## create-admin.js

Script para crear el primer usuario admin directamente en la base de datos.

### Uso

```bash
cd Back
node scripts/create-admin.js <email> <password> <firstName> [lastName]
```

### Ejemplo

```bash
node scripts/create-admin.js admin@jerpro.com Admin123 Admin Usuario
```

### Notas

- El script requiere que `DATABASE_URL` esté configurado en tu archivo `.env`
- Si el usuario ya existe, solo actualiza su rol a `admin`
- El script genera automáticamente el hash bcrypt de la contraseña

## create-photographer.js

Script para crear un usuario con rol de photographer directamente en la base de datos.

### Uso

```bash
cd Back
node scripts/create-photographer.js <email> <password> <firstName> [lastName]
```

### Ejemplo

```bash
node scripts/create-photographer.js fotografo@jerpro.com Password123 JERPRO
```

### Notas

- El script requiere que `DATABASE_URL` esté configurado en tu archivo `.env`
- Si el usuario ya existe, solo actualiza su rol a `photographer`
- El script genera automáticamente el hash bcrypt de la contraseña


