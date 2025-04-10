import { NativeModule, requireNativeModule } from "expo";

export interface ObjectDetectorOptions {
  shouldEnableClassification?: boolean; // Enable object classification
  shouldEnableMultipleObjects?: boolean; // Allow detection of multiple objects
  detectorMode?: "singleImage" | "stream"; // Detection mode
  /* Below are not used yet */
  classificationConfidenceThreshold?: number; // Minimum confidence for classification
  maxPerObjectLabelCount?: number; // Maximum number of labels per object
}

export interface ObjectDetectionResult {
  width: number;
  height: number;
  detectedObjects: {
    frame: {
      top: number;
      left: number;
      width: number;
      height: number;
    };
    labels: {
      text: string;
      confidence: number;
      index: number;
    }[];
    trackingID?: number;
  }[];
}

declare class ObjectDetectionTrackingModule extends NativeModule {
  initialize(options: ObjectDetectorOptions): Promise<boolean>;

  isInitialized(): boolean;

  detectObjectsInImage(uri: string): Promise<ObjectDetectionResult>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<ObjectDetectionTrackingModule>(
  "ObjectDetectionTrackingModule",
);
