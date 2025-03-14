import { View, ScrollView, TouchableOpacity } from "react-native";
import React, { useState } from "react";
import { mostRecentlyTakenPictureUri } from "@/lib/signals";
import icons from "@/constants/icons";
import IconButton from "@/components/IconButton";
import PrimaryButton from "@/components/PrimaryButton";
import StaticFooterMenu from "@/components/StaticFooterMenu";
import SquareGallery from "@/components/SquareGallery";
import GenerativeInputField from "@/components/GenerativeInputField";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation } from "expo-router";

const ItemCreation = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [canAdd, setCanAdd] = useState(false);
  const uri = mostRecentlyTakenPictureUri.value || "";
  const navigation = useNavigation();

  const [form, setForm] = useState({
    name: "",
    description: "",
  });

  const onCancel = () => {
    navigation.goBack();
    mostRecentlyTakenPictureUri.value = "";
  };

  return (
    <View className="h-full bg-white">
      <TouchableOpacity
        onPress={onCancel}
        className="absolute top-2 left-2 z-10"
      >
        <Ionicons name="close-circle-outline" size={36} color="#D9D9D9" />
      </TouchableOpacity>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-40"
      >
        <SquareGallery uri={uri} />
        <View>
          <GenerativeInputField
            label="Name"
            placeholder="Enter the name"
            value={form.name}
            icon={isGenerating ? icons.shines : undefined}
            onChange={(value) => setForm({ ...form, name: value })}
            onClear={() => setForm({ ...form, name: "" })}
            isLoading={isGenerating}
          />
          <GenerativeInputField
            label="Description"
            placeholder="Enter the description"
            value={form.description}
            icon={isGenerating ? icons.shines : undefined}
            onChange={(value) => setForm({ ...form, description: value })}
            onClear={() => setForm({ ...form, description: "" })}
            isLoading={isGenerating}
          />
          <View className="h-40"></View>
        </View>
      </ScrollView>
      <StaticFooterMenu>
        <View className="items-start w-full">
          <IconButton
            onPress={() => {
              setIsGenerating(true);
            }}
            icon={icons.shines}
            label="Generate"
            disabled={isGenerating}
          />
        </View>
        <PrimaryButton onPress={() => {}} label="Add" disabled={!canAdd} />
      </StaticFooterMenu>
    </View>
  );
};
export default ItemCreation;
