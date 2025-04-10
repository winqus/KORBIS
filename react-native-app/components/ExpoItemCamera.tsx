import React, { useRef, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { CameraType, CameraView, useCameraPermissions } from "expo-camera";
import { CameraPermissionRequest } from "@/components/CameraPermissionRequest";
import { useRouter } from "expo-router";
import { GuidanceHoverText } from "@/components/GuidanceHoverText";
import {
  BottomSectionItemCameraControls,
  CameraItemOption,
} from "@/components/ItemCameraControls";

export const ExpoItemCamera = () => {
  const camRef = useRef<CameraView>(null);
  const [camFacing, setCamFacing] = useState<CameraType>("back");
  const [camPermission, requestPermission] = useCameraPermissions();
  const [activeOption, setActiveOption] = useState<CameraItemOption>("add");
  const router = useRouter();

  if (!camPermission) {
    // Camera permissions are still loading.
    return <ActivityIndicator size="large" className="text-primary-300 mt-5" />;
  }

  if (!camPermission.granted) {
    return (
      <CameraPermissionRequest
        requestPermission={requestPermission}
        onCancel={() => router.back()}
      />
    );
  }

  const toggleCameraFacing = () => {
    setCamFacing((current) => (current === "back" ? "front" : "back"));
  };

  const takePicture = async () => {
    console.log("takePicture");
  };

  return (
    <View className="flex-[1] justify-center">
      <CameraView ref={camRef} style={{ flex: 1 }} facing={camFacing}>
        {/* Guidance text at the top */}
        <GuidanceHoverText
          text={
            activeOption === "add"
              ? "Take a picture to add your item"
              : "Take a picture to find a match"
          }
        />

        {/* Bottom control section */}
        <BottomSectionItemCameraControls
          activeOption={activeOption}
          onChangeOption={(option) => setActiveOption(option)}
          onPressFlip={toggleCameraFacing}
          onPressCapture={takePicture}
        />
      </CameraView>
    </View>
  );
};
