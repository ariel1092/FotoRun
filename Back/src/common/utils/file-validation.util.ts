/**
 * File validation utilities using magic numbers (file signatures)
 * This provides more reliable file type detection than MIME types alone
 */

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  detectedType?: string;
}

// Magic numbers for common image formats
const MAGIC_NUMBERS: Record<string, number[][]> = {
  jpeg: [
    [0xff, 0xd8, 0xff], // JPEG
  ],
  png: [
    [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], // PNG
  ],
  gif: [
    [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], // GIF87a
    [0x47, 0x49, 0x46, 0x38, 0x39, 0x61], // GIF89a
  ],
  webp: [
    [0x52, 0x49, 0x46, 0x46], // RIFF (WebP starts with RIFF)
  ],
};

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Check if buffer matches a magic number pattern
 */
function matchesMagicNumber(
  buffer: Buffer,
  pattern: number[],
): boolean {
  if (buffer.length < pattern.length) {
    return false;
  }

  for (let i = 0; i < pattern.length; i++) {
    if (buffer[i] !== pattern[i]) {
      return false;
    }
  }

  return true;
}

/**
 * Detect file type from magic number
 */
function detectFileType(buffer: Buffer): string | null {
  for (const [type, patterns] of Object.entries(MAGIC_NUMBERS)) {
    for (const pattern of patterns) {
      if (matchesMagicNumber(buffer, pattern)) {
        // Special handling for WebP (RIFF is just the start)
        if (type === 'webp') {
          // Check if it's actually WebP by looking for WEBP at offset 8
          if (
            buffer.length >= 12 &&
            buffer[8] === 0x57 &&
            buffer[9] === 0x45 &&
            buffer[10] === 0x42 &&
            buffer[11] === 0x50
          ) {
            return 'webp';
          }
          return null; // Not a WebP file
        }
        return type;
      }
    }
  }

  return null;
}

/**
 * Validate file using magic numbers and MIME type
 */
export function validateImageFile(
  file: Express.Multer.File,
): FileValidationResult {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    };
  }

  // Check MIME type
  if (!file.mimetype || !ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return {
      isValid: false,
      error: 'Invalid MIME type. Only JPEG, PNG, GIF, and WebP are allowed.',
    };
  }

  // Check magic number (file signature)
  const detectedType = detectFileType(file.buffer);

  if (!detectedType) {
    return {
      isValid: false,
      error: 'Invalid file type. File signature does not match expected image format.',
    };
  }

  // Verify MIME type matches detected type
  const expectedMimeTypes: Record<string, string[]> = {
    jpeg: ['image/jpeg', 'image/jpg'],
    png: ['image/png'],
    gif: ['image/gif'],
    webp: ['image/webp'],
  };

  const expectedMimes = expectedMimeTypes[detectedType];
  if (!expectedMimes || !expectedMimes.includes(file.mimetype)) {
    return {
      isValid: false,
      error: `MIME type mismatch. Detected ${detectedType} but received ${file.mimetype}`,
    };
  }

  return {
    isValid: true,
    detectedType,
  };
}

/**
 * Validate multiple files
 */
export function validateImageFiles(
  files: Express.Multer.File[],
): FileValidationResult[] {
  return files.map((file) => validateImageFile(file));
}

