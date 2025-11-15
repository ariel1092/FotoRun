# 📸 Guía de Pruebas - Rol Fotógrafo

Esta guía te ayudará a probar todas las funcionalidades de la aplicación desde el rol de **Fotógrafo**.

---

## 🔐 Paso 1: Iniciar Sesión

1. Abrí la aplicación en tu navegador
2. Hacé clic en **"Ingresar"** (o en **"Registrarse"** si es tu primera vez)
3. Ingresá tus credenciales:
   - **Email:** `lucas@marinero.com`
   - **Contraseña:** `Password123`
4. Hacé clic en **"Ingresar"**
5. Serás redirigido automáticamente al **Dashboard del Fotógrafo**

✅ **Verificación:** Deberías ver el dashboard con estadísticas (inicialmente en 0)

---

## 📅 Paso 2: Crear tu Primer Evento

1. En el dashboard, hacé clic en el botón **"Nuevo Evento"** (arriba a la derecha)
2. Completá el formulario:
   - **Nombre del evento:** Ej: "Maratón de Buenos Aires 2024"
   - **Fecha:** Seleccioná una fecha (puede ser futura o pasada)
   - **Ubicación:** Ej: "Parque 3 de Febrero, CABA"
   - **Distancia (opcional):** Ej: "21K", "42K", "10K"
3. Hacé clic en **"Crear Evento"**
4. Serás redirigido a la página del evento

✅ **Verificación:** Deberías ver el evento recién creado en la lista de eventos

---

## 📤 Paso 3: Subir Fotos al Evento

1. En la página del evento, hacé clic en **"Subir Fotos"** (o en el botón con ícono de subida)
2. Seleccioná una o varias fotos desde tu computadora
   - **Tip:** Podés seleccionar múltiples fotos a la vez (Ctrl + clic o Cmd + clic)
   - **Formatos soportados:** JPG, PNG, HEIC
3. Hacé clic en **"Subir"** o **"Subir Fotos"**
4. Esperá a que se complete la subida (verás un indicador de progreso)

✅ **Verificación:** Las fotos aparecerán en la galería del evento con estado "Pendiente"

---

## ⏳ Paso 4: Esperar el Procesamiento

1. Las fotos se procesan automáticamente para detectar números de dorsal
2. El estado cambiará de **"Pendiente"** → **"Procesando"** → **"Completado"**
3. Podés refrescar la página o esperar unos segundos (se actualiza automáticamente cada 10 segundos)
4. Una vez completado, verás el badge verde **"Completado"** en cada foto

✅ **Verificación:** Las fotos procesadas mostrarán cuántos dorsales se detectaron (ej: "4 dorsales")

---

## 🔍 Paso 5: Ver Detalles de una Foto

1. En la galería de fotos, hacé clic en el botón **"Ver"** (ícono de ojo) en cualquier foto
2. Verás:
   - La foto completa
   - Lista de dorsales detectados
   - Nivel de confianza de cada detección
   - Método usado (detección visual u OCR)
3. Podés alternar entre ver la foto original o con las detecciones marcadas

✅ **Verificación:** Deberías ver una tabla con todos los dorsales encontrados en la foto

---

## 🌐 Paso 6: Probar la Búsqueda Pública (Como Usuario)

1. Abrí una **ventana de incógnito** o **cerrá sesión** (para simular un usuario público)
2. En la página principal, hacé clic en **"Buscar fotos"** o **"Buscar mis fotos"**
3. Ingresá un **número de dorsal** que hayas visto en tus fotos procesadas
4. (Opcional) Seleccioná el evento específico
5. Hacé clic en **"Buscar fotos"**
6. Verás todas las fotos donde aparece ese dorsal

✅ **Verificación:** Deberías ver las fotos con marca de agua y opción de agregar al carrito

---

## 🛒 Paso 7: Probar el Flujo de Compra (Como Usuario)

