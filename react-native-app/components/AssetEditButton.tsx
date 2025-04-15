import React from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";

interface AssetEditButtonProps {
  isEditing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  isSaving: boolean;
}

export const AssetEditButton = ({
  isEditing,
  onEdit,
  onSave,
  onCancel,
  isSaving,
}: AssetEditButtonProps) => {
  if (isEditing) {
    return (
      <View className="flex flex-row items-center gap-2">
        <TouchableOpacity
          onPress={onCancel}
          className="flex flex-row items-center justify-center py-1.5 px-3 bg-gray-200 rounded-full"
        >
          <Text className="text-black-300 font-rubik-medium">Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onSave}
          disabled={isSaving}
          className="flex flex-row items-center justify-center py-1.5 px-3 bg-primary-500 rounded-full"
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text className="text-white font-rubik-medium">Save</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <TouchableOpacity
      onPress={onEdit}
      className="flex flex-row items-center justify-center py-1.5 px-3 bg-primary-500 rounded-full"
    >
      <Text className="text-white font-rubik-medium">Edit</Text>
    </TouchableOpacity>
  );
};
