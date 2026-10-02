# Demo Lector de Carnet de Identidad

Sistema de reconocimiento óptico de caracteres (OCR) para extraer automáticamente datos del carnet de identidad chileno y pre-llenar formularios web.

## Descripción

Esta aplicación web permite capturar una imagen del carnet de identidad (ya sea mediante subida de archivo o cámara del dispositivo) y extraer automáticamente:
- RUT (Rol Único Tributario)
- Nombre completo
- Fecha de nacimiento

Utiliza Tesseract.js para el procesamiento OCR en el navegador, sin necesidad de backend ni servidores externos.

## Características

- **Captura flexible**: Subida de imagen o captura directa con cámara
- **Procesamiento local**: Todo el OCR se ejecuta en el navegador del usuario
- **Validación inteligente**: Detecta si la imagen corresponde a un carnet chileno
- **Mejora de imagen**: Escalado automático y mejora de contraste para mejor precisión
- **Extracción con regex**: Patrones específicos para datos chilenos

## Tecnologías

- HTML5
- JavaScript (ES6+)
- Tesseract.js 5.x (OCR)
- getUserMedia API (cámara)
- Canvas API (procesamiento de imagen)

## Instalación y uso

### Requisitos
- Navegador moderno (Chrome, Firefox, Edge)
- Servidor local (para acceso a cámara)

### Pasos

1. Clonar o descargar el repositorio
2. Abrir la carpeta del proyecto
3. Iniciar un servidor local:
   - Opción A: Usar Live Server en VS Code
   - Opción B: Python: `python -m http.server 8000`
   - Opción C: Node.js: `npx serve`
4. Abrir el navegador en `http://localhost:5500` (o el puerto correspondiente)
5. Seleccionar una imagen del carnet o usar la cámara
6. Hacer clic en "Procesar con OCR"
7. Revisar los datos extraídos en el formulario

## Estructura del proyecto
