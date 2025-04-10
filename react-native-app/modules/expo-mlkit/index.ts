// Reexport the native module. On web, it will be resolved to ExpoMLKitModule.web.ts
// and on native platforms to ExpoMLKitModule.ts
import TextRecognitionV2Module from "@/modules/expo-mlkit/src/TextRecognitionV2Module";
import ObjectDetectionTrackingModule from "@/modules/expo-mlkit/src/ObjectDetectionTrackingModule";
import ImageLabelerModule from "@/modules/expo-mlkit/src/ImageLabelerModule";
import SubjectSegmentationModule from "@/modules/expo-mlkit/src/SubjectSegmentationModule";

export { default } from "./src/ExpoMLKitModule";
export { default as TextRecognitionV2 } from "./src/TextRecognitionV2Module";
export { default as ObjectDetectionTracking } from "./src/ObjectDetectionTrackingModule";
export { default as ImageLabeler } from "./src/ImageLabelerModule";
export { default as SubjectSegmentation } from "./src/SubjectSegmentationModule";
export * from "./src/ObjectDetectionTrackingModule";
export * from "./src/ImageLabelerModule";
export * from "./src/SubjectSegmentationModule";
export { default as ExpoMLKitView } from "./src/ExpoMLKitView";
export * from "./src/ExpoMLKit.types";
export * from "./src/TextRecognitionV2.types";
export * from "./src/components/DebugMlkitRecognitionResponseRenderer";
export * from "./src/hooks/useImageLabeler";
export * from "./src/hooks/useSubjectSegmentation";
export * from "./src/hooks/useObjectTrackingDetection";

export const recognizeTextInImage =
  TextRecognitionV2Module.recognizeTextInImage;

export const detectObjectsInImage =
  ObjectDetectionTrackingModule.detectObjectsInImage;

export const labelImage = ImageLabelerModule.labelImage;

export const segmentSubjectsInImage =
  SubjectSegmentationModule.segmentSubjectsInImage;
