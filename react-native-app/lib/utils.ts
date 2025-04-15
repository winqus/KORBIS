import * as FileSystem from "expo-file-system";
import {
  Frame,
  ObjectDetectionResult,
  SubjectSegmentationResult,
} from "@/modules/expo-mlkit";
import * as ImageManipulator from "expo-image-manipulator";
import * as Crypto from "expo-crypto";

export function throwIfMissing(
  subject: string,
  obj: Record<string, any>,
  keys: string[],
) {
  const missing = [];
  for (let key of keys) {
    if (!(key in obj) || !obj[key]) {
      missing.push(key);
    }
  }
  if (missing.length > 0) {
    throw new Error(`Missing required ${subject}: ${missing.join(", ")}`);
  }
}

export function duplicateElements<T extends Record<string, any>>(
  arr: T[],
  numberOfRepetitions: number,
  keyPropertyName: keyof T,
): T[] {
  return arr
    .flatMap((element) =>
      Array.from({ length: numberOfRepetitions }, () => element),
    )
    .map((element, index) => ({
      ...element,
      [keyPropertyName]: `${element[keyPropertyName]}-${index}`,
    }));
}

export async function getPictureBase64FromLocalUri(pictureUri: string) {
  if (!pictureUri) {
    return null;
  }

  return await FileSystem.readAsStringAsync(pictureUri, {
    encoding: "base64",
  });
}

export const expandFrameIfPossible = (
  frame: Frame,
  multiplier: number,
  inputImageWidth: number,
  inputImageHeight: number,
): { frame: Frame; wasExpanded: boolean } => {
  const { left, top, width, height } = frame;
  if (!multiplier || multiplier <= 1) {
    return { frame, wasExpanded: false };
  }
  const centerX = left + width / 2;
  const centerY = top + height / 2;
  const newWidth = width * multiplier;
  const newHeight = height * multiplier;
  const expandedLeft = centerX - newWidth / 2;
  const expandedTop = centerY - newHeight / 2;
  if (
    expandedLeft >= 0 &&
    expandedTop >= 0 &&
    expandedLeft + newWidth <= inputImageWidth &&
    expandedTop + newHeight <= inputImageHeight
  ) {
    return {
      frame: {
        left: Math.round(expandedLeft),
        top: Math.round(expandedTop),
        width: Math.round(newWidth),
        height: Math.round(newHeight),
      },
      wasExpanded: true,
    };
  }
  return { frame, wasExpanded: false };
};
export const frameToSquareIfPossible = (
  frame: Frame,
  inputImageWidth: number,
  inputImageHeight: number,
): { frame: Frame; wasSquared: boolean } => {
  const { left, top, width, height } = frame;
  const centerX = left + width / 2;
  const centerY = top + height / 2;
  const squareSize = Math.max(width, height);
  const squareLeft = centerX - squareSize / 2;
  const squareTop = centerY - squareSize / 2;
  if (
    squareLeft >= 0 &&
    squareTop >= 0 &&
    squareLeft + squareSize <= inputImageWidth &&
    squareTop + squareSize <= inputImageHeight
  ) {
    return {
      frame: {
        left: Math.round(squareLeft),
        top: Math.round(squareTop),
        width: Math.round(squareSize),
        height: Math.round(squareSize),
      },
      wasSquared: true,
    };
  }
  return { frame, wasSquared: false };
};
export const cropImage = async (
  imageUri: string,
  frame: Frame,
): Promise<{ uri: string; width: number; height: number }> => {
  return await ImageManipulator.manipulateAsync(
    imageUri,
    [
      {
        crop: {
          originX: frame.left,
          originY: frame.top,
          width: frame.width,
          height: frame.height,
        },
      },
    ],
    {
      compress: 1,
      format: ImageManipulator.SaveFormat.PNG,
    },
  );
};
export const generateCroppedImages = async (
  frames: Frame[],
  image: { uri: string; width: number; height: number },
  options?: {
    cropAsSquare?: boolean;
    frameExpansionMultiplier?: number;
    log?: boolean;
  },
): Promise<
  {
    image: {
      uri: string;
      width: number;
      height: number;
    };
    frame: Frame;
  }[]
> => {
  const processedFrames: {
    image: {
      uri: string;
      width: number;
      height: number;
    };
    frame: Frame;
  }[] = [];
  const {
    cropAsSquare = true,
    frameExpansionMultiplier = 1.05,
    log,
  } = options || {};

  for (let i = 0; i < frames.length; i++) {
    let frame = frames[i];

    const { frame: expandedFrame, wasExpanded } = expandFrameIfPossible(
      frame,
      frameExpansionMultiplier,
      image.width,
      image.height,
    );

    if (wasExpanded && log) {
      console.log(
        `[Frame${i}] Expanded to ${expandedFrame.width}x${expandedFrame.height}`,
      );
    }

    frame = expandedFrame;

    if (cropAsSquare) {
      const { frame: squaredFrame, wasSquared } = frameToSquareIfPossible(
        frame,
        image.width,
        image.height,
      );
      if (wasSquared && log) {
        console.log(
          `[Frame${i}] Cropping as square ${squaredFrame.width}x${squaredFrame.height}`,
        );
      }
      frame = squaredFrame;
    }

    const cropped = await cropImage(image.uri, frame);

    if (log) {
      console.log(`[Frame${i}] Cropped to ${cropped.width}x${cropped.height}`);
    }

    processedFrames.push({ image: cropped, frame });
  }

  return processedFrames;
};

