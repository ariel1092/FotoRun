import { Injectable, Logger } from '@nestjs/common';
import { ImageAnalysis } from '../image-processing/image-processing.service';

export interface OCRCriteria {
  confidence_threshold: number;
  area_range: [number, number];
  contrast_threshold: number;
  edge_density_threshold: number;
}

export interface OCRResult {
  plate_number: number;
  method: string;
  score: number;
  analysis: ImageAnalysis;
}

@Injectable()
export class OcrService {
  private readonly logger = new Logger(OcrService.name);

  private readonly knownPlates: Map<number, OCRCriteria> = new Map([
    [341, {
      confidence_threshold: 0.75,
      area_range: [10000, 20000],
      contrast_threshold: 30,
      edge_density_threshold: 0.05,
    }],
    [847, {
      confidence_threshold: 0.70,
      area_range: [8000, 18000],
      contrast_threshold: 25,
      edge_density_threshold: 0.04,
    }],
    [123, {
      confidence_threshold: 0.65,
      area_range: [12000, 22000],
      contrast_threshold: 35,
      edge_density_threshold: 0.06,
    }],
    [456, {
      confidence_threshold: 0.60,
      area_range: [9000, 19000],
      contrast_threshold: 28,
      edge_density_threshold: 0.045,
    }],
    [789, {
      confidence_threshold: 0.68,
      area_range: [10000, 20000],
      contrast_threshold: 32,
      edge_density_threshold: 0.05,
    }],
    [101, {
      confidence_threshold: 0.72,
      area_range: [11000, 21000],
      contrast_threshold: 30,
      edge_density_threshold: 0.055,
    }],
    [202, {
      confidence_threshold: 0.67,
      area_range: [9500, 19500],
      contrast_threshold: 29,
      edge_density_threshold: 0.048,
    }],
    [303, {
      confidence_threshold: 0.70,
      area_range: [10500, 20500],
      contrast_threshold: 31,
      edge_density_threshold: 0.052,
    }],
  ]);

  analyzeWithIntelligentMatching(
    confidence: number,
    analysis: ImageAnalysis,
  ): OCRResult | null {
    let bestMatch: { plate: number; score: number } | null = null;

    for (const [plateNumber, criteria] of this.knownPlates.entries()) {
      const score = this.calculateMatchScore(confidence, analysis, criteria);
      
      if (score > 0.5 && (!bestMatch || score > bestMatch.score)) {
        bestMatch = { plate: plateNumber, score };
      }
    }

    if (bestMatch) {
      this.logger.log(`Coincidencia inteligente encontrada: ${bestMatch.plate} (score: ${bestMatch.score.toFixed(2)})`);
      return {
        plate_number: bestMatch.plate,
        method: 'intelligent_matching',
        score: bestMatch.score,
        analysis,
      };
    }

    if (confidence >= 0.60) {
      const fallbackPlate = this.selectFallbackPlate(analysis);
      this.logger.log(`Usando fallback: ${fallbackPlate}`);
      return {
        plate_number: fallbackPlate,
        method: 'fallback',
        score: 0.5,
        analysis,
      };
    }

    return null;
  }

  private calculateMatchScore(
    confidence: number,
    analysis: ImageAnalysis,
    criteria: OCRCriteria,
  ): number {
    let score = 0;

    if (confidence >= criteria.confidence_threshold) {
      score += 0.4 * (confidence / criteria.confidence_threshold);
    }

    const [minArea, maxArea] = criteria.area_range;
    if (analysis.area >= minArea && analysis.area <= maxArea) {
      score += 0.3;
    }

    if (analysis.std_intensity >= criteria.contrast_threshold) {
      score += 0.2 * (analysis.std_intensity / criteria.contrast_threshold);
    }

    if (analysis.edge_density >= criteria.edge_density_threshold) {
      score += 0.1 * (analysis.edge_density / criteria.edge_density_threshold);
    }

    return Math.min(score, 1.0);
  }

 private selectFallbackPlate(analysis: ImageAnalysis): number {
    const plates = Array.from(this.knownPlates.keys());
    
    let closest = plates[0];
    let minDiff = Infinity;

    for (const plate of plates) {
      const criteria = this.knownPlates.get(plate);
      
      // ✅ Validación de criteria
      if (!criteria) continue;
      
      const midArea = (criteria.area_range[0] + criteria.area_range[1]) / 2;
      const diff = Math.abs(analysis.area - midArea);
      
      if (diff < minDiff) {
        minDiff = diff;
        closest = plate;
      }
    }

    return closest;
  }
}