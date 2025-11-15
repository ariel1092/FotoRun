import { Injectable, Logger } from '@nestjs/common';
import { RoboflowService, RoboflowDetection } from '../roboflow/roboflow.service';
import { ImageProcessingService } from '../image-processing/image-processing.service';
import { ImageEnhancementService } from '../image-processing/image-enhancement.service';
import { BibOCRService, BibOCRResult } from '../ocr/bib-ocr.service';

export interface EnhancedDetection {
  bibNumber: string;
  confidence: number;
  detectionConfidence: number; // Roboflow confidence
  ocrConfidence: number; // OCR confidence
  x: number;
  y: number;
  width: number;
  height: number;
  ocrResult?: BibOCRResult;
  metadata: {
    class_id: number;
    detection_id: string;
    method: 'robofow_only' | 'ocr_verified' | 'ocr_corrected';
  };
}

export interface DetectionOptions {
  minDetectionConfidence?: number;
  minOCRConfidence?: number;
  useOCR?: boolean;
  enhanceImage?: boolean;
  ocrFallback?: boolean; // Use OCR if Roboflow confidence is low
}

@Injectable()
export class BibDetectionService {
  private readonly logger = new Logger(BibDetectionService.name);
  private readonly defaultOptions: DetectionOptions = {
    minDetectionConfidence: 0.3,
    minOCRConfidence: 0.3,
    useOCR: true,
    enhanceImage: true,
    ocrFallback: true,
  };

  constructor(
    private readonly roboflowService: RoboflowService,
    private readonly imageProcessingService: ImageProcessingService,
    private readonly imageEnhancementService: ImageEnhancementService,
    private readonly bibOCRService: BibOCRService,
  ) {}

  /**
   * Detect bib numbers in image with enhanced processing
   */
  async detectBibNumbers(
    imageBuffer: Buffer,
    options: DetectionOptions = {},
  ): Promise<EnhancedDetection[]> {
    const opts = { ...this.defaultOptions, ...options };

    try {
      // Enhance image for better detection
      let processedImage = imageBuffer;
      if (opts.enhanceImage) {
        processedImage = await this.imageEnhancementService.enhanceImageForDetection(
          imageBuffer,
        );
      }

      // Convert to base64 for Roboflow
      const imageBase64 = processedImage.toString('base64');

      // Detect bib regions using Roboflow
      const roboflowResult = await this.roboflowService.detectBibsFromBase64(
        imageBase64,
      );

      // Use lower confidence threshold to catch more potential detections
      // We'll let OCR verify/correct them later
      const minConfidence = opts.minDetectionConfidence || 0.3; // Lower threshold
      const validDetections = this.roboflowService.filterByConfidence(
        roboflowResult.predictions,
        minConfidence,
      );

      this.logger.log(
        `Found ${validDetections.length} valid detections (from ${roboflowResult.predictions.length} total) with confidence >= ${minConfidence}`,
      );

      // Process each detection
      const enhancedDetections: EnhancedDetection[] = [];

      for (const detection of validDetections) {
        try {
          const enhanced = await this.processDetection(
            imageBuffer,
            detection,
            opts,
          );

          if (enhanced) {
            enhancedDetections.push(enhanced);
          }
        } catch (error) {
          this.logger.warn(
            `Error processing detection ${detection.detection_id}: ${error.message}`,
          );
          // Continue with next detection
        }
      }

      // ALWAYS try comprehensive OCR scan to find ALL bib numbers
      // This is especially important when Roboflow misses detections or finds invalid ones
      const allDetectionsAreShortOrInvalid = enhancedDetections.length > 0 && 
        enhancedDetections.every(det => 
          det.bibNumber.length < 3 || 
          !this.isValidBibNumber(det.bibNumber) ||
          this.looksLikeYear(det.bibNumber)
        );
      
      // Verificar si hay detecciones que parecen parciales (menos de 3 dígitos)
      const hasPartialDetections = enhancedDetections.some(det => 
        det.bibNumber.length < 3 || 
        (det.confidence < 0.6 && det.ocrConfidence < 0.6)
      );
      
      // 🔧 CRÍTICO: Priorizar SOLO las regiones detectadas por Roboflow
      // NO hacer escaneo completo de OCR si Roboflow detectó algo - esto genera falsos positivos
      // El problema: el OCR completo escanea toda la imagen y encuentra números que no son dorsales
      // Solución: solo usar OCR en las regiones específicas donde Roboflow detectó algo
      const hasGoodRoboflowDetection = enhancedDetections.some(det => 
        det.bibNumber.length >= 3 && 
        det.confidence >= 0.5 && 
        this.isValidBibNumber(det.bibNumber)
      );
      
      // 🔧 CAMBIO CRÍTICO: SOLO hacer escaneo completo si:
      // 1. NO hay NINGUNA detección de Roboflow (0 detecciones)
      // Esto evita falsos positivos del OCR completo cuando Roboflow ya detectó algo
      // Ejemplo: Roboflow detecta 2 dorsales → NO hacer OCR completo → evita detectar 5 números falsos
      const shouldScanComprehensively = enhancedDetections.length === 0;
      
      if (shouldScanComprehensively && opts.useOCR) {
        const reason = enhancedDetections.length === 0 
          ? 'No Roboflow detections found'
          : allDetectionsAreShortOrInvalid
          ? 'All detections are short (1-2 digits), invalid, or look like years'
          : `No good Roboflow detections found, attempting limited OCR scan...`;
        this.logger.log(`${reason}`);
        
        try {
          // 🔧 CRÍTICO: Usar Google Vision si está disponible (más preciso)
          // Si no, usar Tesseract pero solo en regiones específicas
          let ocrDetections: EnhancedDetection[] = [];
          
          if (this.bibOCRService.isGoogleVisionEnabled()) {
            this.logger.log('🔍 Usando Google Vision para escaneo completo (más preciso)...');
            // Google Vision es más preciso, usarlo primero
            const visionResult = await this.scanImageWithGoogleVision(imageBuffer, opts);
            if (visionResult && visionResult.length > 0) {
              ocrDetections = visionResult;
              this.logger.log(`✅ Google Vision encontró ${ocrDetections.length} dorsales: ${ocrDetections.map(d => d.bibNumber).join(', ')}`);
            }
          }
          
          // Si Google Vision no está disponible o no encontró nada, usar Tesseract
          if (ocrDetections.length === 0) {
            ocrDetections = await this.scanImageWithOCR(imageBuffer, opts);
          }
          
          if (ocrDetections.length > 0) {
            // 🔧 FILTRADO MUY ESTRICTO: Solo agregar números que:
            // 1. Están en la región del torso (20-65% de altura)
            // 2. Tienen confianza alta (> 0.7)
            // 3. Son válidos según priors de dominio
            // 4. NO están ya detectados por Roboflow
            const validOCRDetections = ocrDetections.filter(ocrDet => {
              // Validación básica
              if (!this.isValidBibNumber(ocrDet.bibNumber) || this.looksLikeYear(ocrDet.bibNumber)) {
                return false;
              }
              
              // 🔧 CRÍTICO: Solo aceptar números con confianza MUY alta del OCR completo
              // El OCR completo es propenso a falsos positivos, así que ser muy estricto
              const minConfidence = 0.75; // Requerir 75% de confianza mínimo
              
              if (ocrDet.confidence < minConfidence) {
                return false;
              }
              
              // Verificar que no esté ya detectado
              if (enhancedDetections.some(existing => existing.bibNumber === ocrDet.bibNumber)) {
                return false;
              }
              
              // Priorizar números de 3-4 dígitos
              if (ocrDet.bibNumber.length < 3 || ocrDet.bibNumber.length > 4) {
                return false;
              }
              
              return true;
            });
            
            // 🔧 MEJORA: Merge MUY restrictivo - solo agregar si realmente es válido
            // Limitar a máximo 2 detecciones adicionales del OCR completo
            const maxAdditionalDetections = 2;
            let addedCount = 0;
            
            for (const ocrDet of validOCRDetections) {
              if (addedCount >= maxAdditionalDetections) {
                break; // Ya agregamos suficientes
              }
              
              // Check if we already have this exact bib number
              const existingIndex = enhancedDetections.findIndex(existing => 
                existing.bibNumber === ocrDet.bibNumber
              );
              
              if (existingIndex >= 0) {
                // Ya existe - solo reemplazar si el OCR tiene MUCHA mayor confianza
                if (ocrDet.confidence > enhancedDetections[existingIndex].confidence + 0.15) {
                  enhancedDetections[existingIndex] = ocrDet;
                  this.logger.log(
                    `Reemplazando detección existente "${ocrDet.bibNumber}" con versión de mayor confianza del OCR (${ocrDet.confidence.toFixed(2)} vs ${enhancedDetections[existingIndex].confidence.toFixed(2)})`,
                  );
                }
              } else {
                // Solo agregar si es un número de 4 dígitos con alta confianza
                // Esto evita agregar falsos positivos
                if (ocrDet.bibNumber.length === 4 && ocrDet.confidence >= 0.8) {
                  enhancedDetections.push(ocrDet);
                  addedCount++;
                  this.logger.log(
                    `✅ Agregando detección del OCR completo: "${ocrDet.bibNumber}" (confianza: ${ocrDet.confidence.toFixed(2)})`,
                  );
                } else if (ocrDet.bibNumber.length === 3 && ocrDet.confidence >= 0.85) {
                  // Para 3 dígitos, requerir confianza aún mayor
                  enhancedDetections.push(ocrDet);
                  addedCount++;
                  this.logger.log(
                    `✅ Agregando detección del OCR completo: "${ocrDet.bibNumber}" (confianza: ${ocrDet.confidence.toFixed(2)})`,
                  );
                }
              }
            }
            
            this.logger.log(
              `Comprehensive OCR scan found ${ocrDetections.length} candidates, ${validOCRDetections.length} valid after filtering. Total after merge: ${enhancedDetections.length}`,
            );
          }
        } catch (error) {
          this.logger.warn(`Error in comprehensive OCR scan: ${error.message}`);
        }
      } else if (hasGoodRoboflowDetection) {
        this.logger.log(
          `Skipping comprehensive OCR scan - good Roboflow detection found (${enhancedDetections.length} detections)`,
        );
      }

      // Remove duplicates (same bib number detected multiple times)
      const uniqueDetections = this.deduplicateDetections(enhancedDetections);

      // 🔬 CORRECCIÓN PROBABILÍSTICA FINAL: Validar y corregir resultados antes de retornar
      const correctedDetections = await this.applyProbabilisticCorrection(uniqueDetections);

      this.logger.log(
        `Processed ${correctedDetections.length} unique bib numbers: ${correctedDetections.map(d => d.bibNumber).join(', ')}`,
      );

      return correctedDetections;
    } catch (error) {
      this.logger.error(`Error detecting bib numbers: ${error.message}`);
      throw error;
    }
  }