export const convertDetectionFramesToParentDomain = (
  result: ObjectDetectionResult,
  cropFrame: Frame,
): ObjectDetectionResult => {
  const scaleX = cropFrame.width / result.width;
  const scaleY = cropFrame.height / result.height;

  const convertedObjects = result.detectedObjects.map((obj) => {
    const { frame, ...rest } = obj;

    const convertedFrame = {
      top: cropFrame.top + frame.top * scaleY,
      left: cropFrame.left + frame.left * scaleX,
      width: frame.width * scaleX,
      height: frame.height * scaleY,
    };

    return {
      frame: convertedFrame,
      ...rest,
    };
  });

  return {
    width: cropFrame.width,
    height: cropFrame.height,
    detectedObjects: convertedObjects,
  };
};

export const randomUUIDv4 = () => {
  return Crypto.randomUUID();
};

export const VisualCode = {
  ALLOWED_CHARS: "347ACDEFHKMNPRTUVWXY",

  /* Format: KX-XXXX-C where C is the checksum
     Returns null if the format doesn't match */
  parseCode: (
    code: string,
  ): { prefix: string; digits: string; checksum: string } | null => {
    /* Normalize the code: uppercase and remove spaces */
    code = code.toUpperCase().replace(/\s/g, "");

    /* Check if the code follows the pattern KX-XXXX-C */
    const match = code.match(/^([A-Z]{2})-([A-Z0-9]{4})-([A-Z0-9])$/);

    if (!match) return null;

    return {
      prefix: match[1],
      digits: match[2],
      checksum: match[3],
    };
  },

  generateChecksum: (prefix: string, digits: string): string => {
    const combined = prefix + digits;
    let sum = 0;

    for (let i = 0; i < combined.length; i++) {
      const char = combined[i];
      const pos = VisualCode.ALLOWED_CHARS.indexOf(char);
      if (pos >= 0) {
        sum += pos * (i + 1); /* Weight by position */
      }
    }

    /* Get the checksum character */
    return VisualCode.ALLOWED_CHARS[sum % VisualCode.ALLOWED_CHARS.length];
  },

  validate: (code: string): boolean => {
    const parsed = VisualCode.parseCode(code);
    if (!parsed) return false;

    const expected = VisualCode.generateChecksum(parsed.prefix, parsed.digits);
    return parsed.checksum === expected;
  },

  generate: (prefix = "KX", digits?: string): string => {
    if (!digits) {
      digits = "";
      for (let i = 0; i < 4; i++) {
        const randomIndex = Math.floor(
          Math.random() * VisualCode.ALLOWED_CHARS.length,
        );
        digits += VisualCode.ALLOWED_CHARS[randomIndex];
      }
    }

    const checksum = VisualCode.generateChecksum(prefix, digits);
    return `${prefix}-${digits}-${checksum}`;
  },

  correctCode: (code: string): string | null => {
    const normalized = code.toUpperCase().replace(/\s/g, "");

    const ocrCorrected = normalized
      .replace(/O/g, "0")
      .replace(/I/g, "1")
      .replace(/Z/g, "2")
      .replace(/S/g, "5");

    const match = ocrCorrected.match(
      /^([A-Z]{2})[-_]?([A-Z0-9]{4})[-_]?([A-Z0-9])?$/,
    );

    if (!match) return null;

    const [_, prefix, digits, providedChecksum] = match;

    const correctChecksum = VisualCode.generateChecksum(prefix, digits);

    return `${prefix}-${digits}-${correctChecksum}`;
  },

  findCodesInText: (
    text: string,
  ): {
    code: string;
    isValid: boolean;
    correctedCode: string | null;
  }[] => {
    const results: {
      code: string;
      isValid: boolean;
      correctedCode: string | null;
    }[] = [];

    const normalized = text.toUpperCase().replace(/\s+/g, "");

    const codePattern = /(KX)[-_]([A-Z0-9]{4})[-_]([A-Z0-9])/g;

    let match;
    while ((match = codePattern.exec(normalized)) !== null) {
      const extractedCode = `${match[1]}-${match[2]}-${match[3]}`;
      const isValid = VisualCode.validate(extractedCode);

      results.push({
        code: extractedCode,
        isValid,
        correctedCode: isValid ? null : VisualCode.correctCode(extractedCode),
      });
    }

    return results;
  },
};
