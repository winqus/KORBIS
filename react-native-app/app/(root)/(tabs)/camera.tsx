import {
  View,
  Text,
  ActivityIndicator,
  Button,
  TouchableOpacity,
} from "react-native";
import React, { useRef, useState } from "react";
import { CameraType, CameraView, useCameraPermissions } from "expo-camera";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation, useRouter } from "expo-router";
import { mostRecentlyTakenPictureUri } from "@/lib/signals";

const Camera = () => {
  const cameraRef = useRef<CameraView>(null);
  const [facing] = useState<CameraType>("back");
  const [permission, requestPermission] = useCameraPermissions();
  const navigation = useNavigation();
  const router = useRouter();

  if (!permission) {
    // Camera permissions are still loading.
    return <ActivityIndicator size="large" className="text-primary-300 mt-5" />;
  }

  if (!permission.granted) {
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
      quality: 0.5,
      exif: false,
      shutterSound: false,
    });

    mostRecentlyTakenPictureUri.value = response?.uri ?? "";
    router.push("/item-creation");
  };

  return (
    <View className="flex-[1] justify-center">
      <CameraView ref={cameraRef} style={{ flex: 1 }} facing={facing}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="absolute top-2 left-2"
        >
          <Ionicons
            name="chevron-back-circle-outline"
            size={36}
            color="#fff8"
          />
        </TouchableOpacity>
        <View className="flex-[1] flex-row bg-transparent m-16">
          <TouchableOpacity
            className="flex-[1] self-end items-center"
            onPress={handleTakePicture}
          >
            <FontAwesome name="circle-thin" size={96} color="#fffc" />
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
};

export default Camera;
