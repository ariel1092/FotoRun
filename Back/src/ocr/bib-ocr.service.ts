import { Injectable, Logger, Optional } from '@nestjs/common';
import { createWorker, Worker, PSM } from 'tesseract.js';
import { ImageEnhancementService } from '../image-processing/image-enhancement.service';
import { GoogleVisionOCRService } from './google-vision-ocr.service';

export interface BibOCRResult {
  bibNumber: string;
  confidence: number;
  rawText: string;
  alternatives?: string[];
  method?: 'tesseract' | 'google_vision' | 'multimodal_consensus' | 'multimodal_fused' | 'multimodal_fused_overlap';
}

export interface OCRConfig {
  lang?: string;
  whitelist?: string; // Characters to recognize (e.g., '0123456789')
  psm?: PSM; // Page segmentation mode
  oem?: number; // OCR Engine mode
}

@Injectable()
export class BibOCRService {
  private readonly logger = new Logger(BibOCRService.name);
  private worker: Worker | null = null;
  private workerInitializing: Promise<Worker> | null = null; // 🔧 Lock para evitar múltiples inicializaciones
  private readonly defaultConfig: OCRConfig = {
    lang: 'eng',
    whitelist: '0123456789',
    psm: PSM.SINGLE_BLOCK, // Single block of text (better for multiple digits)
    oem: 3, // Default OCR Engine Mode
  };

  constructor(
    private readonly imageEnhancementService: ImageEnhancementService,
    @Optional() private readonly googleVisionService?: GoogleVisionOCRService,
  ) {}

  /**
   * Initialize Tesseract worker (thread-safe singleton)
   * 🔧 MEJORA: Evita múltiples inicializaciones concurrentes
   */
  async initializeWorker(): Promise<Worker> {
    // Si ya existe, retornarlo
    if (this.worker) {
      return this.worker;
    }

    // Si ya se está inicializando, esperar a que termine
    if (this.workerInitializing) {
      return this.workerInitializing;
    }

    // Inicializar worker con lock
    this.workerInitializing = (async () => {
      try {
        this.logger.log('Initializing Tesseract OCR worker...');
        
        // 🔧 MEJORA: Crear worker sin parámetros adicionales
        // Los parámetros se configuran después con setParameters
        this.worker = await createWorker(this.defaultConfig.lang || 'eng');

        // Configurar parámetros después de la creación (pero antes de usar)
        // 🔧 MEJORA: Usar tipos correctos (PSM enum, no string)
        await this.worker.setParameters({
          tessedit_char_whitelist: this.defaultConfig.whitelist || '0123456789',
          tessedit_pageseg_mode: this.defaultConfig.psm || PSM.SINGLE_BLOCK,
          // No configurar tessedit_ocr_engine_mode - se configura automáticamente
        });

        this.logger.log('Tesseract OCR worker initialized successfully');
        return this.worker;
      } catch (error) {
        this.logger.error(`Error initializing Tesseract worker: ${error.message}`);
        this.workerInitializing = null;
        throw error;
      } finally {
        // Limpiar el lock después de inicializar
        this.workerInitializing = null;
      }
    })();

    return this.workerInitializing;
  }

