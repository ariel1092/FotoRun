# Configuración de Email (Nodemailer)

## 📧 Configuración de Gmail

Para usar Gmail como proveedor de email, necesitas generar una "App Password" (contraseña de aplicación):

### 1. Habilitar verificación en 2 pasos
1. Ve a tu cuenta de Google: https://myaccount.google.com/
2. Seguridad → Verificación en 2 pasos
3. Actívala si no la tienes

### 2. Generar App Password
1. Ve a: https://myaccount.google.com/apppasswords
2. Selecciona "Correo" y "Otro dispositivo personalizado"
3. Dale un nombre: "FotoRun Backend"
4. Copia la contraseña de 16 caracteres generada

### 3. Configurar .env
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu-email@gmail.com
EMAIL_PASSWORD=la-app-password-de-16-caracteres
EMAIL_FROM="FotoRun <noreply@fotorun.com>"
FRONTEND_URL=http://localhost:5173
```

⚠️ **IMPORTANTE**:
- Usa la App Password, NO tu contraseña normal de Gmail
- La App Password tiene 16 caracteres sin espacios
- Si cambias tu contraseña de Google, deberás generar una nueva App Password

---

## 🚀 Uso del EmailService

### Email de Bienvenida (ya implementado)
Se envía automáticamente cuando un usuario se registra:

```typescript
// En auth.service.ts - línea 124
this.emailService.sendWelcomeEmail({
  userName: user.getFullName(),
  userEmail: user.email,
});
```

### Email de Confirmación de Compra (próximamente)
Para enviar cuando se realice una compra:

```typescript
import { EmailService } from '../email/email.service';

// Inyectar en el constructor
constructor(private emailService: EmailService) {}

// Llamar después de procesar la compra
await this.emailService.sendPurchaseConfirmationEmail({
  userName: 'Leslie Morales',
  userEmail: 'leslie@example.com',
  eventName: 'Maratón de Buenos Aires 2024',
  purchaseDate: '08/11/2025 10:30 AM',
  totalAmount: 25.50,
  items: [
    {
      description: 'Foto Digital #3633',
      quantity: 1,
      price: 10.00,
    },
    {
      description: 'Paquete de 5 fotos',
      quantity: 1,
      price: 15.50,
    },
  ],
});
```

---

## 📬 Emails Implementados

### 1. Email de Bienvenida
- **Trigger**: Registro de nuevo usuario
- **Template**: `email.service.ts` línea 94-201
- **Incluye**:
  - Saludo personalizado
  - Beneficios de la plataforma
  - Botón para ir a FotoRun
  - Footer con info de contacto

### 2. Email de Confirmación de Compra
- **Trigger**: Manual (debes llamarlo después de procesar la compra)
- **Template**: `email.service.ts` línea 206-333
- **Incluye**:
  - Resumen de la compra
  - Tabla con items comprados
  - Total pagado
  - Botón para ver las fotos
  - Footer con info de contacto

---

## 🧪 Testing

Para probar que los emails funcionan, puedes:

### 1. Probar el email de bienvenida
Regístrate en el frontend o usa Postman:

```bash
POST http://localhost:8000/api/auth/register
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "Test123!",
  "name": "Usuario Test"
}
```

Deberías recibir un email de bienvenida en la dirección configurada.

### 2. Probar el email de compra (manualmente)
Puedes crear un endpoint temporal para probar:

```typescript
// En cualquier controller
@Get('test-purchase-email')
async testPurchaseEmail() {
  await this.emailService.sendPurchaseConfirmationEmail({
    userName: 'Leslie Morales',
    userEmail: 'tu-email@gmail.com', // Tu email real
    eventName: 'Maratón de Prueba',
    purchaseDate: new Date().toLocaleString('es-AR'),
    totalAmount: 25.50,
    items: [
      { description: 'Foto Digital #3633', quantity: 1, price: 10.00 },
      { description: 'Paquete de 5 fotos', quantity: 1, price: 15.50 },
    ],
  });
  return { message: 'Email enviado!' };
}
```

---

## 🔧 Troubleshooting

### Error: "Invalid login: 535-5.7.8 Username and Password not accepted"
- ✅ Verifica que estés usando la App Password, no tu contraseña normal
- ✅ Verifica que la verificación en 2 pasos esté activada
- ✅ Genera una nueva App Password

### Error: "Connection timeout"
- ✅ Verifica tu conexión a internet
- ✅ Verifica que el puerto 587 no esté bloqueado
- ✅ Intenta cambiar el puerto a 465 y `secure: true`

### Los emails no llegan
- ✅ Revisa la carpeta de spam
- ✅ Verifica los logs del backend (busca "Email sent successfully")
- ✅ Verifica que `EMAIL_FROM` tenga el formato correcto

### Gmail bloquea el envío
- ✅ Ve a: https://myaccount.google.com/lesssecureapps
- ✅ Habilita "Acceso de aplicaciones menos seguras" (si es necesario)
- ✅ O mejor aún, usa App Passwords (más seguro)

---

## 🎨 Personalizar Templates

Los templates están en `email.service.ts`. Puedes personalizar:

1. **Colores**: Busca `#667eea` y `#764ba2` para cambiar los colores principales
2. **Logo**: Agrega tu logo en el `<div class="header">`
3. **Textos**: Modifica cualquier texto directamente en el HTML
4. **Estilos**: Todos los estilos están inline en el `<style>` tag

---

## ✅ Próximos Pasos

1. ✅ Implementar email de confirmación de compra en el módulo de pagos/ventas
2. ⏳ Email de recuperación de contraseña
3. ⏳ Email de notificación cuando hay nuevas fotos disponibles
4. ⏳ Email de recordatorio de eventos próximos

---

**Implementado por**: Claude Code 🤖
**Fecha**: 08/11/2025
**Branch**: nodemailer
