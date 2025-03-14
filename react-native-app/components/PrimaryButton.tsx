import { Text, TouchableOpacity } from "react-native";
import React from "react";

interface PrimaryButtonProps {
  onPress: () => void;
  label: string;
  containerClass?: string;
  labelClass?: string;
  disabled?: boolean;
}

const PrimaryButton = ({
  onPress,
  label,
  containerClass,
  labelClass,
  disabled,
}: PrimaryButtonProps) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`${disabled ? "bg-disabled" : "bg-primary-300"} flex-row justify-center items-center py-2.5 w-full rounded-full ${
        containerClass || ""
      }`}
      disabled={disabled}
    >
      <Text
        className={`font-rubik-medium text-3xl text-white ${labelClass || ""}`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

export default PrimaryButton;
