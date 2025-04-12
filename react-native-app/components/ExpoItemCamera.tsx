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
import { ImageType } from "@/types";

type ExpoItemCameraProps = {
  onPhotoTaken: (photo: ImageType) => void;
  onActiveOptionChange: (option: CameraItemOption) => void;
  initialMode?: CameraItemOption;
  debug?: boolean;
};

export const ExpoItemCamera = (props: ExpoItemCameraProps) => {
  const {
    onPhotoTaken,
    onActiveOptionChange,
    initialMode = "add",
    debug = false,
  } = props;
  const router = useRouter();
  const camRef = useRef<CameraView>(null);
  const [camFacing, setCamFacing] = useState<CameraType>("back");
  const [camPermission, requestPermission] = useCameraPermissions();
  const [activeOption, setActiveOption] =
    useState<CameraItemOption>(initialMode);

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
      const image = response;
      if (debug) {
        console.log("[ExpoItemCamera] Image captured:", image.uri);
      }

      onPhotoTaken({
        uri: image.uri,
        width: image.width,
        height: image.height,
      });
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
      const image = result.assets[0];
      if (debug) {
        console.log("[ExpoItemCamera] Image selected from gallery:", image.uri);
      }

      onPhotoTaken({
        uri: image.uri,
        width: image.width,
        height: image.height,
      });
    }
  };

  const handleActiveOptionChange = (option: CameraItemOption) => {
    setActiveOption(option);
    onActiveOptionChange(option);
  };

  return (
    <View className="flex-[1] justify-center">
      <CameraView ref={camRef} style={{ flex: 1 }} facing={camFacing}>
        <GuidanceHoverText
          text={
            activeOption === "add"
              ? "Take a picture to add your item"
              : "Take a picture to find a match"
          }
          top={36}
        />

        <BottomSectionItemCameraControls
          activeOption={activeOption}
          onChangeOption={handleActiveOptionChange}
          onPressFlip={handleToggleCameraFacing}
          onPressCapture={handleTakePicture}
          onPressGallery={handlePickImageFromGallery}
        />
      </CameraView>
    </View>
  );
};
