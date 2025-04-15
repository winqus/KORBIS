import {
  View,
  Text,
  Dimensions,
  Alert,
  Platform,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";

import React, { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  deleteItem,
  getItemById,
  updateItem,
  getContainers,
} from "@/lib/supabase";
import { useSupabase } from "@/lib/useSupabase";
import { useItemFiles } from "@/lib/useItemFiles";
import icons from "@/constants/icons";
import images from "@/constants/images";
import { DocumentPill } from "@/components/DocumentPill";
import { TagPill } from "@/components/TagPill";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { ParentAssetInfo } from "@/components/ParentAssetInfo";
import { Quantity } from "@/components/AssetQuantity";
import { Feather } from "@expo/vector-icons";
import { Container, Item } from "@/types";
import { clearParentStack, pushParent } from "@/signals/parent";
import GenerativeInputField from "@/components/GenerativeInputField";
import ParentSelector from "@/components/ParentSelector";

const ItemDetail = () => {
  const { id, itemData } = useLocalSearchParams<{
    id?: string;
    itemData?: string;
  }>();
  const router = useRouter();
  const [initialItem, setInitialItem] = useState<Item | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedItem, setEditedItem] = useState<Item | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [containers, setContainers] = useState<Container[]>([]);
  const [isLoadingContainers, setIsLoadingContainers] = useState(false);
  const {
    files,
    isLoading: isLoadingFiles,
    uploadFile,
    openFile,
    deleteFile,
  } = useItemFiles(id);

  useEffect(() => {
    if (itemData) {
      try {
        const parsedItem = JSON.parse(itemData) as Item;
        setInitialItem(parsedItem);
        setEditedItem(parsedItem);
      } catch (error) {
        console.error("Failed to parse item data:", error);
      }
    }
  }, [itemData]);

  useEffect(() => {
    if (isEditing) {
      fetchContainers();
    }
  }, [isEditing]);

  const fetchContainers = async () => {
    setIsLoadingContainers(true);
    try {
      const data = await getContainers();
      setContainers(data);
    } catch (error) {
      console.error("Failed to fetch containers:", error);
      Alert.alert("Error", "Failed to load containers");
    } finally {
      setIsLoadingContainers(false);
    }
  };

  if (!id) {
    console.error("No item ID provided");
    Alert.alert("Error", "No item ID provided");
    router.replace("/");
  }

  const windowHeight = Dimensions.get("window").height;

  const { data: fetchedItem, loading: isLoadingItem } = useSupabase({
    fn: getItemById,
    params: {
      id: id!,
    },
    skip: !!initialItem,
  });

  const item = initialItem || fetchedItem;

  useEffect(() => {
    if (fetchedItem && !initialItem) {
      setEditedItem(fetchedItem);
    }
  }, [fetchedItem, initialItem]);

  const handleDelete = () => {
    Alert.alert("Delete Item", "Are you sure you want to delete this item?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Delete",
        onPress: async () => {
          await deleteItem({ id: id! });
          router.replace("/");
        },
        style: "destructive",
      },
    ]);
  };

  const handleParentPress = () => {
    if (item?.parentId && item?.parentType && item?.parentName) {
      clearParentStack();
      pushParent({
        id: item.parentId,
        type: item.parentType,
        name: item.parentName,
      });

      router.push({
        pathname: "/",
      });
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!editedItem) return;

    setIsSaving(true);
    try {
      const updatedItem = await updateItem({
        id: id!,
        name: editedItem.name,
        description: editedItem.description,
        quantity: editedItem.quantity,
        parentId: editedItem.parentId,
        parentType: editedItem.parentType,
      });

      if (!updatedItem) {
        throw new Error("Failed to update item");
      }

      setInitialItem(updatedItem);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update item:", error);
      Alert.alert("Error", "Failed to update item");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedItem(item);
    setIsEditing(false);
  };

  const handleQuantityDecrease = () => {
    if (editedItem) {
      setEditedItem({
        ...editedItem,
        quantity: Math.max(1, editedItem.quantity - 1),
      });
    }
  };

  const handleQuantityIncrease = () => {
    if (editedItem) {
      setEditedItem({
        ...editedItem,
        quantity: editedItem.quantity + 1,
      });
    }
  };

  const handleParentChange = (parent: {
    id?: string;
    type?: string;
    name?: string;
  }) => {
    if (editedItem) {
      setEditedItem({
        ...editedItem,
        parentId: parent.id,
        parentType: parent.type as "root" | "container",
        parentName: parent.name,
      });
    }
  };

  return (
    <View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-32 bg-white"
      >
        <View className="relative w-full" style={{ height: windowHeight / 2 }}>
          <Image
            source={{ uri: item?.imageUrl }}
            className="size-full"
            contentFit="cover"
          />
          <Image
            source={images.whiteGradient}
            className="absolute top-0 w-full z-40"
          />

          <View
            className="z-50 absolute inset-x-2"
            style={{
              top: Platform.OS === "ios" ? 60 : 10,
            }}
          >
            <View className="flex flex-row items-center w-full justify-between">
              <TouchableOpacity
                onPress={() => router.back()}
                className="flex flex-row size-12 items-center justify-center"
              >
                <Image
                  source={icons.back_caret_circle}
                  className="size-full"
                  tintColor={"white"}
                />
              </TouchableOpacity>

              {isEditing ? (
                <View className="flex flex-row items-center gap-2">
                  <TouchableOpacity
                    onPress={handleCancel}
                    className="flex flex-row items-center justify-center py-1.5 px-3 bg-gray-200 rounded-full"
                  >
                    <Text className="text-black-300 font-rubik-medium">
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleSave}
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
              ) : (
                <TouchableOpacity
                  onPress={handleEdit}
                  className="flex flex-row items-center justify-center py-1.5 px-3 bg-primary-500 rounded-full"
                >
                  <Text className="text-white font-rubik-medium">Edit</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        <View className="flex flex-col px-5 py-6 gap-8">
          {/* Name and Tags*/}
          <View className="flex flex-col items-start gap-3">
            <View className="flex flex-row w-full justify-between items-center py-0.5 gap-2.5">
              {isEditing ? (
                <ParentSelector
                  currentParentId={editedItem?.parentId}
                  currentParentType={editedItem?.parentType}
                  currentParentName={editedItem?.parentName || "My Home"}
                  onSelectParent={handleParentChange}
                  containers={containers}
                  isLoading={isLoadingContainers}
                />
              ) : (
                <ParentAssetInfo
                  parentType={item?.parentType}
                  parentName={item?.parentName || "My Home"}
                  onPress={handleParentPress}
                />
              )}
              {item?.quantity! >= 0 ? (
                isEditing ? (
                  <Quantity
                    mode="edit"
                    value={editedItem?.quantity || 1}
                    onDecrease={handleQuantityDecrease}
                    onIncrease={handleQuantityIncrease}
                  />
                ) : (
                  <Quantity mode="read" value={item!.quantity} />
                )
              ) : null}
            </View>

            {isEditing ? (
              <GenerativeInputField
                placeholder="Give it a name"
                value={editedItem?.name || ""}
                onChangeText={(value) =>
                  setEditedItem((prev) =>
                    prev ? { ...prev, name: value } : null,
                  )
                }
                onClear={() =>
                  setEditedItem((prev) => (prev ? { ...prev, name: "" } : null))
                }
                maxLength={50}
              />
            ) : (
              <Text className="text-2xl font-rubik-bold" selectable={true}>
                {item?.name}
              </Text>
            )}

            <View className="flex flex-row items-center gap-1.5">
              <TagPill label="Item" />
            </View>
          </View>

          {/* Description */}
          <View className="flex flex-col items-start gap-3">
            <Text className="text-black-300 text-xl font-rubik-bold">
              Description
            </Text>
            {isEditing ? (
              <GenerativeInputField
                placeholder="Describe the item"
                value={editedItem?.description || ""}
                onChangeText={(value) =>
                  setEditedItem((prev) =>
                    prev ? { ...prev, description: value } : null,
                  )
                }
                onClear={() =>
                  setEditedItem((prev) =>
                    prev ? { ...prev, description: "" } : null,
                  )
                }
                multiline={true}
                scrollEnabled={true}
                maxLength={999}
                inputClass="text-black-200 text-base leading-5"
              />
            ) : (
              <Text
                className="text-black-200 text-base font-rubik"
                selectable={true}
              >
                {item?.description || "No description available"}
              </Text>
            )}
          </View>

          {/* Attachments */}
          <View className="flex flex-col items-start gap-3">
            <View className="flex flex-row justify-start items-center gap-2.5">
              <Text className="text-black-300 text-xl font-rubik-bold">
                Attachments
              </Text>
              <TouchableOpacity disabled={isLoadingFiles} onPress={uploadFile}>
                <Feather
                  name="file-plus"
                  size={20}
                  color="#666876"
                  className="size-7"
                />
              </TouchableOpacity>
            </View>
            {isLoadingItem || isLoadingFiles ? (
              <ActivityIndicator size="small" color="#0061ff" />
            ) : files.length > 0 ? (
              <View className="flex flex-col items-start gap-4 w-full">
                {files.map((file) => (
                  <DocumentPill
                    key={file.id}
                    label={file.originalName}
                    onPress={() => openFile(file)}
                    onDelete={() => deleteFile(file.id)}
                    isDownloaded={file.isDownloaded}
                  />
                ))}
              </View>
            ) : (
              <Text
                className="text-black-200 text-sm font-rubik-medium"
                onPress={uploadFile}
              >
                Tap + to add files
              </Text>
            )}
          </View>

          {/* Location */}
          <View className="flex flex-col items-start gap-3">
            <Text className="text-black-300 text-xl font-rubik-bold">
              Location
            </Text>
            <View className="flex flex-row items-center justify-start gap-2">
              <Image source={icons.location} className="w-7 h-7" />
              <Text
                className="text-black-200 text-sm font-rubik-medium"
                selectable={true}
              >
                Lithuania, Vilnius
              </Text>
            </View>
          </View>

          {/* Other */}
          <View className="flex flex-col items-start gap-3">
            <Text className="text-black-300 text-xl font-rubik-bold">
              Other
            </Text>
            <View className="flex flex-row items-center justify-start gap-2">
              <Text
                className="text-black-200 text-sm font-rubik-medium"
                selectable={true}
              >
                ID: {item?.id}
              </Text>
            </View>
          </View>

          {/* Delete Button */}
          <View className="flex flex-col items-center justify-center py-8 gap-1 w-full">
            <TouchableOpacity
              onPress={handleDelete}
              className="flex flex-row items-center justify-center py-1.5 px-4 gap-1.5 w-32 h-9 border border-red-500 rounded-full"
            >
              <FontAwesome5 name="trash-alt" size={18} color="#FF0000" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default ItemDetail;