  /**
   * Read bib number from image region with multiple preprocessing attempts
   * Mejorado para manejar dorsales inclinados, doblados o parcialmente tapados
   * 🔧 MEJORA: Fast path para números claros y visibles
   */
  async readBibNumber(regionBuffer: Buffer): Promise<BibOCRResult | null> {
    try {
      const worker = await this.initializeWorker();

      // First, upscale region if it's too small (improves OCR accuracy)
      const upscaledRegion =
        await this.imageEnhancementService.upscaleRegionForOCR(regionBuffer);

      // 🔧 FAST PATH: Intentar primero con preprocesamiento ligero para números claros
      // Si el número es claro y visible, esto debería detectarlo rápidamente
      try {
        const quickEnhanced = await this.imageEnhancementService.enhanceImage(
          upscaledRegion,
          {
            contrast: 2.0,
            brightness: 1.1,
            sharpen: true,
            normalize: true,
            grayscale: true,
          },
        );

        const quickResult = await worker.recognize(quickEnhanced);
        let quickBibNumber = this.extractBibNumber(quickResult.data.text);
        
        if (!quickBibNumber) {
          const cleanedText = this.cleanText(quickResult.data.text);
          quickBibNumber = this.extractBibNumber(cleanedText);
        }

        // Si encontramos un número de 3-4 dígitos con alta confianza, retornarlo inmediatamente
        if (quickBibNumber && 
            quickBibNumber.length >= 3 && 
            quickBibNumber.length <= 4 &&
            quickResult.data.confidence >= 70) {
          this.logger.log(
            `✅ FAST PATH: Detección rápida de dorsal claro "${quickBibNumber}" (confianza: ${quickResult.data.confidence.toFixed(2)})`,
          );
          return {
            bibNumber: quickBibNumber,
            confidence: quickResult.data.confidence / 100,
            rawText: quickResult.data.text,
            method: 'tesseract',
          };
        }
      } catch (error) {
        // Continuar con estrategias completas si fast path falla
        this.logger.debug(`Fast path falló, continuando con estrategias completas: ${error.message}`);
      }

      // Intentar primero con las estrategias estándar
      let bestResult: {
        bibNumber: string;
        confidence: number;
        rawText: string;
      } | null = null;

      // Strategy 1: Try standard preprocessing strategies
      const preprocessingStrategies = [
        // Strategy 1: High contrast (optimizado para números claros)
        {
          contrast: 2.5,
          brightness: 1.2,
          sharpen: true,
          normalize: true,
          grayscale: true,
        },
        // Strategy 2: Very high contrast
        {
          contrast: 3.0,
          brightness: 1.0,
          sharpen: true,
          normalize: true,
          grayscale: true,
        },
        // Strategy 3: High brightness
        {
          contrast: 2.0,
          brightness: 1.5,
          sharpen: true,
          normalize: true,
          grayscale: true,
        },
        // Strategy 4: Extreme contrast
        {
          contrast: 3.5,
          brightness: 1.1,
          sharpen: true,
          normalize: true,
          grayscale: true,
        },
      ];

      for (let i = 0; i < preprocessingStrategies.length; i++) {
        const strategy = preprocessingStrategies[i];

        // Enhance upscaled region with current strategy
        const enhancedRegion = await this.imageEnhancementService.enhanceImage(
          upscaledRegion,
          strategy,
        );

        // Perform OCR
        const {
          data: { text, confidence },
        } = await worker.recognize(enhancedRegion);

        // 🔧 MEJORA: Extraer TODOS los dígitos del texto, incluso si están separados
        // Primero intentar extraer número completo
        let bibNumber = this.extractBibNumber(text);
        
        // Si no se encontró, intentar con texto limpio
        if (!bibNumber) {
          const cleanedText = this.cleanText(text);
          bibNumber = this.extractBibNumber(cleanedText);
        }
        
        // 🔧 NUEVO: Si aún no se encontró, intentar combinar TODOS los dígitos del texto
        // Esto es útil cuando OCR lee "2 0 1" en lugar de "201"
        if (!bibNumber && text) {
          const allDigits = text.match(/\d/g);
          if (allDigits && allDigits.length >= 2) {
            const combined = allDigits.join('');
            // Validar que el número combinado sea válido
            if (this.isValidBibNumberFromDigits(combined)) {
              bibNumber = combined;
              this.logger.debug(
                `Combined individual digits: "${text}" -> "${bibNumber}"`,
              );
            }
          }
        }

        // Log what OCR found for debugging
        if (text && text.trim().length > 0) {
          this.logger.debug(
            `OCR attempt ${i + 1}: text="${text.substring(0, 100)}", confidence=${confidence.toFixed(2)}, extracted="${bibNumber || 'none'}"`,
          );
        }

        if (bibNumber && (!bestResult || confidence > bestResult.confidence || bibNumber.length > bestResult.bibNumber.length)) {
          // Preferir números más largos si tienen confianza similar
          if (!bestResult || bibNumber.length > bestResult.bibNumber.length || 
              (bibNumber.length === bestResult.bibNumber.length && confidence > bestResult.confidence)) {
            bestResult = { bibNumber, confidence, rawText: text };
          }

          // 🔧 MEJORA: Para números claros (3-4 dígitos con alta confianza), retornar inmediatamente
          // Esto acelera el procesamiento cuando el número es visible y claro
          if (confidence > 75 && bibNumber.length >= 3 && bibNumber.length <= 4) {
            this.logger.log(
              `✅ OCR success on attempt ${i + 1}: "${bibNumber}" (confidence: ${confidence.toFixed(2)}) - número claro detectado`,
            );
            break; // No necesitamos probar más estrategias
          }
          
          // También retornar si tenemos muy alta confianza (>85) independientemente de longitud
          if (confidence > 85 && bibNumber.length >= 3) {
            this.logger.log(
              `✅ OCR success on attempt ${i + 1}: "${bibNumber}" (confidence: ${confidence.toFixed(2)}) - alta confianza`,
            );
            break;
          }
        }
      }

      // Strategy 2: Si no obtuvimos un buen resultado o el número es corto (< 3 dígitos),
      // intentar con rotaciones (para dorsales inclinados)
      if (!bestResult || bestResult.bibNumber.length < 3 || bestResult.confidence < 70) {
        this.logger.log('Trying rotated versions for tilted bibs...');
        
        try {
          const rotatedVersions = await this.imageEnhancementService.enhanceTiltedRegion(
            upscaledRegion,
          );

          for (let i = 0; i < rotatedVersions.length; i++) {
            const rotatedRegion = rotatedVersions[i];
            
            try {
              const {
                data: { text, confidence },
              } = await worker.recognize(rotatedRegion);

              let bibNumber = this.extractBibNumber(text);
              if (!bibNumber) {
                const cleanedText = this.cleanText(text);
                bibNumber = this.extractBibNumber(cleanedText);
              }
              
              // 🔧 MEJORA: Combinar dígitos individuales si no se encontró número completo
              if (!bibNumber && text) {
                const allDigits = text.match(/\d/g);
                if (allDigits && allDigits.length >= 2) {
                  const combined = allDigits.join('');
                  if (this.isValidBibNumberFromDigits(combined)) {
                    bibNumber = combined;
                  }
                }
              }

              // Log what rotated OCR found
              if (text && text.trim().length > 0) {
                this.logger.debug(
                  `Rotated OCR (angle ${i === 0 ? -15 : i === 1 ? -10 : i === 2 ? -5 : i === 3 ? 0 : i === 4 ? 5 : i === 5 ? 10 : 15}°): text="${text.substring(0, 100)}", confidence=${confidence.toFixed(2)}, extracted="${bibNumber || 'none'}"`,
                );
              }

              // Preferir números más largos o mayor confianza
              if (
                bibNumber &&
                (!bestResult ||
                  bibNumber.length > bestResult.bibNumber.length ||
                  (bibNumber.length === bestResult.bibNumber.length &&
                    confidence > bestResult.confidence))
              ) {
                bestResult = { bibNumber, confidence, rawText: text };
                this.logger.log(
                  `Found bib number in rotated version: "${bibNumber}" (confidence: ${confidence.toFixed(2)})`,
                );
              }
            } catch (error) {
              // Continuar con la siguiente rotación
              continue;
            }
          }
        } catch (error) {
          this.logger.warn(`Error trying rotated versions: ${error.message}`);
        }
      }

      // Strategy 3: Si aún no tenemos un buen resultado, intentar estrategias difíciles
      if (!bestResult || bestResult.bibNumber.length < 3 || bestResult.confidence < 60) {
        this.logger.log('Trying difficult bib enhancement strategies...');
        
        try {
          const difficultVersions = await this.imageEnhancementService.enhanceDifficultBib(
            upscaledRegion,
          );

          for (let i = 0; i < difficultVersions.length; i++) {
            const difficultRegion = difficultVersions[i];
            
            try {
              const {
                data: { text, confidence },
              } = await worker.recognize(difficultRegion);

              let bibNumber = this.extractBibNumber(text);
              if (!bibNumber) {
                const cleanedText = this.cleanText(text);
                bibNumber = this.extractBibNumber(cleanedText);
              }
              
              // 🔧 MEJORA: Combinar dígitos individuales si no se encontró número completo
              if (!bibNumber && text) {
                const allDigits = text.match(/\d/g);
                if (allDigits && allDigits.length >= 2) {
                  const combined = allDigits.join('');
                  if (this.isValidBibNumberFromDigits(combined)) {
                    bibNumber = combined;
                  }
                }
              }

              // Log what difficult strategy OCR found
              if (text && text.trim().length > 0) {
                this.logger.debug(
                  `Difficult bib OCR (strategy ${i + 1}): text="${text.substring(0, 100)}", confidence=${confidence.toFixed(2)}, extracted="${bibNumber || 'none'}"`,
                );
              }

              // Preferir números más largos o mayor confianza
              if (
                bibNumber &&
                (!bestResult ||
                  bibNumber.length > bestResult.bibNumber.length ||
                  (bibNumber.length === bestResult.bibNumber.length &&
                    confidence > bestResult.confidence))
              ) {
                bestResult = { bibNumber, confidence, rawText: text };
                this.logger.log(
                  `Found bib number in difficult strategy: "${bibNumber}" (confidence: ${confidence.toFixed(2)})`,
                );
              }
            } catch (error) {
              // Continuar con la siguiente estrategia
              continue;
            }
          }
        } catch (error) {
          this.logger.warn(`Error trying difficult bib strategies: ${error.message}`);
        }
      }

      // Always try Google Vision (it's more accurate than Tesseract for small text)
      if (this.googleVisionService?.isEnabled()) {
        this.logger.log('Trying Google Vision OCR...');

          const visionBibNumber =
            await this.googleVisionService.extractBibNumber(upscaledRegion);

          if (visionBibNumber) {
            this.logger.log(
              `Google Vision detected bib number: "${visionBibNumber}"`,
            );

            return {
              bibNumber: visionBibNumber,
              confidence: 0.85, // Google Vision is generally high confidence
              rawText: visionBibNumber,
              method: 'google_vision',
            };
          } else {
            this.logger.log(
              'Google Vision failed, falling back to Tesseract result',
          );
        }
      }

      // Log final result after all strategies
      if (!bestResult) {
        this.logger.warn(
          `No valid bib number found after all OCR strategies. This may indicate the image doesn't contain a readable bib number.`,
        );
        return null;
      }

      // Get alternatives if confidence is low
      const alternatives =
        bestResult.confidence < 80
          ? this.generateAlternatives(bestResult.bibNumber)
          : undefined;

      this.logger.log(
        `OCR result: "${bestResult.bibNumber}" (confidence: ${bestResult.confidence.toFixed(2)}, raw: "${bestResult.rawText}")`,
      );

      return {
        bibNumber: bestResult.bibNumber,
        confidence: bestResult.confidence / 100, // Convert to 0-1 scale
        rawText: bestResult.rawText,
        alternatives,
        method: 'tesseract',
      };
    } catch (error) {
      this.logger.error(
        `Error reading bib number with OCR: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }

  /**
   * SOLUCIÓN 4: Leer número de dorsal solo con Tesseract (sin Google Vision)
   * Para reconstrucción multimodal
   */
  async readBibNumberTesseractOnly(regionBuffer: Buffer): Promise<BibOCRResult | null> {
    try {
      const worker = await this.initializeWorker();
      const upscaledRegion = await this.imageEnhancementService.upscaleRegionForOCR(regionBuffer);

      // Usar estrategia de alto contraste
      const enhancedRegion = await this.imageEnhancementService.enhanceImage(upscaledRegion, {
        contrast: 2.5,
        brightness: 1.2,
        sharpen: true,
        normalize: true,
        grayscale: true,
      });

      const { data: { text, confidence } } = await worker.recognize(enhancedRegion);
      let bibNumber = this.extractBibNumber(text);
      if (!bibNumber) {
        const cleanedText = this.cleanText(text);
        bibNumber = this.extractBibNumber(cleanedText);
      }

      if (bibNumber) {
        return {
          bibNumber,
          confidence: confidence / 100,
          rawText: text,
          method: 'tesseract',
        };
      }

      return null;
    } catch (error) {
      this.logger.debug(`Tesseract-only OCR failed: ${error.message}`);
      return null;
    }
  }

  /**
   * SOLUCIÓN 4: Leer número de dorsal solo con Google Vision (sin Tesseract)
   * Para reconstrucción multimodal
   */
  async readBibNumberGoogleVisionOnly(regionBuffer: Buffer): Promise<BibOCRResult | null> {
    if (!this.googleVisionService?.isEnabled()) {
      return null;
    }

    try {
      const upscaledRegion = await this.imageEnhancementService.upscaleRegionForOCR(regionBuffer);
      const visionBibNumber = await this.googleVisionService.extractBibNumber(upscaledRegion);

      if (visionBibNumber) {
        return {
          bibNumber: visionBibNumber,
          confidence: 0.85, // Google Vision is generally high confidence
          rawText: visionBibNumber,
          method: 'google_vision',
        };
      }

      return null;
    } catch (error) {
      this.logger.debug(`Google Vision-only OCR failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Verificar si Google Vision está habilitado
   */
  isGoogleVisionEnabled(): boolean {
    return this.googleVisionService?.isEnabled() || false;
  }

  /**
   * Clean OCR text
   */
  private cleanText(text: string): string {
    return text
      .trim()
      .replace(/\s+/g, '') // Remove whitespace
      .replace(/[^\d]/g, ''); // Keep only digits
  }

  /**
   * 🔢 Normalizar errores comunes de OCR usando diccionario de correcciones
   * Corrige errores típicos como confusión de caracteres similares
   */
  private normalizeOCRText(text: string): string {
    if (!text) return text;
    
    // Diccionario de correcciones comunes de OCR
    const ocrCorrections: Record<string, string> = {
      // Confusiones comunes: O->0, I->1, l->1, S->5, Z->2, etc.
      'O': '0', // O mayúscula -> 0
      'o': '0', // o minúscula -> 0
      'I': '1', // I mayúscula -> 1
      'l': '1', // l minúscula -> 1
      '|': '1', // pipe -> 1
      'S': '5', // S mayúscula -> 5
      's': '5', // s minúscula -> 5
      'Z': '2', // Z mayúscula -> 2
      'z': '2', // z minúscula -> 2
      'B': '8', // B -> 8 (menos común pero posible)
      'G': '6', // G -> 6
      'g': '6', // g -> 6
    };
    
    let normalized = text;
    
    // Aplicar correcciones carácter por carácter
    normalized = normalized.split('').map(char => {
      // Si el carácter es una letra que puede confundirse con un dígito
      if (ocrCorrections[char]) {
        return ocrCorrections[char];
      }
      return char;
    }).join('');
    
    return normalized;
  }

  /**
   * Verificar si un número parece ser un año (2000-2099)
   */
  private looksLikeYear(bibNumber: string): boolean {
    if (!bibNumber || bibNumber.length !== 4) {
      return false;
    }
    const num = parseInt(bibNumber, 10);
    return (num >= 2020 && num <= 2030) || (num >= 2000 && num < 2100);
  }

  /**
   * 🔧 Validar número de dorsal combinado desde dígitos individuales
   * Versión más permisiva para números reconstruidos
   */
  private isValidBibNumberFromDigits(digits: string): boolean {
    if (!digits || digits.length < 2 || digits.length > 5) {
      return false;
    }
    
    const num = parseInt(digits, 10);
    
    // Para números de 2 dígitos, solo aceptar si es >= 10
    if (digits.length === 2) {
      return num >= 10 && num < 100;
    }
    
    // Para números de 3-5 dígitos, usar validación estándar
    if (digits.length >= 3 && digits.length <= 5) {
      // Filtrar años
      if (digits.length === 4 && num >= 2000 && num < 2100) {
        return false;
      }
      if (digits.length === 5 && num >= 20000 && num < 21000) {
        return false;
      }
      // Filtrar números muy pequeños
      if (num < 10) {
        return false;
      }
      return true;
    }
    
    return false;
  }

  /**
   * 🔢 Reconstruir dígitos incompletos usando contexto y priors de dominio
   * Implementa razonamiento probabilístico para completar números parciales
   */
  private reconstructIncompleteDigits(partialNumber: string, context?: string): string | null {
    if (!partialNumber || partialNumber.length < 2) {
      return null;
    }
    
    // Si ya tiene 3-5 dígitos, probablemente está completo
    if (partialNumber.length >= 3 && partialNumber.length <= 5) {
      return partialNumber;
    }
    
    // Si tiene 2 dígitos, intentar reconstruir basado en contexto
    if (partialNumber.length === 2) {
      const num = parseInt(partialNumber, 10);
      
      // Si el contexto contiene más dígitos cerca, intentar combinarlos
      if (context) {
        // Buscar dígitos adyacentes en el contexto
        const contextDigits = context.match(/\d/g) || [];
        if (contextDigits.length > 2) {
          // Intentar reconstruir combinando dígitos del contexto
          const combined = contextDigits.join('');
          if (combined.length >= 3 && combined.length <= 5) {
            const combinedNum = parseInt(combined, 10);
            if (combinedNum >= 10 && combinedNum < 50000 && !this.looksLikeYear(combined)) {
              return combined;
            }
          }
        }
      }
      
      // Si no hay contexto, retornar null (número demasiado corto)
      return null;
    }
    
    return partialNumber;
  }

  /**
   * Extract bib number from text
   * Prioritizes longer numbers (3-5 digits like "1523") over shorter ones
   * Mejorado para detectar números fragmentados y combinarlos con normalización OCR
   */
  private extractBibNumber(text: string): string | null {
    if (!text || text.trim().length === 0) {
      return null;
    }

    // 🔧 PASO 1: Normalizar errores comunes de OCR
    const normalizedText = this.normalizeOCRText(text);
    
    // 🔧 PASO 2: Intentar reconstruir números incompletos
    const reconstructedText = this.reconstructIncompleteDigits(normalizedText, text) || normalizedText;

    // Primero, intentar encontrar números de 5 dígitos (completos)
    const fiveDigitMatch = reconstructedText.match(/\d{5}/);
    if (fiveDigitMatch) {
      const num = parseInt(fiveDigitMatch[0], 10);
      // Filtrar años pero mantener otros números de 5 dígitos
      if (!(num >= 20000 && num < 21000)) {
        return fiveDigitMatch[0];
      }
    }

    // Segundo, intentar encontrar números de 4 dígitos (como "1523")
    const fourDigitMatch = reconstructedText.match(/\d{4}/);
    if (fourDigitMatch) {
      const num = parseInt(fourDigitMatch[0], 10);
      // Filtrar años (2000-2099) pero mantener otros números de 4 dígitos
      if (!(num >= 2000 && num < 2100)) {
        return fourDigitMatch[0];
      }
    }

      // Tercero, intentar combinar dígitos adyacentes del texto normalizado
      // Buscar patrones como "1 5 2 3" o "1-5-2-3" que deberían ser "1523"
      // También patrones más flexibles como "1  5 2 3" o "15 23"
      // IMPORTANTE: También buscar números de 2 dígitos si no hay nada más (fallback)
      const combinedPatterns = [
        /(\d)\s*[-\s.]?\s*(\d)\s*[-\s.]?\s*(\d)\s*[-\s.]?\s*(\d)\s*[-\s.]?\s*(\d)/,  // 5 dígitos con separadores
        /(\d)\s*[-\s.]?\s*(\d)\s*[-\s.]?\s*(\d)\s*[-\s.]?\s*(\d)/,                  // 4 dígitos con separadores
        /(\d)\s*[-\s.]?\s*(\d)\s*[-\s.]?\s*(\d)/,                                    // 3 dígitos con separadores
        /(\d{2})\s*[-\s.]?\s*(\d{2})\s*[-\s.]?\s*(\d)/,                              // "15 23" -> "1523"
        /(\d)\s*[-\s.]?\s*(\d{2})\s*[-\s.]?\s*(\d)/,                                 // "1 52 3" -> "1523"
        /(\d{2})\s*[-\s.]?\s*(\d)\s*[-\s.]?\s*(\d)/,                                 // "15 2 3" -> "1523"
        /(\d{2})\s*[-\s.]?\s*(\d{2})/,                                                // "15 23" -> "1523" (4 dígitos)
      ];
    
    for (const pattern of combinedPatterns) {
      const matches = reconstructedText.match(pattern);
      if (matches) {
        // Combinar todos los grupos capturados
        const combined = matches.slice(1).filter(m => m).join('');
        if (combined.length >= 3 && combined.length <= 5) {
          const num = parseInt(combined, 10);
          // Filtrar años
          if (!(combined.length === 4 && num >= 2000 && num < 2100)) {
            if (!(combined.length === 5 && num >= 20000 && num < 21000)) {
              return combined;
            }
          }
        }
      }
    }

    // Cuarto: Si el texto contiene múltiples secuencias de dígitos separadas,
    // intentar combinarlas si están cerca en el texto
    // Ejemplo: "1 5 2 3" separados -> "1523"
    const allDigits = reconstructedText.match(/\d/g);
    if (allDigits && allDigits.length >= 3 && allDigits.length <= 5) {
      const combined = allDigits.join('');
      const num = parseInt(combined, 10);
      // Solo usar si no parece ser un año y tiene longitud válida
      if (!(combined.length === 4 && num >= 2000 && num < 2100)) {
        if (!(combined.length === 5 && num >= 20000 && num < 21000)) {
          return combined;
        }
      }
    }

    // Quinto: Encontrar todas las secuencias y priorizar las más largas
    const sequences = reconstructedText.match(/\d{1,5}/g);
    if (!sequences || sequences.length === 0) {
      return null;
    }

    // Filtrar y ordenar secuencias
    const validSequences = sequences
      .filter(seq => {
        // Aceptar 2-5 dígitos (2 como fallback si no hay nada mejor)
        if (seq.length < 2 || seq.length > 5) return false;
        const num = parseInt(seq, 10);
        
        // Filtrar años
        if (seq.length === 4 && num >= 2000 && num < 2100) return false;
        if (seq.length === 5 && num >= 20000 && num < 21000) return false;
        
        // Filtrar números muy pequeños (pero permitir 10+)
        if (num < 10) return false;
        
        return true;
      })
      .sort((a, b) => {
        // Primero: preferir secuencias más largas (5 > 4 > 3 > 2)
        if (a.length !== b.length) {
          return b.length - a.length;
        }
        // Segundo: si misma longitud, preferir la que aparece primero
        return reconstructedText.indexOf(a) - reconstructedText.indexOf(b);
      });

    // Si encontramos secuencias válidas, retornar la más larga
    if (validSequences.length > 0) {
      const best = validSequences[0];
      // Solo retornar si tiene al menos 2 dígitos (como mínimo)
      // Preferir 3+ dígitos si están disponibles
      const threePlus = validSequences.filter(s => s.length >= 3);
      if (threePlus.length > 0) {
        return threePlus[0];
      }
      // Fallback: retornar de 2 dígitos si no hay nada mejor
      return best;
    }

    return null;
  }

  /**
   * Extract ALL bib numbers from full image text (for multi-bib detection)
   * Prioritizes longer numbers (3-4 digits) and combines adjacent digits
   */
  async extractAllBibNumbersFromText(imageBuffer: Buffer): Promise<string[]> {
    const allNumbers: Set<string> = new Set();

    try {
      // Try Google Vision first (more accurate)
      if (this.googleVisionService?.isEnabled()) {
        const visionNumbers = await this.googleVisionService.extractAllBibNumbers(imageBuffer);
        visionNumbers.forEach(num => allNumbers.add(num));
        this.logger.log(`Google Vision found ${visionNumbers.length} bib numbers: ${visionNumbers.join(', ')}`);
      }

      // Also try Tesseract on enhanced image with multiple strategies
      const worker = await this.initializeWorker();
      
      // Try multiple enhancement strategies to catch the full number
      const enhancementStrategies = [
        { contrast: 2.5, brightness: 1.2, sharpen: true, normalize: true, grayscale: true },
        { contrast: 3.0, brightness: 1.0, sharpen: true, normalize: true, grayscale: true },
        { contrast: 2.0, brightness: 1.5, sharpen: true, normalize: true, grayscale: true },
      ];

      for (const strategy of enhancementStrategies) {
        try {
          const enhancedImage = await this.imageEnhancementService.enhanceImage(imageBuffer, strategy);
          const { data: { text } } = await worker.recognize(enhancedImage);
          
          // Extract all numbers, prioritizing longer ones
          const numbers = this.extractAllNumbersFromText(text);
          numbers.forEach(num => allNumbers.add(num));
        } catch (error) {
          // Continue with next strategy
        }
      }

      // Prioritize longer numbers (4 digits > 3 digits > 2 digits > 1 digit)
      const uniqueNumbers = Array.from(allNumbers).sort((a, b) => {
        // First: prefer longer numbers
        if (a.length !== b.length) {
          return b.length - a.length; // Descending by length
        }
        // Second: if same length, sort numerically
        return parseInt(a, 10) - parseInt(b, 10);
      });

      this.logger.log(`Total unique bib numbers found: ${uniqueNumbers.join(', ')}`);
      
      return uniqueNumbers;
    } catch (error) {
      this.logger.error(`Error extracting all bib numbers: ${error.message}`);
      return Array.from(allNumbers);
    }
  }

  /**
   * Extract all numbers from text, prioritizing longer sequences (3-5 digits)
   * Mejorado para detectar y combinar números fragmentados
   */
  private extractAllNumbersFromText(text: string): string[] {
    const numbers: Set<string> = new Set();
    
    // 🔧 MEJORA: Ser más estricto con números de 5 dígitos
    // La mayoría de dorsales son 3-4 dígitos, números de 5 dígitos son raros y a menudo falsos positivos
    const fiveDigitSequences = text.match(/\d{5}/g) || [];
    fiveDigitSequences.forEach(seq => {
      const num = parseInt(seq, 10);
      // Filtrar años
      if (num >= 20000 && num < 21000) {
        return;
      }
      // Filtrar números muy grandes (probablemente combinación de múltiples números)
      if (num > 50000) {
        return;
      }
      // Filtrar si empieza con 0 (probablemente error de OCR)
      if (seq.startsWith('0')) {
        return;
      }
      // Filtrar patrones repetitivos (como 44484, 15231)
      const digits = seq.split('');
      const uniqueDigits = new Set(digits);
      if (uniqueDigits.size < 3) {
        return;
      }
      numbers.add(seq);
    });
    
    // Segundo, encontrar todos los números de 4 dígitos (como "1523", "2107", "3222")
    const fourDigitSequences = text.match(/\d{4}/g) || [];
    fourDigitSequences.forEach(seq => {
      const num = parseInt(seq, 10);
      // 🔧 MEJORA: Filtrar años (2000-2099) pero mantener otros números de 4 dígitos
      // Números como 2107, 3222 son válidos (no son años)
      if (!(num >= 2000 && num < 2100)) {
        numbers.add(seq);
      }
    });
    
    // 🔧 MEJORA: También buscar números de 4 dígitos que pueden estar separados por espacios
    // Ejemplo: "2 1 0 7" o "21 07" deberían detectarse como "2107"
    const spacedFourDigitPatterns = [
      /(\d)\s+(\d)\s+(\d)\s+(\d)/g,  // "2 1 0 7"
      /(\d{2})\s+(\d{2})/g,          // "21 07"
      /(\d)\s+(\d{3})/g,             // "2 107"
      /(\d{3})\s+(\d)/g,             // "210 7"
    ];
    
    for (const pattern of spacedFourDigitPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const combined = match.slice(1).filter(m => m).join('');
        if (combined.length === 4) {
          const num = parseInt(combined, 10);
          // Solo agregar si no es un año
          if (!(num >= 2000 && num < 2100)) {
            numbers.add(combined);
          }
        }
      }
    }
    
    // Tercero, intentar combinar dígitos adyacentes (para casos donde OCR lee "1 5 2 3" separadamente)
    const combinedPatterns = [
      /(\d)\s*[-\s.]?\s*(\d)\s*[-\s.]?\s*(\d)\s*[-\s.]?\s*(\d)\s*[-\s.]?\s*(\d)/g,  // 5 dígitos con separadores
      /(\d)\s*[-\s.]?\s*(\d)\s*[-\s.]?\s*(\d)\s*[-\s.]?\s*(\d)/g,                  // 4 dígitos con separadores
      /(\d)\s*[-\s.]?\s*(\d)\s*[-\s.]?\s*(\d)/g,                                    // 3 dígitos con separadores
      /(\d{2})\s*[-\s.]?\s*(\d{2})\s*[-\s.]?\s*(\d)/g,                              // "15 23" -> "1523"
      /(\d)\s*[-\s.]?\s*(\d{2})\s*[-\s.]?\s*(\d)/g,                                 // "1 52 3" -> "1523"
      /(\d{2})\s*[-\s.]?\s*(\d)\s*[-\s.]?\s*(\d)/g,                                 // "15 2 3" -> "1523"
    ];
    
    for (const pattern of combinedPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const combined = match.slice(1).filter(m => m).join('');
        if (combined.length >= 3 && combined.length <= 5) {
          const num = parseInt(combined, 10);
          // Filtrar años
          if (!(combined.length === 4 && num >= 2000 && num < 2100)) {
            if (!(combined.length === 5 && num >= 20000 && num < 21000)) {
              numbers.add(combined);
            }
          }
        }
      }
    }
    
    // Cuarto: Intentar combinar todos los dígitos sueltos si están cerca
    const allDigits = text.match(/\d/g);
    if (allDigits && allDigits.length >= 3 && allDigits.length <= 5) {
      const combined = allDigits.join('');
      const num = parseInt(combined, 10);
      if (!(combined.length === 4 && num >= 2000 && num < 2100)) {
        if (!(combined.length === 5 && num >= 20000 && num < 21000)) {
          numbers.add(combined);
        }
      }
    }
    
    // Quinto: Secuencias de 3 dígitos
    const threeDigitSequences = text.match(/\d{3}/g) || [];
    threeDigitSequences.forEach(seq => {
      // Solo agregar si no tenemos números más largos que lo contengan
      const num = parseInt(seq, 10);
      if (num >= 10) { // Filtrar números muy pequeños
        numbers.add(seq);
      }
    });
    
    // Filtrar números de 2 dígitos que podrían ser fragmentos (solo si no hay números más largos)
    if (numbers.size === 0 || Array.from(numbers).every(n => n.length < 3)) {
      const twoDigitSequences = text.match(/\d{2}/g) || [];
      twoDigitSequences.forEach(seq => {
        const num = parseInt(seq, 10);
        if (num >= 10) {
          numbers.add(seq);
        }
      });
    }
    
    // Filtrar y ordenar por longitud (más largos primero)
    return Array.from(numbers)
      .filter(n => n.length >= 2) // Mínimo 2 dígitos
      .sort((a, b) => {
        if (a.length !== b.length) {
          return b.length - a.length; // Más largos primero
        }
        return parseInt(a, 10) - parseInt(b, 10); // Luego numéricamente
      });
  }

  /**
   * Generate alternative bib numbers for low confidence results
   */
  private generateAlternatives(bibNumber: string): string[] {
    const alternatives: string[] = [];
    const digits = bibNumber.split('');

    // Try single digit variations
    for (let i = 0; i < digits.length; i++) {
      for (let digit = 0; digit <= 9; digit++) {
        if (digits[i] !== digit.toString()) {
          const alt = [...digits];
          alt[i] = digit.toString();
          alternatives.push(alt.join(''));
        }
      }
    }

    return alternatives.slice(0, 5); // Return top 5 alternatives
  }

  /**
   * Terminate worker (cleanup)
   */
  async terminateWorker(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
      this.logger.log('Tesseract OCR worker terminated');
    }
  }
}
