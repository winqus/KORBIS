import { View, Text, Image, TouchableOpacity } from "react-native";
import React from "react";
import Ionicons from "@expo/vector-icons/Ionicons";

interface PicturePreviewProps {
  pictureUri: string;
  onCancel: () => void;
  onSubmit: () => void;
  submitText?: string;
}

const PicturePreview = (props: PicturePreviewProps) => {
  const { pictureUri, onCancel, onSubmit, submitText = "Submit" } = props;

  if (!pictureUri) {
    throw new Error("Picture URL is missing");
  }

  return (
    <View>
      <Image source={{ uri: pictureUri }} className="w-full h-full" />
      <TouchableOpacity onPress={onCancel} className="absolute top-2 left-2">
        <Ionicons name="close-circle-outline" size={36} color="#fffc" />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={onSubmit}
        className="absolute bottom-11 w-full"
      >
        <Text className="text-3xl text-white font-rubik-bold text-center">
          {submitText}
        </Text>
      </TouchableOpacity>
    </View>
  );
};
export default PicturePreview;
