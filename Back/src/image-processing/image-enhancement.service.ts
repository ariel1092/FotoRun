import { Injectable, Logger } from '@nestjs/common';
import sharp from 'sharp';

export interface ImageEnhancementOptions {
  contrast?: number; // 1.0 = no change, >1.0 = more contrast
  brightness?: number; // 1.0 = no change, >1.0 = brighter
  sharpen?: boolean; // Apply sharpening
  normalize?: boolean; // Normalize histogram
  grayscale?: boolean; // Convert to grayscale
  resize?: {
    width?: number;
    height?: number;
    maxDimension?: number; // Max width or height, maintain aspect ratio
  };
}

@Injectable()
export class ImageEnhancementService {
  private readonly logger = new Logger(ImageEnhancementService.name);

  /**
   * Enhance image for better detection
   */
  async enhanceImage(
    imageBuffer: Buffer,
    options: ImageEnhancementOptions = {},
  ): Promise<Buffer> {
    try {
      const {
        contrast = 1.2,
        brightness = 1.0,
        sharpen = true,
        normalize = true,
        grayscale = false,
        resize,
      } = options;

      let pipeline = sharp(imageBuffer);

      // Resize if needed (helps with detection performance)
      if (resize) {
        if (resize.maxDimension) {
          const metadata = await pipeline.metadata();
          const { width, height } = metadata;
          if (width && height) {
            if (width > resize.maxDimension || height > resize.maxDimension) {
              const ratio = Math.min(
                resize.maxDimension / width,
                resize.maxDimension / height,
              );
              pipeline = pipeline.resize(
                Math.round(width * ratio),
                Math.round(height * ratio),
              );
            }
          }
        } else if (resize.width || resize.height) {
          pipeline = pipeline.resize(resize.width, resize.height, {
            fit: 'inside',
            withoutEnlargement: true,
          });
        }
      }

      // Convert to grayscale if needed (better for OCR)
      if (grayscale) {
        pipeline = pipeline.greyscale();
      }

      // Normalize histogram (improves contrast)
      if (normalize) {
        pipeline = pipeline.normalise();
      }

      // Adjust contrast
      if (contrast !== 1.0) {
        pipeline = pipeline.linear(contrast, -(128 * contrast) + 128);
      }

      // Adjust brightness
      if (brightness !== 1.0) {
        pipeline = pipeline.modulate({
          brightness: brightness,
        });
      }

      // Apply sharpening (improves text detection)
      if (sharpen) {
        pipeline = pipeline.sharpen(1.0, 1.0, 2.0);
      }

      const enhancedBuffer = await pipeline.toBuffer();

      this.logger.log(
        `Image enhanced: ${imageBuffer.length} -> ${enhancedBuffer.length} bytes`,
      );

      return enhancedBuffer;
    } catch (error) {
      this.logger.error(`Error enhancing image: ${error.message}`);
      throw error;
    }
  }

  /**
   * Enhance region for OCR (optimized for text reading)
   * 🔧 MEJORA: Optimizado para números claros y visibles
   */
  async enhanceRegionForOCR(
    regionBuffer: Buffer,
    options: ImageEnhancementOptions = {},
  ): Promise<Buffer> {
    return this.enhanceImage(regionBuffer, {
      contrast: 2.5, // Aumentado de 2.0 para mejor contraste en números claros
      brightness: 1.2,
      sharpen: true,
      normalize: true,
      grayscale: true,
      ...options,
    });
  }

