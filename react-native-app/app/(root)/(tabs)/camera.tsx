import {
  View,
  Text,
  ActivityIndicator,
  Button,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import React, { useRef, useState } from "react";
import { CameraType, CameraView, useCameraPermissions } from "expo-camera";
import FontAwesome from "@expo/vector-icons/FontAwesome";

const Camera = () => {
  const cameraRef = useRef<CameraView>(null);
  const [facing, setFacing] = useState<CameraType>("back");
  const [permission, requestPermission] = useCameraPermissions();
  const [picture, setPicture] = useState<string>("");

  if (!permission) {
    // Camera permissions are still loading.
    return <ActivityIndicator size="large" className="text-primary-300 mt-5" />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet.
    return (
      <View className="flex-[1] justify-center">
        <Text className="text-center pb-2.5">
          We need your permission to show the camera
        </Text>
        <Button onPress={requestPermission} title="grant permission" />
      </View>
    );
  }

  const handleTakePicture = async () => {
    const response = await cameraRef.current?.takePictureAsync({
      exif: false,
      shutterSound: false,
    });
    console.log("pic uri", response?.uri); // TODO remove
    setPicture(response?.uri ?? "");
  };

  function toggleCameraFacing() {
    setFacing((current) => (current === "back" ? "front" : "back"));
  }

  return (
    <View className="flex-[1] justify-center">
      <CameraView ref={cameraRef} style={{ flex: 1 }} facing={facing}>
        <View className="flex-[1] flex-row bg-transparent m-16">
          <TouchableOpacity
            className="flex-[1] self-end items-center"
            onPress={handleTakePicture}
          >
            <FontAwesome name="circle-thin" size={96} color="white" />
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
};
export default Camera;
