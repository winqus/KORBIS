import { requireNativeView } from "expo";
import * as React from "react";

import { ExpoMLKitViewProps } from "./ExpoMLKit.types";

const NativeView: React.ComponentType<ExpoMLKitViewProps> =
  requireNativeView("ExpoMLKit");

export default function ExpoMLKitView(props: ExpoMLKitViewProps) {
  return <NativeView {...props} />;
}
