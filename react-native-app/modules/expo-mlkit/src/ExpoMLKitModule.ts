import { NativeModule, requireNativeModule } from "expo";

import { ExpoMLKitModuleEvents } from "./ExpoMLKit.types";

declare class ExpoMLKitModule extends NativeModule<ExpoMLKitModuleEvents> {
  PI: number;

  hello(): string;

  setValueAsync(value: string): Promise<void>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<ExpoMLKitModule>("ExpoMLKit");
