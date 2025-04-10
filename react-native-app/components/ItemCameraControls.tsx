import { Text, TouchableOpacity, View } from "react-native";
import React from "react";
import Ionicons from "@expo/vector-icons/Ionicons";

export type CameraItemOption = "add" | "find";

export const BottomSectionItemCameraControls = (props: {
  activeOption: CameraItemOption;
  onPressFlip?: () => void;
  onPressCapture: () => Promise<void>;
  onPressGallery?: () => void;
  onChangeOption: (option: CameraItemOption) => void;
}) => {
  const {
    activeOption,
    onPressFlip,
    onPressCapture,
    onPressGallery,
    onChangeOption,
  } = props;

  return (
    <View className="absolute bottom-10 left-0 right-0">
      <CameraControlsRow
        onPressFlip={onPressFlip}
        onPressCapture={onPressCapture}
        onPressGallery={onPressGallery}
      />

      <AddFindOptionsSegment
        addText="Add"
        findText="Find"
        onPressAdd={() => onChangeOption("add")}
        activeOption={activeOption}
        onPressFind={() => onChangeOption("find")}
        containerClassName="mt-10"
      />
    </View>
  );
};

export const AddFindOptionsSegment = (props: {
  addText?: string;
  findText?: string;
  onPressAdd: () => void;
  onPressFind: () => void;
  activeOption: CameraItemOption;
  containerClassName?: string;
}) => {
  const {
    addText,
    findText,
    onPressAdd,
    onPressFind,
    activeOption,
    containerClassName,
  } = props;

  return (
    <View className={`flex-row justify-center ${containerClassName || "mb-6"}`}>
      <View className="flex-row bg-black/20 rounded-full overflow-hidden">
        <TouchableOpacity
          onPress={onPressAdd}
          className={`px-8 py-2 ${
            activeOption === "add" ? "bg-white" : "bg-transparent"
          }`}
        >
          <Text
            className={`font-medium ${
              activeOption === "add" ? "text-black" : "text-white"
            }`}
          >
            {addText || "Add"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onPressFind}
          className={`px-8 py-2 ${
            activeOption === "find" ? "bg-white" : "bg-transparent"
          }`}
        >
          <Text
            className={`font-medium ${
              activeOption === "find" ? "text-black" : "text-white"
            }`}
          >
            {findText || "Find"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export const CameraControlsRow = (props: {
  onPressFlip?: () => void;
  onPressCapture: () => void;
  onPressGallery?: () => void;
  containerClassName?: string;
}) => {
  const { onPressFlip, onPressCapture, onPressGallery, containerClassName } =
    props;

  return (
    <View
      className={`h-24 flex-row justify-center items-center ${containerClassName || ""}`}
    >
      {/* Camera flip button (left side) */}
      {onPressFlip && (
        <TouchableOpacity onPress={onPressFlip} className="absolute left-10">
          <Ionicons name="camera-reverse-outline" size={28} color="white" />
        </TouchableOpacity>
      )}

      {/* Capture button (center) */}
      <TouchableOpacity
        onPress={onPressCapture}
        className="size-20 rounded-full bg-white border-2 border-gray-300 items-center justify-center"
        style={{ elevation: 3 }} /* for Android shadow */
      >
        <View className="size-16 rounded-full bg-white" />
      </TouchableOpacity>

      {/* Gallery selection button (right side) */}
      {onPressGallery && (
        <TouchableOpacity
          onPress={onPressGallery}
          className="absolute right-10 p-2 rounded-lg"
        >
          <Ionicons name="images-outline" size={28} color="white" />
        </TouchableOpacity>
      )}
    </View>
  );
};
