import {
  Image,
  ImageSourcePropType,
  Text,
  TouchableOpacity,
} from "react-native";
import icons from "@/constants/icons";
import React from "react";

export const DocumentPill = ({
  label,
  icon,
  iconClass,
}: {
  label: string;
  icon?: ImageSourcePropType;
  iconClass?: string;
}) => (
  <TouchableOpacity className="flex flex-row items-center justify-center px-1.5 py-1 gap-2.5 bg-primary-100 rounded-md">
    <Image
      source={icon ?? icons.document}
      className={`size-6 ${iconClass || ""}`}
      tintColor="#0061ff"
    />
    <Text className="text-sm font-rubik-medium text-primary-300 line-clamp-1">
      {label}
    </Text>
  </TouchableOpacity>
);
