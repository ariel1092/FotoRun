export class BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class OCRAnalysis {
  mean_intensity: number;
  std_intensity: number;
  edge_density: number;
  area: number;
  method: string;
  score?: number;
}

export class DetectionResponseDto {
  plate_number: number;
  runner_name?: string;
  confidence: number;
  bbox: BoundingBox;
  area: number;
  proportion: number;
  ocr_analysis?: OCRAnalysis;
}