  /**
   * 🔧 NUEVO: Preprocesamiento optimizado para imágenes de alta calidad
   * Cuando el número es claro y visible, este método maximiza la calidad
   */
  async enhanceHighQualityImage(
    imageBuffer: Buffer,
    options: ImageEnhancementOptions = {},
  ): Promise<Buffer> {
    try {
      let pipeline = sharp(imageBuffer);

      // Para imágenes de alta calidad, hacer mejoras más sutiles pero efectivas
      pipeline = pipeline
        .normalise() // Normalizar histograma
        .greyscale() // Escala de grises para OCR
        .linear(2.5, -(128 * 2.5) + 128) // Contraste moderado
        .modulate({ brightness: 1.15 }) // Brillo ligeramente aumentado
        .sharpen(1.5, 1.5, 3.0); // Sharpening más agresivo para números claros

      const enhanced = await pipeline.toBuffer();
      
      this.logger.debug(
        `High-quality image enhanced: ${imageBuffer.length} -> ${enhanced.length} bytes`,
      );

      return enhanced;
    } catch (error) {
      this.logger.error(`Error enhancing high-quality image: ${error.message}`);
      return imageBuffer;
    }
  }

  /**
   * Enhance full image for detection (optimized for object detection)
   */
  async enhanceImageForDetection(
    imageBuffer: Buffer,
    options: ImageEnhancementOptions = {},
  ): Promise<Buffer> {
    return this.enhanceImage(imageBuffer, {
      contrast: 1.2,
      brightness: 1.0,
      sharpen: true,
      normalize: true,
      grayscale: false,
      resize: { maxDimension: 1920 }, // Resize large images for better performance
      ...options,
    });
  }

  /**
   * Upscale small regions to improve OCR accuracy
   * Small regions (< 100px) are scaled up to at least 200x200px
   */
  async upscaleRegionForOCR(regionBuffer: Buffer): Promise<Buffer> {
    try {
      const metadata = await sharp(regionBuffer).metadata();
      const { width, height } = metadata;

      if (!width || !height) {
        this.logger.warn('Could not get region dimensions, skipping upscaling');
        return regionBuffer;
      }

      // Only upscale if region is smaller than 200px in any dimension
      const minDimension = Math.min(width, height);
      if (minDimension >= 200) {
        this.logger.debug(`Region already large enough (${width}x${height}), skipping upscaling`);
        return regionBuffer;
      }

      // Calculate scale factor to make smallest dimension = 200px
      const scaleFactor = 200 / minDimension;
      const newWidth = Math.round(width * scaleFactor);
      const newHeight = Math.round(height * scaleFactor);

      this.logger.log(
        `Upscaling region from ${width}x${height} to ${newWidth}x${newHeight} (${scaleFactor.toFixed(2)}x)`
      );

      // Use Lanczos3 for high-quality upscaling
      const upscaledBuffer = await sharp(regionBuffer)
        .resize(newWidth, newHeight, {
          kernel: sharp.kernel.lanczos3,
          fit: 'fill',
        })
        .toBuffer();

      return upscaledBuffer;
    } catch (error) {
      this.logger.error(`Error upscaling region: ${error.message}`);
      return regionBuffer; // Return original if upscaling fails
    }
  }

  /**
   * Enhance region for tilted or bent bibs using multiple rotation angles
   * Prueba diferentes ángulos de rotación para corregir dorsales inclinados
   */
  async enhanceTiltedRegion(
    regionBuffer: Buffer,
    options: ImageEnhancementOptions = {},
  ): Promise<Buffer[]> {
    const rotatedVersions: Buffer[] = [];
    
    try {
      const metadata = await sharp(regionBuffer).metadata();
      const { width, height } = metadata;

      if (!width || !height) {
        return [regionBuffer];
      }

      // Probar múltiples ángulos de rotación: -15°, -10°, -5°, 0°, 5°, 10°, 15°
      const angles = [-15, -10, -5, 0, 5, 10, 15];
      
      for (const angle of angles) {
        try {
          let pipeline = sharp(regionBuffer);
          
          // Rotar si el ángulo no es 0
          if (angle !== 0) {
            pipeline = pipeline.rotate(angle, {
              background: { r: 255, g: 255, b: 255, alpha: 1 }, // Fondo blanco
            });
          }
          
          // Aplicar mejoras estándar
          const enhanced = await this.enhanceImage(
            await pipeline.toBuffer(),
            {
              contrast: 2.5,
              brightness: 1.2,
              sharpen: true,
              normalize: true,
              grayscale: true,
              ...options,
            },
          );
          
          rotatedVersions.push(enhanced);
        } catch (error) {
          this.logger.warn(`Error rotating region at angle ${angle}: ${error.message}`);
          // Continuar con el siguiente ángulo
        }
      }
      
      // Si no se generaron versiones rotadas, retornar la original
      return rotatedVersions.length > 0 ? rotatedVersions : [regionBuffer];
    } catch (error) {
      this.logger.error(`Error enhancing tilted region: ${error.message}`);
      return [regionBuffer];
    }
  }

