import { NativeModule, requireNativeModule } from "expo";
import { TextRecognitionResult } from "./TextRecognitionV2.types";

declare class TextRecognitionV2Module extends NativeModule {
  recognizeTextInImage(uri: string): Promise<TextRecognitionResult>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<TextRecognitionV2Module>(
  "TextRecognitionV2Module",
);
