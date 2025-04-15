import React from "react";
import { Text } from "react-native";
import GenerativeInputField from "./GenerativeInputField";

interface AssetNameProps {
  name: string;
  isEditing: boolean;
  onNameChange?: (name: string) => void;
  onClear?: () => void;
}

export const AssetName = ({
  name,
  isEditing,
  onNameChange = () => {},
  onClear,
}: AssetNameProps) => {
  if (isEditing) {
    return (
      <GenerativeInputField
        placeholder="Give it a name"
        value={name}
        onChangeText={onNameChange}
        onClear={onClear}
        maxLength={50}
      />
    );
  }

  return (
    <Text className="text-2xl font-rubik-bold" selectable={true}>
      {name}
    </Text>
  );
};
