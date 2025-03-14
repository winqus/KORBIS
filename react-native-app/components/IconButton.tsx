import {
  Text,
  ImageSourcePropType,
  TouchableOpacity,
  Image,
} from "react-native";
import React from "react";

interface IconButtonProps {
  onPress: () => void;
  icon: ImageSourcePropType;
  label: string;
  containerClass?: string;
  iconClass?: string;
  labelClass?: string;
  disabled?: boolean;
}

const IconButton = ({
  onPress,
  icon,
  label,
  containerClass,
  iconClass,
  labelClass,
  disabled,
}: IconButtonProps) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`${disabled ? "bg-disabled" : "bg-black"} flex-row justify-center items-center py-1.5 px-4 gap-1.5 rounded-full h-9 ${
        containerClass || ""
      }`}
      disabled={disabled}
    >
      <Image
        source={icon}
        className={`size-3.5 ${iconClass || ""}`}
        tintColor="white"
      />
      <Text
        className={`font-rubik-medium text-lg text-white ${labelClass || ""}`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};
export default IconButton;
