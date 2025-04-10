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
import * as ImagePicker from "expo-image-picker";
import { ImageSource, useImage } from "expo-image";
import { PicturePreview } from "@/components/PicturePreview";

export const ExpoItemCamera = () => {
  const router = useRouter();
  const camRef = useRef<CameraView>(null);
  const [camFacing, setCamFacing] = useState<CameraType>("back");
  const [camPermission, requestPermission] = useCameraPermissions();
  const [activeOption, setActiveOption] = useState<CameraItemOption>("add");
  const [image, setImage] = useState<ImageSource | null>(null);

  if (!camPermission) {
    /* Camera permissions are still loading. */
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

  const handleToggleCameraFacing = () => {
    setCamFacing((current) => (current === "back" ? "front" : "back"));
  };

  const handleTakePicture = async () => {
    const response = await camRef.current?.takePictureAsync({
      quality: 0.5,
      exif: false,
      shutterSound: false,
    });

    if (response?.uri) {
      const uri = response.uri;
      setImage({ uri });
      console.log("Image captured:", uri);
    }
  };

  const handlePickImageFromGallery = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setImage({ uri });
      console.log("Image selected from gallery:", uri);
    }
  };

  if (image) {
    return (
      <PicturePreview
        mode="add"
        image={image}
        onCancel={() => setImage(null)}
        onAutoCreate={() => {}}
        onManualAdd={() => {}}
      />
    );
  }

  return (
    <View className="flex-[1] justify-center">
      <CameraView ref={camRef} style={{ flex: 1 }} facing={camFacing}>
        <GuidanceHoverText
          text={
            activeOption === "add"
              ? "Take a picture to add your item"
              : "Take a picture to find a match"
          }
        />

        <BottomSectionItemCameraControls
          activeOption={activeOption}
          onChangeOption={(option) => setActiveOption(option)}
          onPressFlip={handleToggleCameraFacing}
          onPressCapture={handleTakePicture}
          onPressGallery={handlePickImageFromGallery}
        />
      </CameraView>
    </View>
  );
};