  /**
   * Apply perspective correction to region (for bent/folded bibs)
   * Aplica corrección de perspectiva para dorsales doblados
   */
  async correctPerspective(
    regionBuffer: Buffer,
    options: {
      topLeft?: { x: number; y: number };
      topRight?: { x: number; y: number };
      bottomLeft?: { x: number; y: number };
      bottomRight?: { x: number; y: number };
    } = {},
  ): Promise<Buffer> {
    try {
      const metadata = await sharp(regionBuffer).metadata();
      const { width, height } = metadata;

      if (!width || !height) {
        return regionBuffer;
      }

      // Si no se proporcionan puntos de perspectiva, usar los bordes de la imagen
      const corners = {
        topLeft: options.topLeft || { x: 0, y: 0 },
        topRight: options.topRight || { x: width, y: 0 },
        bottomLeft: options.bottomLeft || { x: 0, y: height },
        bottomRight: options.bottomRight || { x: width, y: height },
      };

      // Crear matriz de transformación de perspectiva
      // Sharp no tiene transformación de perspectiva directa, pero podemos usar
      // una aproximación con remap o simplemente retornar la imagen mejorada
      // Para una implementación real de perspectiva, necesitarías una librería como OpenCV
      // Por ahora, aplicamos mejoras adicionales y sharpening para compensar
      
      const enhanced = await this.enhanceImage(regionBuffer, {
        contrast: 3.0,
        brightness: 1.2,
        sharpen: true,
        normalize: true,
        grayscale: true,
      });

      return enhanced;
    } catch (error) {
      this.logger.error(`Error correcting perspective: ${error.message}`);
      return regionBuffer;
    }
  }

  /**
   * Apply multiple enhancement strategies for difficult bibs
   * Aplica múltiples estrategias de mejora para dorsales difíciles
   */
  async enhanceDifficultBib(
    regionBuffer: Buffer,
  ): Promise<Buffer[]> {
    const strategies: Buffer[] = [];
    
    try {
      // Estrategia 1: Alto contraste + sharpen extremo
      strategies.push(
        await this.enhanceImage(regionBuffer, {
          contrast: 3.5,
          brightness: 1.1,
          sharpen: true,
          normalize: true,
          grayscale: true,
        }),
      );
      
      // Estrategia 2: Contraste medio + brillo alto
      strategies.push(
        await this.enhanceImage(regionBuffer, {
          contrast: 2.5,
          brightness: 1.5,
          sharpen: true,
          normalize: true,
          grayscale: true,
        }),
      );
      
      // Estrategia 3: Contraste muy alto + normalización
      strategies.push(
        await this.enhanceImage(regionBuffer, {
          contrast: 4.0,
          brightness: 1.0,
          sharpen: true,
          normalize: true,
          grayscale: true,
        }),
      );
      
      // Estrategia 4: Inversión de color (para textos claros en fondos oscuros)
      const inverted = await sharp(regionBuffer)
        .greyscale()
        .negate()
        .normalise()
        .linear(2.0, -(128 * 2.0) + 128)
        .sharpen(1.0, 1.0, 2.0)
        .toBuffer();
      strategies.push(inverted);
      
      return strategies;
    } catch (error) {
      this.logger.error(`Error applying multiple enhancement strategies: ${error.message}`);
      return [regionBuffer];
    }
  }
}