  /**
   * Process a single detection with advanced bounding box refinement
   * Aplica refinamiento geométrico inteligente y multi-crop OCR según filosofía híbrida
   */
  private async processDetection(
    imageBuffer: Buffer,
    detection: RoboflowDetection,
    options: DetectionOptions,
  ): Promise<EnhancedDetection | null> {
    // Get image dimensions
    const { width: imageWidth, height: imageHeight } =
      await this.imageProcessingService.getImageDimensions(imageBuffer);

    // 🔍 ANÁLISIS GEOMÉTRICO: Refinar bounding box basado en aspect ratio y tamaño
    const aspectRatio = detection.width / detection.height;
    const area = detection.width * detection.height;
    const isLikelyHorizontal = aspectRatio > 1.5; // Dorsales suelen ser horizontales
    
    // 🔧 MEJORA: Filtrar detecciones que NO están en la región del torso
    // Esto elimina falsos positivos en cielo, suelo, o extremidades
    if (!this.isInTorsoRegion(detection.y, detection.height, imageHeight)) {
      this.logger.debug(
        `Detección filtrada: fuera de región del torso (y: ${detection.y.toFixed(0)}, altura imagen: ${imageHeight})`,
      );
      return null; // Descartar detección fuera del torso
    }
    
    // SOLUCIÓN 1: Expansión adaptativa aumentada a 220-250% para evitar cortes
    // Más expansión horizontal para dorsales largos (4-5 dígitos)
    const horizontalExpansion = isLikelyHorizontal ? 220 : 200; // 220% para horizontales, 200% para verticales
    const verticalExpansion = 200; // 200% vertical (aumentado de 150%)
    
    // Expand bounding box con expansión adaptativa
    const expanded = this.refineBoundingBox(
      detection.x,
      detection.y,
      detection.width,
      detection.height,
      imageWidth,
      imageHeight,
      horizontalExpansion,
      verticalExpansion,
    );
    
    // Si refineBoundingBox retorna null (fuera de límites), descartar
    if (!expanded) {
      this.logger.debug('Bounding box refinado está fuera de límites, descartando detección');
      return null;
    }

    this.logger.debug(
      `Original bbox: (${detection.x.toFixed(0)}, ${detection.y.toFixed(0)}, ${detection.width.toFixed(0)}x${detection.height.toFixed(0)}, aspect: ${aspectRatio.toFixed(2)}) -> ` +
      `Refined bbox: (${expanded.x.toFixed(0)}, ${expanded.y.toFixed(0)}, ${expanded.width.toFixed(0)}x${expanded.height.toFixed(0)})`
    );

    // 🎯 MULTI-CROP OCR: Extraer múltiples regiones para OCR redundante
    const multiCropRegions = await this.extractMultiCropRegions(
      imageBuffer,
      expanded,
      imageWidth,
      imageHeight,
    );

    // Extract bib number from Roboflow detection class (might be text or number)
    let bibNumber = this.extractBibNumberFromRoboflowClass(detection.class);
    let ocrResult: BibOCRResult | null = null;
    let method: 'robofow_only' | 'ocr_verified' | 'ocr_corrected' = 'robofow_only';
    const roboflowBibNumberValid = this.isValidBibNumber(bibNumber);

    // 🧠 OCR MULTIMODAL: Usar multi-crop para reconocimiento redundante
    if (options.useOCR) {
      // Estrategia 1: OCR en región principal expandida
      const mainRegion = await this.imageProcessingService.extractRegion(
        imageBuffer,
        expanded.x,
        expanded.y,
        expanded.width,
        expanded.height,
      );
      
      // Estrategia 2: Multi-crop OCR para robustez con reconstrucción multimodal
      // SOLUCIÓN 4: Obtener resultados separados de Tesseract y Google Vision para fusionar
      const multiCropResults = await Promise.all(
        multiCropRegions.map(async (region) => {
          try {
            // Obtener resultado de Tesseract
            const tesseractResult = await this.bibOCRService.readBibNumberTesseractOnly(region.buffer);
            
            // Obtener resultado de Google Vision (si está disponible)
            let visionResult: BibOCRResult | null = null;
            if (this.bibOCRService.isGoogleVisionEnabled()) {
              visionResult = await this.bibOCRService.readBibNumberGoogleVisionOnly(region.buffer);
            }
            
            // SOLUCIÓN 4: Reconstruir secuencia multimodal fusionando ambos resultados
            if (tesseractResult || visionResult) {
              return this.reconstructMultimodalSequence(tesseractResult, visionResult);
            }
            
            return null;
          } catch (error) {
            this.logger.debug(`Error in multi-crop OCR: ${error.message}`);
            return null;
          }
        })
      );
      
      // Fusionar resultados de multi-crop (voting/consensus)
      const validOCRResults = multiCropResults.filter(r => r && r.bibNumber) as BibOCRResult[];
      
      if (validOCRResults.length > 0) {
        // Usar el resultado más frecuente o de mayor confianza
        ocrResult = this.consolidateMultiCropResults(validOCRResults, mainRegion.buffer);
      } else {
        // Fallback: OCR estándar en región principal con reconstrucción multimodal
        const tesseractMain = await this.bibOCRService.readBibNumberTesseractOnly(mainRegion.buffer);
        let visionMain: BibOCRResult | null = null;
        if (this.bibOCRService.isGoogleVisionEnabled()) {
          visionMain = await this.bibOCRService.readBibNumberGoogleVisionOnly(mainRegion.buffer);
        }
        ocrResult = this.reconstructMultimodalSequence(tesseractMain, visionMain) || 
                   await this.bibOCRService.readBibNumber(mainRegion.buffer);
      }

      if (ocrResult && ocrResult.bibNumber) {
        const minOCRConfidence = options.minOCRConfidence || 0.5;
        
        // 🔧 CRÍTICO: Si el OCR detectó un número corto (1-2 dígitos) pero Roboflow detectó algo,
        // intentar OCR más agresivo con múltiples estrategias para encontrar el número completo
        if (ocrResult.bibNumber.length <= 2 && ocrResult.confidence < 0.7) {
          this.logger.log(
            `⚠️ OCR detectó número corto "${ocrResult.bibNumber}" con baja confianza (${ocrResult.confidence.toFixed(2)}). Intentando OCR mejorado...`,
          );
          
          // Intentar OCR mejorado con múltiples estrategias de preprocesamiento
          const improvedOCR = await this.tryImprovedOCR(mainRegion.buffer, multiCropRegions);
          if (improvedOCR && improvedOCR.bibNumber.length >= 3) {
            this.logger.log(
              `✅ OCR mejorado encontró número completo: "${improvedOCR.bibNumber}" (confianza: ${improvedOCR.confidence.toFixed(2)})`,
            );
            ocrResult = improvedOCR;
          }
        }
        
        // 🧠 DESAMBIGUACIÓN MULTIMODAL: Usar contexto visual y textual para validar
        // 🔧 MEJORA: Solo desambiguar si el OCR result es corto (2 dígitos) o si Roboflow es más largo
        // NO desambiguar si el OCR ya tiene 4 dígitos y Roboflow tiene 2 dígitos
        const shouldDisambiguate = 
          ocrResult.bibNumber.length <= 2 || // OCR es corto, puede necesitar desambiguación
          (bibNumber.length > ocrResult.bibNumber.length && bibNumber.length >= 3); // Roboflow es más largo y válido
        
        if (shouldDisambiguate) {
          const disambiguatedResult = await this.disambiguateWithContext(
            ocrResult,
            bibNumber,
            detection,
            imageBuffer,
            expanded,
          );
          
          if (disambiguatedResult) {
            // 🔧 MEJORA: Solo usar resultado desambiguado si es mejor (más largo o mayor confianza)
            // NO cambiar de 4 dígitos a 2 dígitos
            if (disambiguatedResult.bibNumber.length >= ocrResult.bibNumber.length ||
                (disambiguatedResult.bibNumber.length === ocrResult.bibNumber.length && 
                 disambiguatedResult.confidence > ocrResult.confidence + 0.1)) {
              ocrResult = disambiguatedResult;
            } else {
              this.logger.log(
                `Desambiguación multimodal rechazada: manteniendo "${ocrResult.bibNumber}" (${ocrResult.bibNumber.length} dígitos) sobre "${disambiguatedResult.bibNumber}" (${disambiguatedResult.bibNumber.length} dígitos)`,
              );
            }
          }
        } else {
          this.logger.log(
            `Desambiguación multimodal omitida: OCR tiene ${ocrResult.bibNumber.length} dígitos, Roboflow tiene ${bibNumber.length} dígitos`,
          );
        }
        
        // If Roboflow didn't give us a valid bib number, always use OCR
        if (!roboflowBibNumberValid) {
          if (this.isValidBibNumber(ocrResult.bibNumber)) {
            bibNumber = ocrResult.bibNumber;
            method = 'ocr_corrected';
            this.logger.log(
              `Roboflow class "${detection.class}" invalid, using OCR result: ${bibNumber} (OCR conf: ${ocrResult.confidence.toFixed(2)})`,
            );
          }
        }
        // If OCR confidence is high enough, prefer OCR result over Roboflow
        else if (ocrResult.confidence >= minOCRConfidence) {
          if (ocrResult.bibNumber !== bibNumber) {
            // 🔧 MEJORA: Priorizar números más largos del OCR sobre números cortos de Roboflow
            // OCR found different number - prefer OCR especially if it's longer (more complete)
            const ocrIsLonger = ocrResult.bibNumber.length > bibNumber.length;
            const ocrIs4Digits = ocrResult.bibNumber.length === 4;
            const roboflowIs2Digits = bibNumber.length === 2;
            const ocrIs3Or4Digits = ocrResult.bibNumber.length >= 3;
            
            // Priorizar OCR si:
            // 1. Es más largo
            // 2. Es de 4 dígitos (más común en carreras)
            // 3. OCR es 3-4 dígitos y Roboflow es 2 dígitos (Roboflow probablemente detectó fragmento)
            // 4. OCR tiene confianza significativamente mayor
            if (ocrIsLonger || ocrIs4Digits || (ocrIs3Or4Digits && roboflowIs2Digits) || 
                ocrResult.confidence > detection.confidence * 1.2) {
              method = 'ocr_corrected';
              bibNumber = ocrResult.bibNumber;
              this.logger.log(
                `OCR corrected bib number: "${detection.class}" (${bibNumber}) -> ${ocrResult.bibNumber} ` +
                `(OCR conf: ${ocrResult.confidence.toFixed(2)}, Roboflow conf: ${detection.confidence.toFixed(2)})`,
              );
            } else {
              // OCR verified Roboflow result
              method = 'ocr_verified';
            }
          } else {
            // OCR verified Roboflow result - both agree
            method = 'ocr_verified';
          }
        } else if (detection.confidence < 0.5 || !roboflowBibNumberValid) {
          // Low confidence from Roboflow or invalid class, try OCR even if OCR confidence is low
          if (ocrResult.alternatives && ocrResult.alternatives.length > 0) {
            const validAlt = ocrResult.alternatives.find(alt => this.isValidBibNumber(alt));
            if (validAlt) {
              bibNumber = validAlt;
              method = 'ocr_corrected';
              this.logger.log(
                `Using OCR alternative: ${detection.class} -> ${bibNumber}`,
              );
            }
          } else if (this.isValidBibNumber(ocrResult.bibNumber)) {
            // Use OCR result even if confidence is low, if Roboflow is unreliable
            bibNumber = ocrResult.bibNumber;
            method = 'ocr_corrected';
            this.logger.log(
              `Using OCR result (Roboflow unreliable): ${detection.class} -> ${bibNumber} (OCR conf: ${ocrResult.confidence.toFixed(2)})`,
            );
          }
        }
      } else {
        // OCR failed - if Roboflow gave invalid class, we can't use it
        if (!roboflowBibNumberValid) {
          this.logger.warn(
            `Roboflow class "${detection.class}" invalid and OCR failed to read bib number (conf: ${detection.confidence.toFixed(2)})`,
          );
          return null; // Can't use this detection
        }
      }
    } else if (!roboflowBibNumberValid) {
      // OCR disabled and Roboflow gave invalid class
      this.logger.warn(`Roboflow class "${detection.class}" invalid and OCR disabled, skipping detection`);
      return null;
    }

    // Validate bib number
    if (!this.isValidBibNumber(bibNumber)) {
      this.logger.warn(`Invalid bib number detected: "${bibNumber}"`);
      return null;
    }

    // Calculate combined confidence
    const combinedConfidence = this.calculateCombinedConfidence(
      detection.confidence,
      ocrResult?.confidence || 0,
      method,
    );

    return {
      bibNumber,
      confidence: combinedConfidence,
      detectionConfidence: detection.confidence,
      ocrConfidence: ocrResult?.confidence || 0,
      x: detection.x,
      y: detection.y,
      width: detection.width,
      height: detection.height,
      ocrResult: ocrResult || undefined,
      metadata: {
        class_id: detection.class_id,
        detection_id: detection.detection_id,
        method,
      },
    };
  }