1. En los resultados de búsqueda, seleccioná una o varias fotos (checkbox)
2. Hacé clic en **"Agregar al carrito"**
3. Serás redirigido al carrito
4. Ingresá un email para recibir las fotos
5. Hacé clic en **"Ir a pagar"**
6. Serás redirigido a MercadoPago (puedes cancelar la prueba)

✅ **Verificación:** El flujo de compra debería funcionar correctamente

---

## 📊 Paso 8: Revisar Estadísticas

1. Volvé al **Dashboard del Fotógrafo** (si estás en otra página)
2. En la pestaña **"Estadísticas"**, verás:
   - Total de fotos subidas
   - Fotos procesadas vs pendientes
   - Total de dorsales detectados
   - Fotos por evento

✅ **Verificación:** Los números deberían coincidir con tus acciones

---

## 🗑️ Paso 9: Gestionar Eventos y Fotos

### Eliminar/Desactivar un Evento:
1. En el dashboard, encontrá el evento que querés desactivar
2. Hacé clic en el botón de **eliminar** (ícono de basura)
3. Confirmá la acción
4. El evento se desactivará (soft delete) pero las fotos se mantienen

### Eliminar una Foto:
1. En la galería de fotos, hacé clic en el botón de **eliminar** (ícono de basura)
2. Confirmá la acción
3. La foto se eliminará permanentemente

✅ **Verificación:** Los elementos eliminados ya no deberían aparecer en las listas

---

## 🔄 Paso 10: Verificar Aislamiento de Datos

**IMPORTANTE:** Cada cuenta de fotógrafo es independiente.

1. Creá un evento y subí fotos con tu cuenta (`lucas@marinero.com`)
2. Cerá sesión
3. Iniciá sesión con otra cuenta de fotógrafo (ej: `cliente@jerpro.com`)
4. Verificá que **NO** veas los eventos ni fotos de la otra cuenta

✅ **Verificación:** Cada fotógrafo solo ve sus propios eventos y fotos

---

## 📱 Paso 11: Probar en Móvil

1. Abrí la aplicación en tu celular o tablet
2. Verificá que:
   - El menú hamburguesa funcione correctamente
   - Los botones sean fáciles de tocar
   - Las fotos se vean bien en pantalla pequeña
   - Los formularios sean fáciles de completar
   - La navegación sea fluida

✅ **Verificación:** La aplicación debería verse y funcionar bien en móvil

---

## ✅ Checklist de Funcionalidades

Marca cada funcionalidad cuando la pruebes:

- [ ] Iniciar sesión como fotógrafo
- [ ] Crear un nuevo evento
- [ ] Subir fotos a un evento
- [ ] Ver el procesamiento de fotos (pendiente → procesando → completado)
- [ ] Ver detalles de una foto con dorsales detectados
- [ ] Buscar fotos por dorsal (como usuario público)
- [ ] Agregar fotos al carrito
- [ ] Ver estadísticas en el dashboard
- [ ] Eliminar/desactivar un evento
- [ ] Eliminar una foto
- [ ] Verificar aislamiento de datos entre cuentas
- [ ] Probar en móvil

---

## 🆘 Problemas Comunes

### No puedo iniciar sesión
- Verificá que el email y contraseña sean correctos
- Asegurate de estar usando las credenciales de fotógrafo

### Las fotos no se procesan
- Esperá unos minutos, el procesamiento puede tardar
- Verificá que las fotos tengan buena calidad y contengan dorsales visibles
- Revisá la consola del navegador por errores

### No veo mis eventos
- Asegurate de estar logueado con la cuenta correcta
- Verificá que los eventos estén activos (no desactivados)

### No puedo subir fotos
- Verificá que el archivo sea una imagen válida (JPG, PNG, HEIC)
- Asegurate de que el evento esté creado correctamente
- Revisá que tengas conexión a internet estable

---

## 📞 Soporte

Si encontrás algún problema o tenés dudas, contactá al equipo de desarrollo.

---

**Última actualización:** Diciembre 2024

