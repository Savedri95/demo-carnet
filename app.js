const inputImagen = document.getElementById('inputImagen');
const btnCamara = document.getElementById('btnCamara');
const btnCapturar = document.getElementById('btnCapturar');
const btnProcesar = document.getElementById('btnProcesar');
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const imagenPreview = document.getElementById('imagenPreview');
const estado = document.getElementById('estado');

let streamCamara = null;

inputImagen.addEventListener('change', (e) => {
    const archivo = e.target.files[0];
    if (archivo) {
        const reader = new FileReader();
        reader.onload = (event) => {
            imagenPreview.src = event.target.result;
            btnProcesar.disabled = false;
            estado.innerText = "Imagen cargada. Listo para procesar.";
        };
        reader.readAsDataURL(archivo);
    }
});

btnCamara.addEventListener('click', async () => {
    try {
        streamCamara = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' } 
        });
        video.srcObject = streamCamara;
        video.style.display = 'block';
        btnCapturar.style.display = 'block';
        btnCamara.style.display = 'none';
    } catch (err) {
        alert("No se pudo acceder a la camara.");
        console.error(err);
    }
});

btnCapturar.addEventListener('click', () => {
    const context = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    imagenPreview.src = canvas.toDataURL('image/png');
    btnProcesar.disabled = false;
    estado.innerText = "Foto capturada. Listo para procesar.";
    
    streamCamara.getTracks().forEach(track => track.stop());
    video.style.display = 'none';
    btnCapturar.style.display = 'none';
    btnCamara.style.display = 'block';
});

// Funcion para escalar y mejorar la imagen
function mejorarImagen(src, escala = 3) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Escalar la imagen (3x mas grande para mejor OCR)
            canvas.width = img.width * escala;
            canvas.height = img.height * escala;
            
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            // Mejorar contraste
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            
            for (let i = 0; i < data.length; i += 4) {
                const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
                const factor = 1.5;
                data[i] = Math.min(255, Math.max(0, (avg - 128) * factor + 128));
                data[i + 1] = Math.min(255, Math.max(0, (avg - 128) * factor + 128));
                data[i + 2] = Math.min(255, Math.max(0, (avg - 128) * factor + 128));
            }
            
            ctx.putImageData(imageData, 0, 0);
            resolve(canvas.toDataURL('image/png'));
        };
        img.src = src;
    });
}

function validarEsCarnet(texto) {
    const palabrasClave = [
        'REGISTRO', 'CIVIL', 'IDENTIDAD', 'REPUBLICA', 'CHILE',
        'NOMBRES', 'APELLIDOS', 'SEXO', 'NACIONALIDAD',
        'DOMICILIO', 'FECHA', 'NACIMIENTO', 'RUN', 'RUT'
    ];
    
    const textoMayusculas = texto.toUpperCase();
    const coincidencias = palabrasClave.filter(palabra => 
        textoMayusculas.includes(palabra)
    );
    
    return {
        esCarnet: coincidencias.length >= 2,
        cantidad: coincidencias.length,
        palabras: coincidencias
    };
}

btnProcesar.addEventListener('click', async () => {
    estado.innerText = "Mejorando imagen...";
    btnProcesar.disabled = true;

    try {
        // Mejorar la imagen antes del OCR
        const imagenMejorada = await mejorarImagen(imagenPreview.src, 3);
        
        estado.innerText = "Procesando con OCR...";
        
        const result = await Tesseract.recognize(imagenMejorada, 'spa');
        const text = result.data.text;
        
        console.log("Texto completo detectado:", text);
        
        const validacion = validarEsCarnet(text);
        console.log("Coincidencias:", validacion.cantidad, validacion.palabras);
        
        if (validacion.cantidad < 2) {
            estado.innerText = `No se detecto un carnet. Solo encontro: ${validacion.palabras.join(', ') || 'nada'}. Intenta con una foto mas clara y cercana.`;
            btnProcesar.disabled = false;
            return;
        }

        const rut = extraerRUT(text);
        const fecha = extraerFecha(text);
        const nombre = extraerNombre(text);

        document.getElementById('rut').value = rut || "No detectado";
        document.getElementById('nombre').value = nombre || "No detectado";
        document.getElementById('fechaNacimiento').value = fecha || "No detectado";

        estado.innerText = "Carnet detectado. Datos extraidos.";
    } catch (error) {
        console.error("Error:", error);
        estado.innerText = "Error: " + error.message;
    } finally {
        btnProcesar.disabled = false;
    }
});

function extraerRUT(texto) {
    const regex = /\b\d{1,2}\.?\d{3}\.?\d{3}-?[0-9kK]\b/;
    const match = texto.match(regex);
    return match ? match[0] : null;
}

function extraerFecha(texto) {
    const regex = /\b\d{2}[-/]\d{2}[-/]\d{4}\b/;
    const match = texto.match(regex);
    return match ? match[0] : null;
}

function extraerNombre(texto) {
    const regex = /NOMBRES\s*[:.]?\s*([A-ZÁÉÍÓÚÑ\s]+?)(?=SEXO|NACIONALIDAD|FECHA|DOMICILIO|$)/i;
    const match = texto.match(regex);
    if (match && match[1]) {
        return match[1].trim();
    }
    return null;
}