  /**
   * Extract bib number from Roboflow class (might be text like "bib number labeling..." or a number)
   * Prioritizes longer sequences (3-4 digits) as complete bib numbers
   * Filters out years and metadata
   */
  private extractBibNumberFromRoboflowClass(roboflowClass: string): string {
    // If it's already a valid bib number, use it
    if (this.isValidBibNumber(roboflowClass)) {
      return roboflowClass;
    }

    // Try to extract numbers from the class name
    // Look for isolated 1-4 digit sequences (most likely to be bib numbers)
    const sequences = roboflowClass.match(/\b\d{1,4}\b/g);
    if (sequences && sequences.length > 0) {
      // Filter out years and prioritize valid bib numbers
      const validSequences = sequences.filter(seq => !this.looksLikeYear(seq) && this.isValidBibNumber(seq));
      
      if (validSequences.length > 0) {
        // Prioritize longer sequences (3-4 digits) as they're more likely to be complete bib numbers
        const sorted = validSequences.sort((a, b) => {
          // First priority: prefer longer sequences (3-4 digits) over shorter ones (1-2 digits)
          if (a.length >= 3 && b.length < 3) return -1;
          if (a.length < 3 && b.length >= 3) return 1;
          
          // Second priority: if same length category, prefer longer within category
          if (a.length !== b.length) {
            return b.length - a.length;
          }
          
          return 0;
        });
        return sorted[0];
      }
      
      // If all sequences were filtered out, return the longest non-year sequence anyway
      const nonYears = sequences.filter(seq => !this.looksLikeYear(seq));
      if (nonYears.length > 0) {
        return nonYears.sort((a, b) => b.length - a.length)[0];
      }
    }

    // If no isolated numbers found, try to extract any 1-4 digit sequence
    const allMatches = roboflowClass.match(/\d{1,4}/g);
    if (allMatches && allMatches.length > 0) {
      const validMatches = allMatches.filter(m => !this.looksLikeYear(m));
      if (validMatches.length > 0) {
        const sorted = validMatches.sort((a, b) => {
          if (a.length >= 3 && b.length < 3) return -1;
          if (a.length < 3 && b.length >= 3) return 1;
          return b.length - a.length;
        });
        return sorted[0];
      }
    }
    
    return roboflowClass;
  }

  /**
   * Check if a number looks like a year (2020-2030 or 2000-2099)
   */
  private looksLikeYear(bibNumber: string): boolean {
    if (!bibNumber || bibNumber.length !== 4) {
      return false;
    }
    const num = parseInt(bibNumber, 10);
    // Years 2020-2030 are common in metadata
    // Also filter 2000-2099 range as these are likely years, not bib numbers
    return (num >= 2020 && num <= 2030) || (num >= 2000 && num < 2100);
  }

  /**
   * ✅ SANITY CHECKS ROBUSTOS: Validar formato de dorsal con priors de dominio
   * Aplica múltiples capas de validación basadas en conocimiento del dominio
   */
  private isValidBibNumber(bibNumber: string): boolean {
    // Validación básica: debe ser string no vacío
    if (!bibNumber || typeof bibNumber !== 'string') {
      return false;
    }
    
    // Limpiar y normalizar
    const cleaned = bibNumber.trim().replace(/\s+/g, '').replace(/[^\d]/g, '');
    
    // ✅ PRIOR 1: Longitud válida (2-5 dígitos, pero preferir 3-4)
    // Dorsales típicamente tienen 3-4 dígitos, raramente 2 o 5+
    if (!/^\d{2,5}$/.test(cleaned)) {
      return false;
    }
    
    const num = parseInt(cleaned, 10);
    
    // 🔧 MEJORA: Ser más estricto con números de 5 dígitos
    // La mayoría de dorsales son 3-4 dígitos, números de 5 dígitos son raros
    if (cleaned.length === 5) {
      // Rechazar si es muy grande (probablemente combinación de múltiples números)
      if (num > 50000) {
        return false;
      }
      // Rechazar si empieza con 0 (probablemente error de OCR)
      if (cleaned.startsWith('0')) {
        return false;
      }
      // Rechazar si tiene patrones repetitivos (como 44484, 15231)
      const digits = cleaned.split('');
      const uniqueDigits = new Set(digits);
      // Si tiene menos de 3 dígitos únicos, probablemente es un error
      if (uniqueDigits.size < 3) {
        return false;
      }
    }
    
    // ✅ PRIOR 2: Filtrar años (2020-2030 y 2000-2099)
    // Los años son metadata común, no dorsales
    if (num >= 2020 && num <= 2030) {
      return false;
    }
    if (cleaned.length === 4 && num >= 2000 && num < 2100) {
      return false;
    }
    if (cleaned.length === 5 && num >= 20000 && num < 21000) {
      return false;
    }
    
    // ✅ PRIOR 3: Rango razonable (< 5000 para 4 dígitos, < 50000 para 5)
    // Dorsales reales raramente exceden estos rangos
    if (cleaned.length === 4 && num >= 5000) {
      return false;
    }
    if (cleaned.length === 5 && num >= 50000) {
      return false;
    }
    
    // ✅ PRIOR 4: Filtrar números muy pequeños (probablemente detecciones parciales)
    if (num < 10) {
      return false;
    }
    
    // ✅ PRIOR 5: Filtrar secuencias repetitivas (111, 2222, etc.) - probablemente ruido
    if (/^(\d)\1{2,}$/.test(cleaned)) {
      return false;
    }
    
    // ✅ PRIOR 6: Filtrar secuencias consecutivas (123, 1234, etc.) - probablemente ruido
    if (this.isConsecutiveSequence(cleaned)) {
      return false;
    }
    
    return true;
  }

