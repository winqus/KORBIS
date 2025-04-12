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
import { mostRecentlyTakenPictureUri } from "../signals/other";

export const CameraOld = () => {
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

    console.log(`Image size: ${response?.width}x${response?.height}`);

    mostRecentlyTakenPictureUri.value = response?.uri ?? "";
  };

  const handleTakePictureAndAddItem = async () => {
    await handleTakePicture();

    router.push("/item-creation");
  };

  const handleTakeAndSearchImage = async () => {
    await handleTakePicture();
    const encodedUri = encodeURIComponent(mostRecentlyTakenPictureUri.value);

    router.replace({
      pathname: "/",
      params: {
        queryText: "",
        queryImageUri: encodedUri,
      },
    });
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
        <View className="flex-[1] flex-row justify-center gap-4 bg-transparent mx-8 mb-16">
          <TouchableOpacity
            className="flex self-end items-center justify-center w-40"
            onPress={handleTakeAndSearchImage}
          >
            <Ionicons
              name="search"
              size={64}
              color="#fffc"
              className="absolute self-center -scale-x-100"
            />
            <FontAwesome name="circle-thin" size={128} color="#fffc" />
          </TouchableOpacity>
          <TouchableOpacity
            className="flex self-end items-center justify-center w-40"
            onPress={handleTakePictureAndAddItem}
          >
            <Ionicons
              name="add"
              size={64}
              color="#fffc"
              className="absolute self-center"
            />
            <FontAwesome name="circle-thin" size={128} color="#fffc" />
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
};
