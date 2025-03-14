import { View, Text, TextInput, ScrollView } from "react-native";
import React, { useState } from "react";
import { mostRecentlyTakenPictureUri } from "@/lib/signals";
import icons from "@/constants/icons";
import IconButton from "@/components/IconButton";
import PrimaryButton from "@/components/PrimaryButton";
import StaticFooterMenu from "@/components/StaticFooterMenu";
import SquareGallery from "@/components/SquareGallery";

const ItemCreation = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [canAdd, setCanAdd] = useState(false);
  const uri = mostRecentlyTakenPictureUri.value || "";

  return (
    <View className="h-full bg-white">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-40"
      >
        <SquareGallery uri={uri} />
        <View>
          <View>
            <Text>Name</Text>
            <TextInput placeholder="What are you adding?" />
          </View>
          <View>
            <Text>Description</Text>
            <TextInput placeholder="What are you adding?" />
          </View>
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
