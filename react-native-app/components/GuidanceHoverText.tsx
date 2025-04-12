import { Text, View } from "react-native";
import React from "react";

export const GuidanceHoverText = ({
  text,
  containerClassName,
  textContainerClassName,
  textClassName,
}: {
  text: string;
  containerClassName?: string;
  textContainerClassName?: string;
  textClassName?: string;
}) => {
  return (
    <View
      className={`absolute top-12 left-0 right-0 items-center z-10 ${containerClassName || ""}`}
    >
      <View
        className={`bg-black/50 px-6 py-2 rounded-full ${textContainerClassName || ""}`}
      >
        <Text
          className={`text-white text-center font-rubik-medium ${textClassName || ""}`}
        >
          {text}
        </Text>
      </View>
    </View>
  );
};
