import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Construye una URL de Cloudinary (delivery fetch) con marca de agua en texto en mosaico
// Requisitos de entorno: NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
export function buildCloudinaryWatermarkedUrl(originalUrl: string, text: string) {
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  if (!cloud || !originalUrl) return originalUrl

  // Texto URL-encoded y fuente
  const encodedText = encodeURIComponent(text)
  const fontSpec = 'Arial_50'

  // Transformaciones:
  // - Escalar a 1600px lado largo
  // - Colocar overlay de texto y aplicar e_tiling (mosaico), con baja opacidad
  // - Ajustar color blanco con contorno sutil para visibilidad
  const transformation = [
    'c_limit,w_1600',
    `l_text:${fontSpec}:${encodedText},co_rgb:ffffff,o_20`, // overlay de texto con 20% opacidad
    'fl_layer_apply,e_tiling',
  ].join('/')

  const encodedSource = encodeURIComponent(originalUrl)
  return `https://res.cloudinary.com/${cloud}/image/fetch/${transformation}/${encodedSource}`
}
