import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import React, { useEffect, useState } from "react";
import { currentParentAsset } from "@/signals/other";
import icons from "@/constants/icons";
import IconButton from "@/components/IconButton";
import PrimaryButton from "@/components/PrimaryButton";
import StaticFooterMenu from "@/components/StaticFooterMenu";
import SquareGallery from "@/components/SquareGallery";
import GenerativeInputField from "@/components/GenerativeInputField";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  createContainer,
  generateItemMetadataFromPicture,
  getContainers,
} from "@/lib/supabase";
import * as ImagePicker from "expo-image-picker";
import { AssetType, GeneratedItemMetadata } from "@/types";
import { getPictureBase64FromLocalUri } from "@/lib/utils";
import { Quantity } from "@/components/AssetQuantity";
import { ParentAssetInfo } from "@/components/ParentAssetInfo";
import detectNewline from "detect-newline";
import Checkbox from "expo-checkbox";
import { enqueueManualJob } from "@/signals/manual-queue";
import { manualCandidates } from "@/app/(root)/(tabs)/camera";
import { ParentSelector } from "@/components/ParentSelector";
import { useSupabase } from "@/lib/useSupabase";

const ItemCreation = () => {
  const router = useRouter();
  const { initialQuantity, initialPictureUri, remainingCandidates } =
    useLocalSearchParams<{
      initialQuantity?: string;
      initialPictureUri?: string;
      remainingCandidates?: string;
    }>();

  const [uri, setUri] = useState(initialPictureUri || "");
  const [isGenerating, setIsGenerating] = useState(false);
  const [canAdd, setCanAdd] = useState(false);
  const [canGenerate, setCanGenerate] = useState(uri !== "");
  const [generatedMetadata, setGeneratedMetadata] =
    useState<GeneratedItemMetadata | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    isContainer: false,
  });
  const [parentAsset, setParentAsset] = useState({
    name: currentParentAsset.value.name || "My Home",
    type: currentParentAsset.value.type || undefined,
    id: currentParentAsset.value.id || undefined,
  });
  const [quantity, setQuantity] = useState(
    initialQuantity ? parseInt(initialQuantity, 10) : 1,
  );

  const fieldMap = {
    name: "shorthand",
    description: "description",
  };

  const { data: containers, loading: loadingContainers } = useSupabase({
    fn: getContainers,
    params: {},
    skip: false,
  });

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
        isContainer: form.isContainer,
      });
    }
  }, [generatedMetadata]);

  const onCancel = () => {
    // TODO: fix back to camera (when coming from camera)
    // router.back();
    if (remainingCandidates && parseInt(remainingCandidates) > 0) {
      manualCandidates.value = [];
    }

    router.replace("/camera");
  };

  const handleParentChange = (parent: {
    id?: string;
    type?: string;
    name?: string;
  }) => {
    setParentAsset({
      id: parent.id,
      type: parent.type as "root" | "container",
      name: parent.name || "My Home",
    });
  };

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
    if (form.isContainer) {
      const pictureBase64 = await getPictureBase64FromLocalUri(uri);

      const parentType =
        parentAsset.type === "container"
          ? ("container" as AssetType)
          : undefined;

      const newContainer = await createContainer({
        name: form.name,
        description: form.description,
        pictureBase64: pictureBase64 || undefined,
        parent:
          parentAsset.id && parentType
            ? {
                id: parentAsset.id,
                type: parentType,
              }
            : undefined,
      });

      if (!newContainer) {
        console.error("Failed to create container");
        Alert.alert("Error", "Failed to create container");
        return;
      }
    } else {
      if (!uri) {
        Alert.alert("Error", "No image selected");
        return;
      }

      enqueueManualJob({
        name: form.name,
        description: form.description,
        quantity: quantity,
        imageUri: uri,
        parentId: parentAsset.id,
        parentType: parentAsset.type as "root" | "container",
        parentName: parentAsset.name,
      });
    }

    setForm({
      name: "",
      description: "",
      isContainer: false,
    });

    const remaining = remainingCandidates
      ? parseInt(remainingCandidates, 10)
      : 0;

    if (remaining > 0) {
      manualCandidates.value = manualCandidates.value.slice(1);

      if (manualCandidates.value.length > 0) {
        const nextCandidate = manualCandidates.value[0];

        router.replace({
          pathname: "/item-creation",
          params: {
            initialQuantity: nextCandidate.quantity.toString(),
            initialPictureUri: nextCandidate.imageUri,
            remainingCandidates: (manualCandidates.value.length - 1).toString(),
          },
        });
        return;
      }
    }

    router.replace("/");
  };

  const handleDismissPicture = () => {
    setUri("");
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setUri(result.assets[0].uri);
      console.log(
        `Image size: ${result.assets[0].width}x${result.assets[0].height}`,
      );
    }
  };

  const handleQuantityDecrease = () => {
    setQuantity((prev) => Math.max(1, prev - 1));
  };

  const handleQuantityIncrease = () => {
    setQuantity((prev) => prev + 1);
  };

  const getAddButtonText = () => {
    const remaining = remainingCandidates
      ? parseInt(remainingCandidates, 10)
      : 0;
    if (remaining > 0) {
      return `Add (${remaining + 1} remaining)`;
    }
    return "Add";
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
              <ParentSelector
                currentParentId={parentAsset.id}
                currentParentType={parentAsset.type}
                currentParentName={parentAsset.name}
                onSelectParent={handleParentChange}
                containers={containers || []}
                isLoading={loadingContainers}
              />
              {!form.isContainer && (
                <Quantity
                  mode="edit"
                  value={quantity}
                  onDecrease={handleQuantityDecrease}
                  onIncrease={handleQuantityIncrease}
                />
              )}
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

          <View className="flex flex-row items-center px-5 py-2 gap-2">
            <Checkbox
              value={form.isContainer}
              onValueChange={(value) =>
                setForm({ ...form, isContainer: value })
              }
              color={form.isContainer ? "#0061FF" : undefined}
            />
            <Text className="text-black-200 font-rubik-medium text-sm">
              is a container?
            </Text>
          </View>

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
        <PrimaryButton
          onPress={handleAdd}
          label={getAddButtonText()}
          disabled={!canAdd}
        />
      </StaticFooterMenu>
    </View>
  );
};
export default ItemCreation;