  /**
   * Verificar si un número es una secuencia consecutiva (123, 1234, etc.)
   */
  private isConsecutiveSequence(numStr: string): boolean {
    if (numStr.length < 3) return false;
    
    // Verificar secuencia ascendente
    let isAscending = true;
    for (let i = 1; i < numStr.length; i++) {
      const prev = parseInt(numStr[i - 1], 10);
      const curr = parseInt(numStr[i], 10);
      if (curr !== (prev + 1) % 10) {
        isAscending = false;
        break;
      }
    }
    
    // Verificar secuencia descendente
    let isDescending = true;
    for (let i = 1; i < numStr.length; i++) {
      const prev = parseInt(numStr[i - 1], 10);
      const curr = parseInt(numStr[i], 10);
      if (curr !== (prev - 1 + 10) % 10) {
        isDescending = false;
        break;
      }
    }
    
    return isAscending || isDescending;
  }

  /**
   * 🔧 NUEVO: Escanear imagen con Google Vision (más preciso que Tesseract)
   */
  private async scanImageWithGoogleVision(
    imageBuffer: Buffer,
    opts: DetectionOptions,
  ): Promise<EnhancedDetection[]> {
    try {
      if (!this.bibOCRService.isGoogleVisionEnabled()) {
        return [];
      }

      this.logger.log('🔍 Usando Google Vision para escaneo completo de imagen...');
      
      // Usar Google Vision para extraer todos los números de dorsal
      // Acceder al servicio a través del BibOCRService
      const googleVisionService = (this.bibOCRService as any).googleVisionService;
      if (!googleVisionService) {
        return [];
      }
      
      const visionNumbers = await googleVisionService.extractAllBibNumbers(imageBuffer);
      
      if (!visionNumbers || visionNumbers.length === 0) {
        return [];
      }

      // Convertir a EnhancedDetection format
      const detections: EnhancedDetection[] = visionNumbers.map((bibNumber: string) => ({
        bibNumber,
        confidence: 0.85, // Google Vision es generalmente muy confiable
        detectionConfidence: 0.3, // Baja porque no viene de detección de objetos
        ocrConfidence: 0.85,
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        metadata: {
          class_id: 'google_vision',
          detection_id: 'gv_' + Date.now(),
          method: 'google_vision_full_scan',
        },
        ocrResult: {
          rawText: bibNumber,
          alternatives: [],
        },
      }));

      this.logger.log(`✅ Google Vision encontró ${detections.length} dorsales: ${detections.map(d => d.bibNumber).join(', ')}`);
      return detections;
    } catch (error) {
      this.logger.error(`Error en escaneo con Google Vision: ${error.message}`);
      return [];
    }
  }

  /**
   * Scan entire image with OCR to find ALL bib numbers
   * Uses multiple strategies: Google Vision, full-image OCR, and grid scanning
   * 🔧 MEJORA: Ahora solo se usa cuando NO hay detecciones de Roboflow
   */
  private async scanImageWithOCR(
    imageBuffer: Buffer,
    options: DetectionOptions,
  ): Promise<EnhancedDetection[]> {
    try {
      this.logger.log('Performing comprehensive full-image OCR scan for ALL bib numbers...');

      const detections: EnhancedDetection[] = [];
      const { width, height } = await this.imageProcessingService.getImageDimensions(imageBuffer);

      // Strategy 1: Extract all numbers from full image text
      try {
        this.logger.log('Extracting all bib numbers from full image text...');
        const allNumbers = await this.bibOCRService.extractAllBibNumbersFromText(imageBuffer);
        
        // 🔧 FILTRADO ESTRICTO: Solo números que realmente podrían ser dorsales
        // Priorizar números de 3-4 dígitos (más comunes) y filtrar números muy largos o muy cortos
        const filteredNumbers = allNumbers.filter(bibNumber => {
          // Validación básica
          if (!this.isValidBibNumber(bibNumber) || this.looksLikeYear(bibNumber)) {
            return false;
          }
          
          // 🔧 MEJORA: Filtrar números de 2 dígitos muy pequeños (< 20)
          // Estos probablemente son fragmentos o falsos positivos
          if (bibNumber.length === 2) {
            const num = parseInt(bibNumber, 10);
            if (num < 20) {
              return false;
            }
          }
          
          // Filtrar números de 5 dígitos que son muy grandes (probablemente falsos positivos)
          if (bibNumber.length === 5) {
            const num = parseInt(bibNumber, 10);
            if (num > 50000) {
              return false; // Muy grande para ser un dorsal real
            }
          }
          
          // Filtrar números que empiezan con 0 (probablemente fragmentos)
          if (bibNumber.length >= 4 && bibNumber.startsWith('0')) {
            return false;
          }
          
          return true;
        });
        
        // 🔧 MEJORA: Priorizar números de 3-4 dígitos sobre otros
        // Los dorsales típicamente tienen 3-4 dígitos, raramente 2 o 5
        // También priorizar números que están en rangos comunes de dorsales (1000-9999 para 4 dígitos)
        const prioritizedNumbers = filteredNumbers.sort((a, b) => {
          // Preferir 4 dígitos (más comunes en carreras grandes)
          if (a.length === 4 && b.length !== 4) return -1;
          if (b.length === 4 && a.length !== 4) return 1;
          
          // Si ambos son de 4 dígitos, priorizar rangos comunes (1000-9999)
          if (a.length === 4 && b.length === 4) {
            const numA = parseInt(a, 10);
            const numB = parseInt(b, 10);
            // Priorizar números en rango común de dorsales (1000-9999)
            const aInRange = numA >= 1000 && numA <= 9999;
            const bInRange = numB >= 1000 && numB <= 9999;
            if (aInRange && !bInRange) return -1;
            if (!aInRange && bInRange) return 1;
            // Si ambos están en rango, mantener orden original (aparecen primero en el texto)
          }
          
          // Luego 3 dígitos
          if (a.length === 3 && b.length !== 3) return -1;
          if (b.length === 3 && a.length !== 3) return 1;
          
          // Evitar números de 2 dígitos si hay mejores opciones
          if (a.length === 2 && b.length >= 3) return 1;
          if (b.length === 2 && a.length >= 3) return -1;
          
          // Evitar números de 5 dígitos si hay mejores opciones
          if (a.length === 5 && b.length <= 4) return 1;
          if (b.length === 5 && a.length <= 4) return -1;
          
          // Finalmente por longitud
          return a.length - b.length;
        });
        
        // 🔧 MEJORA: Aumentar límite a 5 números para capturar más dorsales en fotos con múltiples corredores
        // Luego se filtrarán por proximidad a detecciones de Roboflow
        const limitedNumbers = prioritizedNumbers.slice(0, 5);
        
        // For each number found, create a detection
        for (const bibNumber of limitedNumbers) {
          // 🔧 MEJORA: Dar mayor confianza a números de 4 dígitos del OCR completo
          // Estos son muy confiables y deben priorizarse sobre detecciones cortas de Roboflow
          const confidence = bibNumber.length === 4 ? 0.75 : // Alta confianza para 4 dígitos
                            bibNumber.length === 3 ? 0.65 : // Confianza media para 3 dígitos
                            0.5; // Confianza baja para otros
          
          // Create approximate detection (we don't have exact position)
          detections.push({
            bibNumber,
            confidence,
            detectionConfidence: 0.3,
            ocrConfidence: confidence,
            x: width * 0.25,
            y: height * 0.25,
            width: width * 0.5,
            height: height * 0.5,
            metadata: {
              class_id: 0,
              detection_id: `ocr-full-${bibNumber}`,
              method: 'ocr_corrected',
            },
          });
        }
        
        if (detections.length > 0) {
          this.logger.log(`Full-image OCR found ${allNumbers.length} candidates, ${filteredNumbers.length} after filtering, ${limitedNumbers.length} prioritized: ${limitedNumbers.join(', ')}`);
        }
      } catch (error) {
        this.logger.warn(`Error extracting all numbers: ${error.message}`);
      }

      // Strategy 2: Grid-based scanning (divide image into regions and scan each)
      if (detections.length === 0 || detections.every(d => d.bibNumber.length < 4)) {
        // Only do grid scanning if we haven't found 4-digit numbers
        try {
          this.logger.log('Performing grid-based scanning...');
          const gridDetections = await this.scanImageGrid(imageBuffer, width, height);
          
          // Add unique detections from grid scan
          for (const gridDet of gridDetections) {
            const exists = detections.some(
              d => d.bibNumber === gridDet.bibNumber
            );
            if (!exists) {
              detections.push(gridDet);
            }
          }
        } catch (error) {
          this.logger.warn(`Grid scanning failed: ${error.message}`);
        }
      }

      // Remove duplicates and invalid numbers
      const uniqueDetections = this.deduplicateDetections(detections.filter(d => 
        this.isValidBibNumber(d.bibNumber) && !this.looksLikeYear(d.bibNumber)
      ));

      this.logger.log(
        `Full-image OCR scan found ${uniqueDetections.length} unique bib numbers: ${uniqueDetections.map(d => d.bibNumber).join(', ')}`,
      );

      return uniqueDetections;
    } catch (error) {
      this.logger.warn(
        `Error in full-image OCR scan: ${error.message}`,
      );
      return [];
    }
  }

