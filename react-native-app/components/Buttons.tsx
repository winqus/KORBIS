import { Text, TouchableOpacity, View } from "react-native";
import React from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import icons from "@/constants/icons";
import { Image } from "expo-image";

type AutoCreateButtonProps = {
  onPress: () => void;
  text: string;
  disabled?: boolean;
};

export const AutoCreateButton = ({
  onPress,
  text,
  disabled = false,
}: AutoCreateButtonProps) => (
  <TouchableOpacity
    onPress={onPress}
    className={`flex-row gap-2 py-4 rounded-full items-center justify-center mb-4 ${
      disabled ? "border border-black-200" : "bg-primary-300"
    }`}
    disabled={disabled}
  >
    <Image
      source={icons.shines}
      className="size-6"
      tintColor={`${disabled ? "#666876" : "white"}`}
      contentFit="contain"
    />
    <Text
      className={`${
        disabled ? "text-black-200" : "text-white"
      } font-semibold text-base`}
    >
      {text}
    </Text>
  </TouchableOpacity>
);

type ManualAddButtonProps = {
  onPress: () => void;
  text: string;
  disabled?: boolean;
};

export const ManualAddButton = ({
  onPress,
  text,
  disabled = false,
}: ManualAddButtonProps) => (
  <TouchableOpacity
    onPress={onPress}
    className="py-3 items-center m-auto px-6"
    disabled={disabled}
  >
    <Text className="text-white text-sm">{text}</Text>
  </TouchableOpacity>
);

type CloseButtonProps = {
  absolute?: boolean;
  onCancel: () => void;
};

export const CloseButton = ({ absolute, onCancel }: CloseButtonProps) => {
  const className = `p-2 ${absolute ? "" : "absolute top-12 left-4 z-10 p-2 bg-primary-200 rounded-full items-center justify-center size-12"}`;

  const button = (
    <TouchableOpacity onPress={onCancel} className={className}>
      <Ionicons name="close" size={28} color="white" />
    </TouchableOpacity>
  );

  return absolute ? <View className="pt-2 pl-4 pb-2">{button}</View> : button;
};

type OutlinedButtonProps = {
  text: string;
  onPress: () => void;
  disabled?: boolean;
  containerClassName?: string;
};

export const OutlinedButton = ({
  text,
  onPress,
  disabled = false,
  containerClassName = "",
}: OutlinedButtonProps) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={disabled}
    className={`py-4 px-6 rounded-full border items-center justify-center ${containerClassName} ${
      disabled ? "border-black-200" : "border-white"
    }`}
  >
    <Text
      className={`text-sm font-medium ${
        disabled ? "text-black-200" : "text-white"
      }`}
    >
      {text}
    </Text>
  </TouchableOpacity>
);
