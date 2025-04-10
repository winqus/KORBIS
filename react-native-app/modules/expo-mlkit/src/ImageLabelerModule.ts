import { NativeModule, requireNativeModule } from "expo";

export type ImageLabel = {
  text: string;
  index: number;
  confidence: number;
};

export type ImageLabelingResult = ImageLabel[];

export type ImageLabelerOptions = {
  confidenceThreshold?: number;
};

declare class ImageLabelerModule extends NativeModule {
  initialize(options: ImageLabelerOptions): Promise<boolean>;

  isInitialized(): boolean;

  labelImage(uri: string): Promise<ImageLabelingResult>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<ImageLabelerModule>("ImageLabelerModule");
