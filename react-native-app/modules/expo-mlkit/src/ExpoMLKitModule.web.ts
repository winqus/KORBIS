import { registerWebModule, NativeModule } from "expo";

import { ChangeEventPayload } from "./ExpoMLKit.types";

type ExpoMLKitModuleEvents = {
  onChange: (params: ChangeEventPayload) => void;
};

class ExpoMLKitModule extends NativeModule<ExpoMLKitModuleEvents> {
  PI = Math.PI;

  async setValueAsync(value: string): Promise<void> {
    this.emit("onChange", { value });
  }

  hello() {
    return "Hello world! 👋";
  }
}

export default registerWebModule(ExpoMLKitModule);
