import { Alert, ScrollView, TouchableOpacity, View } from "react-native";
import React, { useEffect, useState } from "react";
import { currentParentAsset, mostRecentlyTakenPictureUri } from "@/lib/signals";
import icons from "@/constants/icons";
import IconButton from "@/components/IconButton";
import PrimaryButton from "@/components/PrimaryButton";
import StaticFooterMenu from "@/components/StaticFooterMenu";
import SquareGallery from "@/components/SquareGallery";
import GenerativeInputField from "@/components/GenerativeInputField";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { createItem, generateItemMetadataFromPicture } from "@/lib/supabase";
import * as ImagePicker from "expo-image-picker";
import { GeneratedItemMetadata } from "@/types";
import { getPictureBase64FromLocalUri } from "@/lib/utils";
import { Quantity } from "@/components/AssetQuantity";
import { ParentAssetInfo } from "@/components/ParentAssetInfo";
import detectNewline from "detect-newline";

const ItemCreation = () => {
  const router = useRouter();

  const [uri, setUri] = useState(mostRecentlyTakenPictureUri.value || "");
  const [isGenerating, setIsGenerating] = useState(false);
  const [canAdd, setCanAdd] = useState(false);
  const [canGenerate, setCanGenerate] = useState(uri !== "");
  const [generatedMetadata, setGeneratedMetadata] =
    useState<GeneratedItemMetadata | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
  });
  const [parentAsset, setParentAsset] = useState({
    name: currentParentAsset.value.name || "My Home",
    type: currentParentAsset.value.type || undefined,
    id: currentParentAsset.value.id || undefined,
  });
  const [quantity, setQuantity] = useState(1);

  const fieldMap = {
    name: "shorthand",
    description: "description",
  };

  useEffect(() => {
    setCanAdd(form.name.length > 0);
  }, [form.name]);

  useEffect(() => {
    setCanGenerate(uri !== "" && !isGenerating);
  }, [uri, isGenerating]);

  useEffect(() => {
    if (generatedMetadata) {
      setForm({
        name: (generatedMetadata as any)[fieldMap.name] || form.name,
        description:
          (generatedMetadata as any)[fieldMap.description] || form.description,
      });
    }
  }, [generatedMetadata]);

  const onCancel = () => {
    router.back();
    mostRecentlyTakenPictureUri.value = "";
  };

  const getRecentPictureBase64 = async () => getPictureBase64FromLocalUri(uri);

  const handleGenerate = async () => {
    const pictureUri = uri;
    if (!pictureUri) {
      throw new Error("No picture uri");
    }

    console.log(`Starting to generate with picture uri: ${pictureUri}`);
    setIsGenerating(true);

    const pictureBase64 = await getPictureBase64FromLocalUri(pictureUri);
    if (!pictureBase64) {
      throw new Error(`No picture base64 for picture uri ${pictureUri}`);
    }

    const generatedData = await generateItemMetadataFromPicture({
      pictureBase64,
    });

    if (!generatedData) {
      console.error(`Failed to generate data for ${pictureUri}`);
      Alert.alert("Error", "Failed to generate data for the picture");
    }

    if (generatedData) {
      setGeneratedMetadata(generatedData);
    }

    setIsGenerating(false);
    console.log(`Generated item data for ${pictureUri}`);
  };

  const showGenerationIcon = (field: keyof typeof fieldMap): boolean => {
    if (isGenerating) {
      return true;
    }

    if (!generatedMetadata) {
      return false;
    }

    if (!(field in form)) {
      throw new Error(`Field "${field}" does not exist in form`);
    }

    if (!(fieldMap[field] in generatedMetadata)) {
      throw new Error(
        `Field "${fieldMap[field]}" does not exist in generatedMetadata`,
      );
    }

    return form[field] === (generatedMetadata as any)[fieldMap[field]];
  };

  const handleAdd = async () => {
    const pictureBase64 = await getRecentPictureBase64();
    const newItem = await createItem({
      name: form.name,
      description: form.description,
      pictureBase64: pictureBase64 || undefined,
      parent: parentAsset.id && {
        id: parentAsset.id,
        type: parentAsset.type,
      },
      quantity: quantity,
    });

    if (!newItem) {
      console.error("Failed to create item");
      Alert.alert("Error", "Failed to create item");
      return;
    }

    setForm({
      name: "",
      description: "",
    });

    router.replace("/");
  };

  const handleDismissPicture = () => {
    const mostRecentPictureUri = "";
    setUri(mostRecentPictureUri);
  };

  const pickImage = async () => {
    // No permissions request is necessary for launching the image library
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setUri(result.assets[0].uri);
    }
  };

  const handleQuantityDecrease = () => {
    setQuantity((prev) => Math.max(1, prev - 1));
  };

  const handleQuantityIncrease = () => {
    setQuantity((prev) => prev + 1);
  };

  return (
    <View className="h-full bg-white">
      <TouchableOpacity
        onPress={onCancel}
        className="absolute top-2 left-2 z-10"
      >
        <Ionicons
          name="chevron-back-circle-outline"
          size={36}
          color="#D9D9D9"
        />
      </TouchableOpacity>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-40"
      >
        <SquareGallery
          uri={uri}
          showDismissIcon={uri !== ""}
          onDismiss={handleDismissPicture}
          showPickerIcon={uri === ""}
          onPickerPress={pickImage}
        />
        {/* FIELDS */}
        <View className="flex flex-col items-start p-0 border-t border-accent">
          {/* ContainerNameTags Field */}
          <View className="flex flex-col w-full justify-center items-start py-2 px-5 gap-2.5">
            {/* Container and Quantity Row */}
            <View className="flex flex-row w-full justify-between items-center py-0.5 gap-2.5">
              <ParentAssetInfo
                parentType={parentAsset.type}
                parentName={parentAsset.name}
              />
              <Quantity
                mode="edit"
                value={quantity}
                onDecrease={handleQuantityDecrease}
                onIncrease={handleQuantityIncrease}
              />
            </View>
          </View>
          <GenerativeInputField
            placeholder="Give it a name"
            value={form.name}
            icon={showGenerationIcon("name") ? icons.shines : undefined}
            onChangeText={(value) => setForm({ ...form, name: value })}
            onClear={() => setForm({ ...form, name: "" })}
            isLoading={isGenerating}
            maxLength={50}
          />
          <View className="border-t border-accent w-full">
            <GenerativeInputField
              label="Notes"
              placeholder="Describe the item"
              inputClass={
                form.description?.length > 20 ||
                !!detectNewline(form.description)
                  ? "text-black-200 text-base leading-5"
                  : ""
              }
              value={form.description}
              icon={
                showGenerationIcon("description") ? icons.shines : undefined
              }
              onChangeText={(value) => setForm({ ...form, description: value })}
              onClear={() => setForm({ ...form, description: "" })}
              isLoading={isGenerating}
              multiline={true}
              scrollEnabled={true}
              maxLength={999}
            />
          </View>
          <View className="h-40"></View>
        </View>
      </ScrollView>
      <StaticFooterMenu>
        <View className="items-start w-full">
          <IconButton
            onPress={handleGenerate}
            icon={icons.shines}
            label="Generate"
            disabled={!canGenerate}
          />
        </View>
        <PrimaryButton onPress={handleAdd} label="Add" disabled={!canAdd} />
      </StaticFooterMenu>
    </View>
  );
};
export default ItemCreation;
