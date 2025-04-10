import { NativeModule, requireNativeModule } from "expo";

export type SubjectSegmentationResult = {
  inputImageWidth: number;
  inputImageHeight: number;
  frames: {
    left: number;
    top: number;
    width: number;
    height: number;
  }[];
  mask: {
    fileUri: string;
    width: number;
    height: number;
  };
};

export type SubjectSegmentationOptions = {
  confidenceThreshold?: number;
};

declare class SubjectSegmentationModule extends NativeModule {
  initialize(options: SubjectSegmentationOptions): Promise<boolean>;

  isInitialized(): boolean;

  segmentSubjectsInImage(uri: string): Promise<SubjectSegmentationResult>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<SubjectSegmentationModule>(
  "SubjectSegmentationModule",
);
