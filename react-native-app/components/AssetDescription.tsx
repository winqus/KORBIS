import React from "react";
import { Text, View } from "react-native";
import GenerativeInputField from "./GenerativeInputField";

interface AssetDescriptionProps {
  description: string;
  isEditing: boolean;
  onDescriptionChange?: (description: string) => void;
  onClear?: () => void;
}

export const AssetDescription = ({
  description,
  isEditing,
  onDescriptionChange = () => {},
  onClear,
}: AssetDescriptionProps) => {
  return (
    <View
      testID="__asset-description__"
      className="flex flex-col items-start gap-3"
    >
      <Text className="text-black-300 text-xl font-rubik-bold">
        Description
      </Text>
      {isEditing ? (
        <GenerativeInputField
          placeholder="Describe the item"
          value={description}
          onChangeText={onDescriptionChange}
          onClear={onClear}
          multiline={true}
          scrollEnabled={true}
          maxLength={999}
          inputClass="text-black-200 text-base leading-5"
        />
      ) : (
        <Text className="text-black-200 text-base font-rubik" selectable={true}>
          {description || "No description available"}
        </Text>
      )}
    </View>
  );
};
