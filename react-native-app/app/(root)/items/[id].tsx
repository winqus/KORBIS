import { View, Dimensions, Alert, Platform, ScrollView } from "react-native";
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
import { Container, Item } from "@/types";
import { clearParentStack, pushParent } from "@/signals/parent";
import {
  ParentSelector,
  AssetViewImage,
  AssetBackButton,
  AssetEditButton,
  AssetName,
  AssetTags,
  AssetDescription,
  AssetAttachments,
  AssetLocation,
  AssetOther,
  AssetDeleteButton,
  ParentAssetInfo,
  Quantity,
} from "@/components";

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

  const handleNameChange = (name: string) => {
    if (editedItem) {
      setEditedItem({
        ...editedItem,
        name,
      });
    }
  };

  const handleClearName = () => {
    if (editedItem) {
      setEditedItem({
        ...editedItem,
        name: "",
      });
    }
  };

  const handleDescriptionChange = (description: string) => {
    if (editedItem) {
      setEditedItem({
        ...editedItem,
        description,
      });
    }
  };

  const handleClearDescription = () => {
    if (editedItem) {
      setEditedItem({
        ...editedItem,
        description: "",
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
          {/* AssetViewImage */}
          <AssetViewImage imageUrl={item?.imageUrl} />

          <View
            className="z-50 absolute inset-x-2"
            style={{
              top: Platform.OS === "ios" ? 60 : 10,
            }}
          >
            <View className="flex flex-row items-center w-full justify-between">
              {/* BackButton */}
              <AssetBackButton onPress={() => router.back()} />

              {/* EditButton */}
              <AssetEditButton
                isEditing={isEditing}
                onEdit={handleEdit}
                onSave={handleSave}
                onCancel={handleCancel}
                isSaving={isSaving}
              />
            </View>
          </View>
        </View>

        <View className="flex flex-col px-5 py-6 gap-8">
          <View className="flex flex-col items-start gap-3">
            <View className="flex flex-row w-full justify-between items-center py-0.5 gap-2.5">
              {/* ParentAsset */}
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

              {/* Quantity */}
              {item?.quantity && (
                <Quantity
                  mode={isEditing ? "edit" : "read"}
                  value={isEditing ? editedItem?.quantity || 1 : item.quantity}
                  onDecrease={isEditing ? handleQuantityDecrease : undefined}
                  onIncrease={isEditing ? handleQuantityIncrease : undefined}
                />
              )}
            </View>

            {/* AssetName */}
            <AssetName
              name={isEditing ? editedItem?.name || "" : item?.name || ""}
              isEditing={isEditing}
              onNameChange={handleNameChange}
              onClear={handleClearName}
            />

            {/* AssetTags */}
            <AssetTags type="item" />
          </View>

          {/* AssetDescription */}
          <AssetDescription
            description={
              isEditing
                ? editedItem?.description || ""
                : item?.description || ""
            }
            isEditing={isEditing}
            onDescriptionChange={handleDescriptionChange}
            onClear={handleClearDescription}
          />

          {/* AssetAttachments */}
          <AssetAttachments
            files={files}
            isLoading={isLoadingFiles}
            onUploadFile={uploadFile}
            onOpenFile={openFile}
            onDeleteFile={deleteFile}
          />

          {/* AssetLocation */}
          <AssetLocation />

          {/* AssetOther */}
          <AssetOther id={item?.id || ""} />

          {/* AssetDeleteButton */}
          <AssetDeleteButton onDelete={handleDelete} />
        </View>
      </ScrollView>
    </View>
  );
};

export default ItemDetail;
