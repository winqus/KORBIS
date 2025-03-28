import { Text, View } from "react-native";
import React from "react";

export const TagPill = ({ label }: { label: string }) => (
  <View className="flex flex-row items-center justify-center px-2.5 py-1.5 bg-primary-100 rounded-full">
    <Text className="text-xs font-rubik-bold text-primary-300">{label}</Text>
  </View>
);
