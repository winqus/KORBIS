import React, { useRef, useState } from "react";
import { ActivityIndicator, Button, Text, View } from "react-native";
import { CameraType, CameraView, useCameraPermissions } from "expo-camera";
import { CameraPermissionRequest } from "@/components/CameraPermissionRequest";
import { useRouter } from "expo-router";

export const ExpoItemCamera = () => {
  const camRef = useRef<CameraView>(null);
  const [camFacing] = useState<CameraType>("back");
  const [camPermission, requestPermission] = useCameraPermissions();
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

  return (
    <View className="flex-[1] justify-center">
      <CameraView
        ref={camRef}
        style={{ flex: 1 }}
        facing={camFacing}
      ></CameraView>
    </View>
  );
};
