import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as fs from 'fs';

export interface RoboflowDetection {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  class: string;
  class_id: number;
  detection_id: string;
}

export interface RoboflowResponse {
  time: number;
  image: {
    width: number;
    height: number;
  };
  predictions: RoboflowDetection[];
}

@Injectable()
export class RoboflowService {
  private readonly logger = new Logger(RoboflowService.name);
  private readonly apiKey: string;
  private readonly apiUrl: string;

  constructor(private readonly configService: ConfigService) {
   const apiKey = this.configService.get<string>('ROBOFLOW_API_KEY');
const apiUrl = this.configService.get<string>('ROBOFLOW_URL');

if (!apiKey || !apiUrl) {
  throw new Error(
    'ROBOFLOW_API_KEY and ROBOFLOW_URL must be defined in .env',
  );
}

this.apiKey = apiKey;
this.apiUrl = apiUrl;
  }

  /**
   * Detecta dorsales en una imagen local (ruta de archivo)
   */
  async detectBibsFromFile(filePath: string): Promise<RoboflowResponse> {
    try {
      this.logger.log(`Detecting bibs in file: ${filePath}`);

      // Leer la imagen como base64
      const imageBase64 = fs.readFileSync(filePath, {
        encoding: 'base64',
      });

      return await this.detectBibsFromBase64(imageBase64);
    } catch (error) {
      this.logger.error(`Error detecting bibs from file: ${error.message}`);
      throw error;
    }
  }

  /**
   * Detecta dorsales en una imagen en base64
   */
  async detectBibsFromBase64(
    imageBase64: string,
  ): Promise<RoboflowResponse> {
    try {
      this.logger.log('Sending image to Roboflow API');

      const response = await axios({
        method: 'POST',
        url: this.apiUrl,
        params: {
          api_key: this.apiKey,
        },
        data: imageBase64,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      this.logger.log(
        `Roboflow API response: ${response.data.predictions.length} detections`,
      );

      return response.data as RoboflowResponse;
    } catch (error) {
      this.logger.error(`Error calling Roboflow API: ${error.message}`);
      throw error;
    }
  }

  /**
   * Detecta dorsales en una imagen desde URL
   */
  async detectBibsFromUrl(imageUrl: string): Promise<RoboflowResponse> {
    try {
      this.logger.log(`Detecting bibs from URL: ${imageUrl}`);

      const response = await axios({
        method: 'POST',
        url: this.apiUrl,
        params: {
          api_key: this.apiKey,
          image: imageUrl,
        },
      });

      this.logger.log(
        `Roboflow API response: ${response.data.predictions.length} detections`,
      );

      return response.data as RoboflowResponse;
    } catch (error) {
      this.logger.error(
        `Error detecting bibs from URL: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Filtra detecciones por nivel de confianza mínimo
   */
  filterByConfidence(
    detections: RoboflowDetection[],
    minConfidence = 0.5,
  ): RoboflowDetection[] {
    return detections.filter(
      (detection) => detection.confidence >= minConfidence,
    );
  }

  /**
   * Extrae solo los números de dorsal detectados
   */
  extractBibNumbers(detections: RoboflowDetection[]): string[] {
    return detections.map((detection) => detection.class);
  }
}
