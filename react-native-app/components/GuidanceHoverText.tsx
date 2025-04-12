import { Text, TouchableWithoutFeedback, View } from "react-native";
import React, { useEffect, useState } from "react";

type GuidanceHoverTextProps = {
  text: string;
  top?: number;
  containerClassName?: string;
  textContainerClassName?: string;
  textClassName?: string;
};

export const GuidanceHoverText = ({
  text,
  top = 56,
  containerClassName,
  textContainerClassName,
  textClassName,
}: GuidanceHoverTextProps) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setVisible(true); // Reset visibility when component mounts
  }, []);

  if (!visible) return null;

  return (
    <TouchableWithoutFeedback onPress={() => setVisible(false)}>
      <View
        className={`absolute z-10 w-full flex items-center ${containerClassName || ""}`}
        style={{ top }}
      >
        <View
          className={`bg-black/30 px-6 py-2 rounded-full ${textContainerClassName || ""}`}
        >
          <Text
            className={`text-white text-center font-rubik-medium ${textClassName || ""}`}
          >
            {text}
          </Text>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
};