  /**
   * Scan image using a grid approach (divide into regions and scan each)
   */
  private async scanImageGrid(
    imageBuffer: Buffer,
    imageWidth: number,
    imageHeight: number,
  ): Promise<EnhancedDetection[]> {
    const detections: EnhancedDetection[] = [];
    
    // Use a 3x3 grid for better coverage
    const gridSize = 3;
    const regionWidth = imageWidth / gridSize;
    const regionHeight = imageHeight / gridSize;

    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        try {
          const x = col * regionWidth;
          const y = row * regionHeight;
          
          const region = await this.imageProcessingService.extractRegion(
            imageBuffer,
            x,
            y,
            regionWidth,
            regionHeight,
          );

          // Enhance region for better OCR
          const enhancedRegion = await this.imageEnhancementService.enhanceImage(
            region.buffer,
            {
              contrast: 2.5,
              brightness: 1.2,
              sharpen: true,
              normalize: true,
              grayscale: true,
            },
          );

          const ocrResult = await this.bibOCRService.readBibNumber(enhancedRegion);
          
          if (ocrResult && ocrResult.bibNumber && this.isValidBibNumber(ocrResult.bibNumber)) {
            // Check if we already have this detection
            const exists = detections.some(
              d => d.bibNumber === ocrResult.bibNumber
            );
            
            if (!exists) {
              detections.push({
                bibNumber: ocrResult.bibNumber,
                confidence: ocrResult.confidence,
                detectionConfidence: 0.3,
                ocrConfidence: ocrResult.confidence,
                x,
                y,
                width: regionWidth,
                height: regionHeight,
                ocrResult,
                metadata: {
                  class_id: 0,
                  detection_id: `grid-${row}-${col}`,
                  method: 'ocr_corrected',
                },
              });
            }
          }
        } catch (error) {
          // Continue with next region
        }
      }
    }

    return detections;
  }

  /**
   * Calculate combined confidence from detection and OCR
   */
  private calculateCombinedConfidence(
    detectionConfidence: number,
    ocrConfidence: number,
    method: string,
  ): number {
    if (method === 'robofow_only') {
      return detectionConfidence;
    } else if (method === 'ocr_verified') {
      // Both agree, boost confidence
      return Math.min(1.0, (detectionConfidence + ocrConfidence) / 2 + 0.1);
    } else {
      // OCR corrected, use weighted average
      return Math.min(1.0, detectionConfidence * 0.3 + ocrConfidence * 0.7);
    }
  }

  /**
   * Remove duplicate detections and merge fragmented detections
   * Mejorado para detectar y fusionar números fragmentados como "12" y "523" -> "1523"
   */
  private deduplicateDetections(
    detections: EnhancedDetection[],
  ): EnhancedDetection[] {
    // Primero, intentar fusionar detecciones fragmentadas que están cerca espacialmente
    const merged = this.mergeFragmentedDetections(detections);
    
    const seen = new Map<string, EnhancedDetection>();

    for (const detection of merged) {
      const existing = seen.get(detection.bibNumber);

      if (!existing) {
        seen.set(detection.bibNumber, detection);
      } else {
        // Preferir el que tiene mayor longitud (más completo)
        // Si tienen la misma longitud, preferir el de mayor confianza
        if (detection.bibNumber.length > existing.bibNumber.length) {
          seen.set(detection.bibNumber, detection);
        } else if (
          detection.bibNumber.length === existing.bibNumber.length &&
          detection.confidence > existing.confidence
        ) {
          seen.set(detection.bibNumber, detection);
        }
      }
    }

    return Array.from(seen.values());
  }

  /**
   * Intenta fusionar detecciones fragmentadas que están cerca espacialmente
   * Ejemplo: "12" y "523" cerca -> podría ser "1523" fragmentado
   */
  private mergeFragmentedDetections(
    detections: EnhancedDetection[],
  ): EnhancedDetection[] {
    const merged: EnhancedDetection[] = [];
    const processed = new Set<number>();
    
    // Agrupar detecciones por proximidad espacial
    for (let i = 0; i < detections.length; i++) {
      if (processed.has(i)) continue;
      
      const detection = detections[i];
      const nearbyGroup: EnhancedDetection[] = [detection];
      
      // Buscar detecciones cercanas (dentro de 200 píxeles)
      for (let j = i + 1; j < detections.length; j++) {
        if (processed.has(j)) continue;
        
        const other = detections[j];
        const distance = this.calculateDistance(detection, other);
        
        // Si están cerca espacialmente y tienen números diferentes
        if (distance < 200 && detection.bibNumber !== other.bibNumber) {
          // Verificar si podrían ser fragmentos del mismo número
          // Por ejemplo: "12" y "523" podrían ser "1523"
          const combined = this.tryCombineNumbers(detection, other);
          
          if (combined) {
            // Fusionar las detecciones
            const mergedDetection = this.mergeTwoDetections(detection, other, combined);
            nearbyGroup.push(mergedDetection);
            processed.add(j);
          }
        }
      }
      
      if (nearbyGroup.length > 1) {
        // Usar la detección fusionada si hay una
        const fused = nearbyGroup.find(d => d.metadata.detection_id.includes('merged')) || nearbyGroup[0];
        merged.push(fused);
      } else {
        merged.push(detection);
      }
      
      processed.add(i);
    }
    
    return merged;
  }

  /**
   * Calcula la distancia entre dos detecciones
   */
  private calculateDistance(a: EnhancedDetection, b: EnhancedDetection): number {
    const centerA = { x: a.x + a.width / 2, y: a.y + a.height / 2 };
    const centerB = { x: b.x + b.width / 2, y: b.y + b.height / 2 };
    
    return Math.sqrt(
      Math.pow(centerA.x - centerB.x, 2) + Math.pow(centerA.y - centerB.y, 2)
    );
  }

  /**
   * Intenta combinar dos números si podrían ser fragmentos del mismo número
   * Ejemplo: "12" + "523" -> "1523" (si están cerca y alineados)
   */
  private tryCombineNumbers(
    a: EnhancedDetection,
    b: EnhancedDetection,
  ): string | null {
    const numA = a.bibNumber;
    const numB = b.bibNumber;
    
    // Si uno contiene al otro, usar el más largo
    if (numA.includes(numB)) return numA;
    if (numB.includes(numA)) return numB;
    
    // Intentar combinaciones: numA + numB y numB + numA
    const combined1 = numA + numB;
    const combined2 = numB + numA;
    
    // Si alguna combinación es válida (3-5 dígitos) y no es un año
    if (this.isValidBibNumber(combined1) && !this.looksLikeYear(combined1)) {
      // Verificar si están alineados horizontalmente (mismo Y aproximado)
      const yDiff = Math.abs((a.y + a.height / 2) - (b.y + b.height / 2));
      if (yDiff < a.height * 0.5) {
        return combined1;
      }
    }
    
    if (this.isValidBibNumber(combined2) && !this.looksLikeYear(combined2)) {
      const yDiff = Math.abs((a.y + a.height / 2) - (b.y + b.height / 2));
      if (yDiff < a.height * 0.5) {
        return combined2;
      }
    }
    
    return null;
  }

  /**
   * Fusiona dos detecciones en una
   */
  private mergeTwoDetections(
    a: EnhancedDetection,
    b: EnhancedDetection,
    combinedNumber: string,
  ): EnhancedDetection {
    // Crear bounding box que contenga ambas detecciones
    const minX = Math.min(a.x, b.x);
    const minY = Math.min(a.y, b.y);
    const maxX = Math.max(a.x + a.width, b.x + b.width);
    const maxY = Math.max(a.y + a.height, b.y + b.height);
    
    // Usar la confianza promedio ponderada
    const avgConfidence = (a.confidence + b.confidence) / 2;
    const avgOCRConfidence = (a.ocrConfidence + b.ocrConfidence) / 2;
    
    return {
      bibNumber: combinedNumber,
      confidence: Math.min(1.0, avgConfidence + 0.1), // Boost por ser fusión
      detectionConfidence: (a.detectionConfidence + b.detectionConfidence) / 2,
      ocrConfidence: avgOCRConfidence,
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
      metadata: {
        class_id: a.metadata.class_id,
        detection_id: `merged-${a.metadata.detection_id}-${b.metadata.detection_id}`,
        method: 'ocr_corrected',
      },
    };
  }

  /**
   * Merge nearby detections (same bib number detected multiple times)
   */
  private mergeNearbyDetections(
    detections: EnhancedDetection[],
    threshold: number = 50, // pixels
  ): EnhancedDetection[] {
    const merged: EnhancedDetection[] = [];
    const processed = new Set<number>();

    for (let i = 0; i < detections.length; i++) {
      if (processed.has(i)) continue;

      const detection = detections[i];
      const nearby: EnhancedDetection[] = [detection];

      for (let j = i + 1; j < detections.length; j++) {
        if (processed.has(j)) continue;

        const other = detections[j];

        // Check if same bib number and nearby
        if (
          detection.bibNumber === other.bibNumber &&
          this.isNearby(detection, other, threshold)
        ) {
          nearby.push(other);
          processed.add(j);
        }
      }

      // Merge nearby detections
      if (nearby.length > 1) {
        const mergedDetection = this.mergeDetections(nearby);
        merged.push(mergedDetection);
      } else {
        merged.push(detection);
      }

      processed.add(i);
    }

    return merged;
  }

  /**
   * Check if two detections are nearby
   */
  private isNearby(
    a: EnhancedDetection,
    b: EnhancedDetection,
    threshold: number,
  ): boolean {
    const centerA = { x: a.x + a.width / 2, y: a.y + a.height / 2 };
    const centerB = { x: b.x + b.width / 2, y: b.y + b.height / 2 };

    const distance = Math.sqrt(
      Math.pow(centerA.x - centerB.x, 2) + Math.pow(centerA.y - centerB.y, 2),
    );

    return distance < threshold;
  }

  /**
   * Merge multiple detections into one
   */
  private mergeDetections(
    detections: EnhancedDetection[],
  ): EnhancedDetection {
    // Use the detection with highest confidence as base
    const base = detections.reduce((best, current) =>
      current.confidence > best.confidence ? current : best,
    );

    // Calculate average bounding box
    const avgX =
      detections.reduce((sum, d) => sum + d.x, 0) / detections.length;
    const avgY =
      detections.reduce((sum, d) => sum + d.y, 0) / detections.length;
    const avgWidth =
      detections.reduce((sum, d) => sum + d.width, 0) / detections.length;
    const avgHeight =
      detections.reduce((sum, d) => sum + d.height, 0) / detections.length;

    // Calculate average confidences
    const avgDetectionConfidence =
      detections.reduce((sum, d) => sum + d.detectionConfidence, 0) /
      detections.length;
    const avgOCRConfidence =
      detections
        .filter((d) => d.ocrResult)
        .reduce((sum, d) => sum + (d.ocrConfidence || 0), 0) /
      Math.max(1, detections.filter((d) => d.ocrResult).length);

    return {
      ...base,
      x: avgX,
      y: avgY,
      width: avgWidth,
      height: avgHeight,
      confidence: Math.min(
        1.0,
        (avgDetectionConfidence + avgOCRConfidence) / 2 + 0.1,
      ),
      detectionConfidence: avgDetectionConfidence,
      ocrConfidence: avgOCRConfidence,
    };
  }

  /**
   * Verifica si una región está en la zona del torso (donde están los dorsales)
   * 🔧 MEJORA: Filtrado inteligente basado en posición vertical
   * Los dorsales suelen estar entre 20% y 65% de la altura de la imagen
   * Esto elimina falsos positivos en cielo, suelo, o extremidades
   */
  private isInTorsoRegion(y: number, height: number, imageHeight: number): boolean {
    const centerY = y + height / 2;
    const relativeY = centerY / imageHeight;
    
    // Los dorsales suelen estar entre 20% y 65% de la altura de la imagen
    return relativeY >= 0.2 && relativeY <= 0.65;
  }

  /**
   * 🔍 Refinar bounding box con análisis geométrico avanzado
   * Aplica expansión adaptativa basada en aspect ratio y características del dorsal
   */
  private refineBoundingBox(
    x: number,
    y: number,
    width: number,
    height: number,
    imageWidth: number,
    imageHeight: number,
    horizontalExpansion: number = 200,
    verticalExpansion: number = 150,
  ): { x: number; y: number; width: number; height: number } {
    // Calcular expansión en píxeles
    const widthExpansion = (width * horizontalExpansion) / 100;
    const heightExpansion = (height * verticalExpansion) / 100;

    // Expandir en todas las direcciones
    let newX = x - widthExpansion / 2;
    let newY = y - heightExpansion / 2;
    let newWidth = width + widthExpansion;
    let newHeight = height + heightExpansion;

    // Asegurar que no excedamos los límites de la imagen
    if (newX < 0) {
      newWidth += newX;
      newX = 0;
    }
    if (newY < 0) {
      newHeight += newY;
      newY = 0;
    }
    if (newX + newWidth > imageWidth) {
      newWidth = imageWidth - newX;
    }
    if (newY + newHeight > imageHeight) {
      newHeight = imageHeight - newY;
    }

    return {
      x: newX,
      y: newY,
      width: newWidth,
      height: newHeight,
    };
  }

  /**
   * 🎯 SOLUCIÓN 2: Multi-crop OCR (4 regiones)
   * Extrae 4 regiones específicas para reconocimiento redundante:
   * 1. Centro (bbox original)
   * 2. Izquierda (expandida hacia la izquierda para capturar dígitos iniciales)
   * 3. Derecha (expandida hacia la derecha para capturar dígitos finales)
   * 4. Full expanded crop (bbox completamente expandido)
   */
  private async extractMultiCropRegions(
    imageBuffer: Buffer,
    bbox: { x: number; y: number; width: number; height: number },
    imageWidth: number,
    imageHeight: number,
  ): Promise<Array<{ buffer: Buffer; width: number; height: number; type: string }>> {
    const regions: Array<{ buffer: Buffer; width: number; height: number; type: string }> = [];
    
    // Región 1: CENTRO (bbox original)
    try {
      const centerRegion = await this.imageProcessingService.extractRegion(
        imageBuffer,
        bbox.x,
        bbox.y,
        bbox.width,
        bbox.height,
      );
      regions.push({ ...centerRegion, type: 'center' });
      this.logger.debug('Multi-crop: Extracted CENTER region');
    } catch (error) {
      this.logger.warn(`Error extracting center region: ${error.message}`);
    }

    // Región 2: IZQUIERDA (expandida 30% hacia la izquierda para capturar dígitos iniciales)
    try {
      const leftExpansion = bbox.width * 0.3;
      const leftExpanded = {
        x: Math.max(0, bbox.x - leftExpansion),
        y: bbox.y,
        width: bbox.width + leftExpansion,
        height: bbox.height,
      };
      // Ajustar width si excede los límites
      if (leftExpanded.x + leftExpanded.width > imageWidth) {
        leftExpanded.width = imageWidth - leftExpanded.x;
      }
      if (leftExpanded.width > 0 && leftExpanded.height > 0) {
        const leftRegion = await this.imageProcessingService.extractRegion(
          imageBuffer,
          leftExpanded.x,
          leftExpanded.y,
          leftExpanded.width,
          leftExpanded.height,
        );
        regions.push({ ...leftRegion, type: 'left' });
        this.logger.debug('Multi-crop: Extracted LEFT region');
      }
    } catch (error) {
      this.logger.debug(`Error extracting left region: ${error.message}`);
    }

    // Región 3: DERECHA (expandida 30% hacia la derecha para capturar dígitos finales)
    try {
      const rightExpansion = bbox.width * 0.3;
      const rightExpanded = {
        x: bbox.x,
        y: bbox.y,
        width: Math.min(imageWidth - bbox.x, bbox.width + rightExpansion),
        height: bbox.height,
      };
      if (rightExpanded.width > 0 && rightExpanded.height > 0) {
        const rightRegion = await this.imageProcessingService.extractRegion(
          imageBuffer,
          rightExpanded.x,
          rightExpanded.y,
          rightExpanded.width,
          rightExpanded.height,
        );
        regions.push({ ...rightRegion, type: 'right' });
        this.logger.debug('Multi-crop: Extracted RIGHT region');
      }
    } catch (error) {
      this.logger.debug(`Error extracting right region: ${error.message}`);
    }

    // Región 4: FULL EXPANDED CROP (bbox expandido 50% en todas las direcciones)
    try {
      const fullExpansion = 0.5; // 50% expansion
      const fullExpanded = {
        x: Math.max(0, bbox.x - bbox.width * fullExpansion),
        y: Math.max(0, bbox.y - bbox.height * fullExpansion),
        width: Math.min(imageWidth - Math.max(0, bbox.x - bbox.width * fullExpansion), bbox.width * (1 + fullExpansion * 2)),
        height: Math.min(imageHeight - Math.max(0, bbox.y - bbox.height * fullExpansion), bbox.height * (1 + fullExpansion * 2)),
      };
      if (fullExpanded.width > 0 && fullExpanded.height > 0) {
        const fullRegion = await this.imageProcessingService.extractRegion(
          imageBuffer,
          fullExpanded.x,
          fullExpanded.y,
          fullExpanded.width,
          fullExpanded.height,
        );
        regions.push({ ...fullRegion, type: 'full_expanded' });
        this.logger.debug('Multi-crop: Extracted FULL EXPANDED region');
      }
    } catch (error) {
      this.logger.debug(`Error extracting full expanded region: ${error.message}`);
    }

    this.logger.log(`Multi-crop OCR: Extracted ${regions.length} regions (center, left, right, full_expanded)`);
    return regions;
  }

  /**
   * 🔬 SOLUCIÓN 4: Reconstrucción de secuencia multimodal
   * Fusiona resultados de Tesseract y Google Vision para reconstruir números completos
   * Ejemplo: Tesseract detecta "1 2" + Google Vision detecta "523" → "1523"
   */
  private reconstructMultimodalSequence(
    tesseractResult: BibOCRResult | null,
    googleVisionResult: BibOCRResult | null,
  ): BibOCRResult | null {
    if (!tesseractResult && !googleVisionResult) {
      return null;
    }

    // Si solo hay un resultado, usarlo directamente
    if (!tesseractResult) return googleVisionResult;
    if (!googleVisionResult) return tesseractResult;

    const tesseractText = tesseractResult.bibNumber || '';
    const visionText = googleVisionResult.bibNumber || '';

    // Si ambos detectan el mismo número, retornarlo con mayor confianza
    if (tesseractText === visionText) {
      return {
        ...tesseractResult,
        confidence: Math.max(tesseractResult.confidence, googleVisionResult.confidence),
        method: 'multimodal_consensus' as const,
      };
    }

    // Intentar reconstruir número completo fusionando ambos resultados
    const reconstructed = this.fuseOCRResults(tesseractText, visionText, tesseractResult, googleVisionResult);
    
    if (reconstructed) {
      this.logger.log(
        `🔬 Reconstrucción multimodal: Tesseract="${tesseractText}" + Vision="${visionText}" → "${reconstructed.bibNumber}"`,
      );
      return reconstructed;
    }

    // Si no se puede fusionar, preferir el más largo o de mayor confianza
    if (visionText.length > tesseractText.length) {
      return googleVisionResult;
    } else if (tesseractText.length > visionText.length) {
      return tesseractResult;
    } else {
      return googleVisionResult.confidence > tesseractResult.confidence ? googleVisionResult : tesseractResult;
    }
  }

  /**
   * Fusiona dos resultados OCR para reconstruir un número completo
   * Ejemplo: "1 2" + "523" → "1523"
   */
  private fuseOCRResults(
    text1: string,
    text2: string,
    result1: BibOCRResult,
    result2: BibOCRResult,
  ): BibOCRResult | null {
    // Limpiar espacios y caracteres no numéricos
    const clean1 = text1.replace(/\s+/g, '').replace(/[^\d]/g, '');
    const clean2 = text2.replace(/\s+/g, '').replace(/[^\d]/g, '');

    // Si uno contiene al otro completamente, usar el más largo
    if (clean1.includes(clean2)) return result1;
    if (clean2.includes(clean1)) return result2;

    // Intentar combinaciones: text1 + text2 y text2 + text1
    const combined1 = clean1 + clean2;
    const combined2 = clean2 + clean1;

    // Verificar si alguna combinación es válida
    if (this.isValidBibNumber(combined1) && !this.looksLikeYear(combined1)) {
      return {
        bibNumber: combined1,
        confidence: Math.min(1.0, (result1.confidence + result2.confidence) / 2 + 0.1),
        rawText: `${text1} + ${text2}`,
        method: 'multimodal_fused' as const,
      };
    }

    if (this.isValidBibNumber(combined2) && !this.looksLikeYear(combined2)) {
      return {
        bibNumber: combined2,
        confidence: Math.min(1.0, (result1.confidence + result2.confidence) / 2 + 0.1),
        rawText: `${text2} + ${text1}`,
        method: 'multimodal_fused' as const,
      };
    }

    // Intentar reconstrucción inteligente: buscar superposición
    // Ejemplo: "12" y "523" → buscar si "2" de "12" es el inicio de "523"
    const overlap = this.findOverlap(clean1, clean2);
    if (overlap) {
      const fused = this.mergeWithOverlap(clean1, clean2, overlap);
      if (fused && this.isValidBibNumber(fused) && !this.looksLikeYear(fused)) {
        return {
          bibNumber: fused,
          confidence: Math.min(1.0, (result1.confidence + result2.confidence) / 2 + 0.15),
          rawText: `${text1} + ${text2} (overlap: ${overlap})`,
          method: 'multimodal_fused_overlap' as const,
        };
      }
    }

    return null;
  }

  /**
   * Encuentra superposición entre dos cadenas numéricas
   * Ejemplo: "12" y "23" → overlap = "2"
   */
  private findOverlap(str1: string, str2: string): string | null {
    // Buscar si el final de str1 coincide con el inicio de str2
    for (let len = Math.min(str1.length, str2.length); len > 0; len--) {
      const suffix = str1.slice(-len);
      const prefix = str2.slice(0, len);
      if (suffix === prefix) {
        return suffix;
      }
    }
    return null;
  }

  /**
   * Fusiona dos cadenas usando la superposición encontrada
   * Ejemplo: "12" + "23" (overlap "2") → "123"
   */
  private mergeWithOverlap(str1: string, str2: string, overlap: string): string | null {
    const overlapIndex = str1.lastIndexOf(overlap);
    if (overlapIndex === -1) return null;

    const prefix = str1.slice(0, overlapIndex);
    const suffix = str2.slice(overlap.length);
    return prefix + overlap + suffix;
  }

  /**
   * 🧠 Consolidar resultados de multi-crop OCR usando voting/consensus
   * Implementa razonamiento probabilístico para fusionar múltiples lecturas OCR
   * SOLUCIÓN 4: Ahora también aplica reconstrucción multimodal
   */
  private consolidateMultiCropResults(
    ocrResults: BibOCRResult[],
    mainRegionBuffer: Buffer,
  ): BibOCRResult {
    if (ocrResults.length === 0) {
      return null as any;
    }

    if (ocrResults.length === 1) {
      return ocrResults[0];
    }

    // Contar frecuencia de cada número detectado
    const bibNumberCounts = new Map<string, { count: number; totalConfidence: number; results: BibOCRResult[] }>();
    
    for (const result of ocrResults) {
      if (result.bibNumber && this.isValidBibNumber(result.bibNumber)) {
        const existing = bibNumberCounts.get(result.bibNumber);
        if (existing) {
          existing.count++;
          existing.totalConfidence += result.confidence;
          existing.results.push(result);
        } else {
          bibNumberCounts.set(result.bibNumber, {
            count: 1,
            totalConfidence: result.confidence,
            results: [result],
          });
        }
      }
    }

    if (bibNumberCounts.size === 0) {
      // Ningún resultado válido, retornar el de mayor confianza
      return ocrResults.reduce((best, current) => 
        (current.confidence || 0) > (best.confidence || 0) ? current : best
      );
    }

    // Encontrar el número más frecuente (consensus)
    let bestBibNumber = '';
    let bestScore = 0;
    
    for (const [bibNumber, data] of bibNumberCounts.entries()) {
      // Score = frecuencia * confianza promedio
      const avgConfidence = data.totalConfidence / data.count;
      const score = data.count * avgConfidence;
      
      // Bonus por longitud (preferir números más largos si hay empate)
      const lengthBonus = bibNumber.length >= 4 ? 1.2 : 1.0;
      const finalScore = score * lengthBonus;
      
      if (finalScore > bestScore) {
        bestScore = finalScore;
        bestBibNumber = bibNumber;
      }
    }

    // Obtener el mejor resultado para ese número
    const bestData = bibNumberCounts.get(bestBibNumber);
    if (bestData) {
      const bestResult = bestData.results.reduce((best, current) =>
        (current.confidence || 0) > (best.confidence || 0) ? current : best
      );
      
      // Aumentar confianza basado en consensus
      const consensusBoost = Math.min(0.15, bestData.count * 0.05);
      const boostedConfidence = Math.min(1.0, (bestResult.confidence || 0) + consensusBoost);
      
      return {
        ...bestResult,
        bibNumber: bestBibNumber,
        confidence: boostedConfidence,
      };
    }

    // Fallback
    return ocrResults[0];
  }

  /**
   * 🧠 DESAMBIGUACIÓN MULTIMODAL: Usar contexto visual y textual para validar detecciones
   * Combina señales de bounding box, OCR, geometría y priors de dominio
   */
  private async disambiguateWithContext(
    ocrResult: BibOCRResult,
    roboflowBibNumber: string,
    detection: RoboflowDetection,
    imageBuffer: Buffer,
    bbox: { x: number; y: number; width: number; height: number },
  ): Promise<BibOCRResult | null> {
    try {
      // Análisis de contexto visual
      const visualContext = this.analyzeVisualContext(detection, bbox);
      
      // Análisis de contexto textual (alternativas de OCR)
      const textualContext = ocrResult.alternatives || [];
      
      // Candidatos a evaluar
      const candidates: Array<{ bibNumber: string; score: number; source: string }> = [];
      
      // Candidato 1: Resultado OCR principal
      if (ocrResult.bibNumber && this.isValidBibNumber(ocrResult.bibNumber)) {
        let score = ocrResult.confidence || 0.5;
        
        // 🔧 MEJORA: Bonus MUY grande por longitud (preferir números más largos)
        // Números de 4 dígitos son mucho más confiables que números de 2 dígitos
        if (ocrResult.bibNumber.length === 4) {
          score += 0.3; // Bonus grande para 4 dígitos
        } else if (ocrResult.bibNumber.length === 3) {
          score += 0.2; // Bonus medio para 3 dígitos
        } else if (ocrResult.bibNumber.length === 2) {
          score -= 0.2; // Penalizar números de 2 dígitos
        }
        
        // Bonus si coincide con Roboflow (consensus)
        if (roboflowBibNumber && ocrResult.bibNumber === roboflowBibNumber) {
          score += 0.2;
        }
        
        // Bonus por contexto visual (bbox razonable)
        if (visualContext.isReasonable) {
          score += 0.1;
        }
        
        candidates.push({
          bibNumber: ocrResult.bibNumber,
          score,
          source: 'ocr_main',
        });
      }
      
      // Candidato 2: Roboflow (si es válido)
      if (roboflowBibNumber && this.isValidBibNumber(roboflowBibNumber)) {
        let score = detection.confidence;
        
        // 🔧 MEJORA: Penalizar números de Roboflow si son muy cortos
        // Roboflow a menudo detecta fragmentos parciales (2 dígitos) cuando el OCR detecta el número completo
        if (roboflowBibNumber.length === 2) {
          score -= 0.3; // Penalizar fuertemente números de 2 dígitos de Roboflow
        } else if (roboflowBibNumber.length === 3) {
          score += 0.1; // Bonus pequeño para 3 dígitos
        } else if (roboflowBibNumber.length === 4) {
          score += 0.2; // Bonus para 4 dígitos
        }
        
        // Bonus si coincide con OCR
        if (ocrResult.bibNumber === roboflowBibNumber) {
          score += 0.2;
        }
        
        candidates.push({
          bibNumber: roboflowBibNumber,
          score,
          source: 'roboflow',
        });
      }
      
      // Candidato 3: Alternativas de OCR
      for (const alt of textualContext) {
        if (this.isValidBibNumber(alt)) {
          let score = 0.3; // Base score para alternativas
          
          // Bonus si es similar al resultado principal (corrección menor)
          if (ocrResult.bibNumber && this.areSimilar(alt, ocrResult.bibNumber)) {
            score += 0.2;
          }
          
          candidates.push({
            bibNumber: alt,
            score,
            source: 'ocr_alternative',
          });
        }
      }
      
      // Seleccionar mejor candidato
      if (candidates.length === 0) {
        return null;
      }
      
      // 🔧 MEJORA: Ordenar por score, pero priorizar números más largos en caso de empate
      candidates.sort((a, b) => {
        // Primero por score
        if (Math.abs(b.score - a.score) > 0.1) {
          return b.score - a.score;
        }
        // Si scores son similares (diferencia < 0.1), priorizar números más largos
        if (a.bibNumber.length !== b.bibNumber.length) {
          return b.bibNumber.length - a.bibNumber.length;
        }
        return b.score - a.score;
      });
      const bestCandidate = candidates[0];
      
      // Si el mejor candidato es diferente del resultado OCR original, actualizar
      if (bestCandidate.bibNumber !== ocrResult.bibNumber) {
        this.logger.log(
          `Desambiguación multimodal: "${ocrResult.bibNumber}" -> "${bestCandidate.bibNumber}" ` +
          `(score: ${bestCandidate.score.toFixed(2)}, source: ${bestCandidate.source})`,
        );
        
        return {
          ...ocrResult,
          bibNumber: bestCandidate.bibNumber,
          confidence: Math.min(1.0, bestCandidate.score),
        };
      }
      
      return ocrResult;
    } catch (error) {
      this.logger.warn(`Error en desambiguación multimodal: ${error.message}`);
      return ocrResult; // Retornar original si falla
    }
  }

  /**
   * Analizar contexto visual de la detección (bbox, tamaño, posición)
   */
  private analyzeVisualContext(
    detection: RoboflowDetection,
    bbox: { x: number; y: number; width: number; height: number },
  ): { isReasonable: boolean; aspectRatio: number; area: number } {
    const aspectRatio = bbox.width / bbox.height;
    const area = bbox.width * bbox.height;
    
    // Un bbox razonable para un dorsal tiene:
    // - Aspect ratio > 1.0 (horizontal)
    // - Área suficiente (> 1000 píxeles)
    const isReasonable = aspectRatio > 1.0 && area > 1000;
    
    return {
      isReasonable,
      aspectRatio,
      area,
    };
  }

  /**
   * Verificar si dos números son similares (difieren en 1-2 dígitos)
   */
  private areSimilar(num1: string, num2: string): boolean {
    if (!num1 || !num2) return false;
    if (num1 === num2) return true;
    if (Math.abs(num1.length - num2.length) > 1) return false;
    
    // Calcular distancia de Levenshtein simple
    let differences = 0;
    const maxLen = Math.max(num1.length, num2.length);
    
    for (let i = 0; i < maxLen; i++) {
      if (num1[i] !== num2[i]) {
        differences++;
      }
    }
    
    // Similar si difieren en máximo 1-2 caracteres
    return differences <= 2;
  }

  /**
   * 🔬 CORRECCIÓN PROBABILÍSTICA FINAL: Validar y corregir detecciones usando razonamiento probabilístico
   * Aplica validación final basada en múltiples señales y priors de dominio
   */
  private async applyProbabilisticCorrection(
    detections: EnhancedDetection[],
  ): Promise<EnhancedDetection[]> {
    if (detections.length === 0) {
      return detections;
    }

    const corrected: EnhancedDetection[] = [];

    for (const detection of detections) {
      // Calcular score probabilístico combinado
      const probabilisticScore = this.calculateProbabilisticScore(detection);

      // Si el score es muy bajo, intentar correcciones
      if (probabilisticScore < 0.5) {
        const correctedDetection = await this.attemptProbabilisticCorrection(detection);
        if (correctedDetection && this.isValidBibNumber(correctedDetection.bibNumber)) {
          corrected.push(correctedDetection);
          this.logger.log(
            `Corrección probabilística: "${detection.bibNumber}" -> "${correctedDetection.bibNumber}" ` +
            `(score: ${probabilisticScore.toFixed(2)} -> ${this.calculateProbabilisticScore(correctedDetection).toFixed(2)})`,
          );
        } else {
          // Si no se puede corregir y el score es muy bajo, descartar
          if (probabilisticScore < 0.3) {
            this.logger.warn(
              `Descartando detección de baja confianza: "${detection.bibNumber}" (score: ${probabilisticScore.toFixed(2)})`,
            );
            continue;
          }
          corrected.push(detection);
        }
      } else {
        // Score suficiente, mantener detección
        corrected.push(detection);
      }
    }

    return corrected;
  }

  /**
   * Calcular score probabilístico combinado para una detección
   */
  private calculateProbabilisticScore(detection: EnhancedDetection): number {
    let score = 0.0;

    // Factor 1: Confianza de detección (Roboflow)
    score += detection.detectionConfidence * 0.3;

    // Factor 2: Confianza de OCR
    score += detection.ocrConfidence * 0.4;

    // Factor 3: Validación del número (priors de dominio)
    if (this.isValidBibNumber(detection.bibNumber)) {
      score += 0.2;
    }

    // Factor 4: Longitud del número (preferir 3-5 dígitos)
    if (detection.bibNumber.length >= 3 && detection.bibNumber.length <= 5) {
      score += 0.05;
    }
    if (detection.bibNumber.length === 4) {
      score += 0.05; // Bonus para 4 dígitos (más común)
    }

    // Factor 5: Método de detección (preferir OCR verificado/corregido)
    if (detection.metadata.method === 'ocr_verified') {
      score += 0.1; // Consensus entre Roboflow y OCR
    } else if (detection.metadata.method === 'ocr_corrected') {
      score += 0.05; // OCR corrigió Roboflow
    }

    return Math.min(1.0, score);
  }

  /**
   * Intentar corregir una detección usando razonamiento probabilístico
   */
  private async attemptProbabilisticCorrection(
    detection: EnhancedDetection,
  ): Promise<EnhancedDetection | null> {
    // Estrategia 1: Si tenemos alternativas de OCR, probarlas
    if (detection.ocrResult?.alternatives) {
      for (const alt of detection.ocrResult.alternatives) {
        if (this.isValidBibNumber(alt)) {
          const corrected = {
            ...detection,
            bibNumber: alt,
            confidence: Math.min(1.0, detection.confidence + 0.1),
            ocrConfidence: Math.min(1.0, (detection.ocrConfidence || 0) + 0.1),
          };
          
          // Si el score mejoró significativamente, retornar
          if (this.calculateProbabilisticScore(corrected) > this.calculateProbabilisticScore(detection) + 0.2) {
            return corrected;
          }
        }
      }
    }

    // Estrategia 2: Intentar correcciones comunes de OCR
    const commonCorrections = this.getCommonOCRCorrections(detection.bibNumber);
    for (const corrected of commonCorrections) {
      if (this.isValidBibNumber(corrected)) {
        const correctedDetection = {
          ...detection,
          bibNumber: corrected,
          confidence: Math.min(1.0, detection.confidence + 0.05),
        };
        
        if (this.calculateProbabilisticScore(correctedDetection) > this.calculateProbabilisticScore(detection)) {
          return correctedDetection;
        }
      }
    }

    return null;
  }

  /**
   * Generar correcciones comunes de OCR para un número
   */
  private getCommonOCRCorrections(bibNumber: string): string[] {
    const corrections: string[] = [];
    
    // Correcciones comunes: intercambiar dígitos similares
    const similarDigits: Record<string, string[]> = {
      '0': ['O', 'o', 'D'],
      '1': ['I', 'l', '|'],
      '5': ['S', 's'],
      '6': ['G', 'g'],
      '8': ['B'],
      '2': ['Z', 'z'],
    };
    
    // Intentar reemplazar cada dígito con sus similares
    for (let i = 0; i < bibNumber.length; i++) {
      const digit = bibNumber[i];
      const similar = similarDigits[digit];
      if (similar) {
        for (const sim of similar) {
          // No tiene sentido reemplazar un dígito con una letra, pero podríamos
          // intentar el proceso inverso si el número contiene letras
        }
      }
    }
    
    // Correcciones de transposición (intercambiar dígitos adyacentes)
    for (let i = 0; i < bibNumber.length - 1; i++) {
      const chars = bibNumber.split('');
      [chars[i], chars[i + 1]] = [chars[i + 1], chars[i]];
      corrections.push(chars.join(''));
    }
    
    return corrections;
  }
}

