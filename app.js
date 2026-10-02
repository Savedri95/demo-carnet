// 1. Referencias a los elementos del HTML
const inputImagen = document.getElementById('inputImagen');
const btnCamara = document.getElementById('btnCamara');
const btnCapturar = document.getElementById('btnCapturar');
const btnProcesar = document.getElementById('btnProcesar');
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const imagenPreview = document.getElementById('imagenPreview');
const estado = document.getElementById('estado');

let streamCamara = null;

// 2. Manejo de subida de archivo
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

// 3. Manejo de la camara
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

// 4. Funcion para escalar y mejorar la imagen
function mejorarImagen(src, escala = 3) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = img.width * escala;
            canvas.height = img.height * escala;
            
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            
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

// 5. Validacion flexible de carnet
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

// 6. Procesamiento OCR
btnProcesar.addEventListener('click', async () => {
    estado.innerText = "Mejorando imagen...";
    btnProcesar.disabled = true;
    document.getElementById('confirmacion').style.display = 'none';

    try {
        const imagenMejorada = await mejorarImagen(imagenPreview.src, 3);
        
        estado.innerText = "Procesando con OCR...";
        
        const result = await Tesseract.recognize(imagenMejorada, 'spa');
        const text = result.data.text;
        
        console.log("Texto completo detectado:", text);
        
        const validacion = validarEsCarnet(text);
        console.log("Coincidencias:", validacion.cantidad, validacion.palabras);
        
        if (validacion.cantidad < 2) {
            estado.innerText = `No se detecto un carnet. Solo encontro: ${validacion.palabras.join(', ') || 'nada'}. Intenta con una foto mas clara.`;
            btnProcesar.disabled = false;
            return;
        }

        const rut = extraerRUT(text);
        const fecha = extraerFecha(text);
        const nombresData = extraerNombres(text);

        document.getElementById('rut').value = rut || "No detectado";
        document.getElementById('nombre').value = nombresData.nombres || "No detectado";
        document.getElementById('apellidoPaterno').value = nombresData.apPaterno || "No detectado";
        document.getElementById('apellidoMaterno').value = nombresData.apMaterno || "No detectado";
        document.getElementById('fechaNacimiento').value = fecha || "No detectado";

        estado.innerText = "Carnet detectado. Datos extraidos.";
    } catch (error) {
        console.error("Error:", error);
        estado.innerText = "Error: " + error.message;
    } finally {
        btnProcesar.disabled = false;
    }
});

// 7. Manejo del envio del formulario
document.getElementById('formulario').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const rut = document.getElementById('rut').value;
    const nombre = document.getElementById('nombre').value;
    const apPat = document.getElementById('apellidoPaterno').value;
    const apMat = document.getElementById('apellidoMaterno').value;
    const fecha = document.getElementById('fechaNacimiento').value;
    
    if (rut === 'No detectado' || nombre === 'No detectado' || fecha === 'No detectado') {
        alert('Hay campos sin detectar. Intenta con una imagen mas clara.');
        return;
    }
    
    document.getElementById('confRut').textContent = rut;
    document.getElementById('confNombre').textContent = nombre;
    document.getElementById('confApPat').textContent = apPat || 'No detectado';
    document.getElementById('confApMat').textContent = apMat || 'No detectado';
    document.getElementById('confFecha').textContent = fecha;
    document.getElementById('confirmacion').style.display = 'block';
    
    console.log('Datos enviados:', { rut, nombre, apPat, apMat, fecha });
    document.getElementById('confirmacion').scrollIntoView({ behavior: 'smooth' });
});

// --- Funciones de Extraccion ---

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

function extraerNombres(texto) {
    let apellidos = "";
    let nombres = "";
    
    // Buscar apellidos (suelen estar bajo la etiqueta APELLIDOS)
    const regexApellidos = /APELLIDOS\s*[:.]?\s*([A-ZÁÉÍÓÚÑ\s]+?)(?=NOMBRES|SEXO|NACIONALIDAD|FECHA|$)/i;
    const matchApellidos = texto.match(regexApellidos);
    if (matchApellidos && matchApellidos[1]) {
        apellidos = matchApellidos[1].trim();
    }
    
    // Buscar nombres (suelen estar bajo la etiqueta NOMBRES)
    const regexNombres = /NOMBRES\s*[:.]?\s*([A-ZÁÉÍÓÚÑ\s]+?)(?=SEXO|NACIONALIDAD|FECHA|DOMICILIO|$)/i;
    const matchNombres = texto.match(regexNombres);
    if (matchNombres && matchNombres[1]) {
        nombres = matchNombres[1].trim();
    }
    
    // Separar apellidos en Paterno y Materno
    const partesApellidos = apellidos.split(/\s+/);
    let apPaterno = "";
    let apMaterno = "";
    
    if (partesApellidos.length >= 2) {
        apPaterno = partesApellidos[0];
        apMaterno = partesApellidos.slice(1).join(' ');
    } else if (partesApellidos.length === 1) {
        apPaterno = partesApellidos[0];
    }
    
    return {
        nombres: nombres || apellidos, // Si no encuentra nombres, usa los apellidos como fallback
        apPaterno: apPaterno,
        apMaterno: apMaterno
    };
}