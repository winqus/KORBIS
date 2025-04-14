import {
  Image,
  ImageSourcePropType,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import icons from "@/constants/icons";
import React from "react";
import { FontAwesome5 } from "@expo/vector-icons";
import { Ionicons } from "@expo/vector-icons";

export const DocumentPill = ({
  label,
  icon,
  iconClass,
  onPress,
  onDelete,
  isDownloaded = true,
}: {
  label: string;
  icon?: ImageSourcePropType;
  iconClass?: string;
  onPress?: () => void;
  onDelete?: () => void;
  isDownloaded?: boolean;
}) => (
  <View className="flex flex-row items-center w-full justify-between">
    <TouchableOpacity
      onPress={onPress}
      className="flex flex-row items-center px-1.5 py-1 gap-2 bg-primary-100 rounded-md flex-1"
    >
      <View className="flex items-center justify-center">
        {isDownloaded ? (
          <Image
            source={icon ?? icons.document}
            className={`size-6 ${iconClass || ""}`}
            tintColor="#0061ff"
          />
        ) : (
          <Ionicons name="cloud-outline" size={20} color="#0061ff" />
        )}
      </View>
      <Text
        className="text-sm font-rubik-medium text-primary-300 flex-1"
        numberOfLines={1}
      >
        {label}
      </Text>
    </TouchableOpacity>
    {onDelete && (
      <TouchableOpacity onPress={onDelete} className="ml-2 p-2">
        <FontAwesome5 name="trash-alt" size={14} color="#FF0000" />
      </TouchableOpacity>
    )}
  </View>
);
