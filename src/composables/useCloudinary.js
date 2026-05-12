/**
 * useCloudinary — composable para subir imágenes a Cloudinary.
 *
 * Estrategia de economía de almacenamiento:
 *   La imagen se comprime ANTES de subir (Canvas API) → menos MB en Cloudinary.
 *   Configuración: max 800px ancho, calidad JPEG 70%.
 *
 * Para thumbnails en listados se aplican transformaciones por URL (CDN, sin costo extra).
 *
 * Requisito: crear un upload preset "unsigned" en Cloudinary dashboard:
 *   Settings → Upload → Upload presets → Add upload preset
 *   Nombre: miclub_jugadores  |  Signing mode: Unsigned
 */

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

/**
 * Comprime y redimensiona una imagen usando Canvas antes de subirla.
 * @param {File} file  — archivo original del input
 * @param {number} maxWidth — ancho máximo en px (default 800)
 * @param {number} quality  — calidad JPEG 0-1 (default 0.70)
 * @returns {Promise<Blob>} imagen comprimida lista para subir
 */
async function comprimirImagen(file, maxWidth = 800, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onerror = () => reject(new Error('Error al leer el archivo'));
    reader.onload = (e) => {
      img.src = e.target.result;
      img.onerror = () => reject(new Error('Error al cargar la imagen'));
      img.onload = () => {
        let { width, height } = img;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => blob ? resolve(blob) : reject(new Error('Error al comprimir')),
          'image/jpeg',
          quality
        );
      };
    };
    reader.readAsDataURL(file);
  });
}

export function useCloudinary() {
  /**
   * Comprime y sube una imagen a Cloudinary.
   * @param {File} file — archivo seleccionado por el usuario
   * @param {function} onProgress — callback opcional con porcentaje (0-100)
   * @returns {Promise<string>} URL pública de la imagen subida
   */
  async function uploadImage(file, onProgress) {
    if (!CLOUD_NAME || !UPLOAD_PRESET) {
      throw new Error('Cloudinary no configurado: revisa VITE_CLOUDINARY_CLOUD_NAME y VITE_CLOUDINARY_UPLOAD_PRESET');
    }

    // 1. Comprimir antes de subir
    const compressed = await comprimirImagen(file);

    // 2. Preparar FormData para Cloudinary unsigned upload
    const formData = new FormData();
    formData.append('file', compressed, 'jugador.jpg');
    formData.append('upload_preset', UPLOAD_PRESET);
    formData.append('folder', 'miclub/jugadores');

    // 3. Subir con XMLHttpRequest para reportar progreso
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const data = JSON.parse(xhr.responseText);
          resolve(data.secure_url);
        } else {
          try {
            const err = JSON.parse(xhr.responseText);
            reject(new Error(err.error?.message || 'Error al subir imagen'));
          } catch {
            reject(new Error(`Error Cloudinary: ${xhr.status}`));
          }
        }
      });

      xhr.addEventListener('error', () => reject(new Error('Error de red al subir imagen')));

      xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`);
      xhr.send(formData);
    });
  }

  /**
   * Transforma una URL de Cloudinary para mostrar thumbnail.
   * Usa transformaciones por URL (CDN, sin costo de almacenamiento extra).
   * @param {string} url — URL original de Cloudinary
   * @param {number} w — ancho del thumbnail
   * @param {number} h — alto del thumbnail
   */
  function getThumbnailUrl(url, w = 60, h = 60) {
    if (!url || !url.includes('cloudinary.com')) return url;
    return url.replace('/upload/', `/upload/w_${w},h_${h},c_fill,q_auto,f_auto/`);
  }

  /**
   * URL optimizada para la foto grande del detalle del jugador.
   */
  function getDetailUrl(url) {
    if (!url || !url.includes('cloudinary.com')) return url;
    return url.replace('/upload/', '/upload/w_400,h_400,c_limit,q_auto,f_auto/');
  }

  return { uploadImage, getThumbnailUrl, getDetailUrl };
}
