import { View, Dimensions, Alert, Platform, ScrollView } from "react-native";
import React, { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  deleteContainer,
  getContainerById,
  updateContainer,
  getContainers,
} from "../../../lib/supabase";
import { useSupabase } from "../../../lib/useSupabase";
import { Container } from "../../../types";
import { clearParentStack, pushParent } from "../../../signals/parent";
import {
  AssetViewImage,
  AssetBackButton,
  AssetEditButton,
  AssetName,
  AssetTags,
  AssetDescription,
  AssetLocation,
  AssetOther,
  AssetDeleteButton,
  ParentAssetInfo,
  AssetContainerContents,
  ParentSelector,
} from "../../../components";

const ContainerDetail = () => {
  const { id, containerData } = useLocalSearchParams<{
    id?: string;
    containerData?: string;
  }>();
  const router = useRouter();
  const [initialContainer, setInitialContainer] = useState<Container | null>(
    null,
  );
  const [isEditing, setIsEditing] = useState(false);
  const [editedContainer, setEditedContainer] = useState<Container | null>(
    null,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [containers, setContainers] = useState<Container[]>([]);
  const [isLoadingContainers, setIsLoadingContainers] = useState(false);

  useEffect(() => {
    if (containerData) {
      try {
        const parsedContainer = JSON.parse(containerData) as Container;
        setInitialContainer(parsedContainer);
        setEditedContainer(parsedContainer);
      } catch (error) {
        console.error("Failed to parse container data:", error);
      }
    }
  }, [containerData]);

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
    console.error("No container ID provided");
    Alert.alert("Error", "No container ID provided");
    router.replace("/");
  }

  const windowHeight = Dimensions.get("window").height;

  const { data: fetchedContainer, loading: isLoadingContainer } = useSupabase({
    fn: getContainerById,
    params: {
      id: id!,
    },
    skip: !!initialContainer,
  });

  const container = initialContainer || fetchedContainer;

  useEffect(() => {
    if (fetchedContainer && !initialContainer) {
      setEditedContainer(fetchedContainer);
    }
  }, [fetchedContainer, initialContainer]);

  const handleDelete = () => {
    Alert.alert(
      "Delete Container",
      "Are you sure you want to delete this container?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          onPress: async () => {
            await deleteContainer({ id: id! }).then(() => {
              router.replace("/");
            });
          },
          style: "destructive",
        },
      ],
    );
  };

  const handleParentPress = () => {
    if (container?.parentId && container?.parentType) {
      console.log("Parent pressed", container);
      clearParentStack();
      pushParent({
        id: container.parentId,
        type: container.parentType,
        name: container.parentName || "My Home",
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
    if (!editedContainer) return;

    setIsSaving(true);
    try {
      const updatedContainer = await updateContainer({
        id: id!,
        name: editedContainer.name,
        description: editedContainer.description,
        parentId: editedContainer.parentId,
        parentType: editedContainer.parentType,
      });

      if (!updatedContainer) {
        throw new Error("Failed to update container");
      }

      setInitialContainer(updatedContainer);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update container:", error);
      Alert.alert("Error", "Failed to update container");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedContainer(container);
    setIsEditing(false);
  };

  const handleParentChange = (parent: {
    id?: string;
    type?: string;
    name?: string;
  }) => {
    if (editedContainer) {
      setEditedContainer({
        ...editedContainer,
        parentId: parent.id,
        parentType: parent.type as "root" | "container",
        parentName: parent.name,
      });
    }
  };

  const handleNameChange = (name: string) => {
    if (editedContainer) {
      setEditedContainer({
        ...editedContainer,
        name,
      });
    }
  };

  const handleClearName = () => {
    if (editedContainer) {
      setEditedContainer({
        ...editedContainer,
        name: "",
      });
    }
  };

  const handleDescriptionChange = (description: string) => {
    if (editedContainer) {
      setEditedContainer({
        ...editedContainer,
        description,
      });
    }
  };

  const handleClearDescription = () => {
    if (editedContainer) {
      setEditedContainer({
        ...editedContainer,
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
          <AssetViewImage imageUrl={container?.imageUrl} />

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
                  currentParentId={editedContainer?.parentId}
                  currentParentType={editedContainer?.parentType}
                  currentParentName={editedContainer?.parentName || "My Home"}
                  onSelectParent={handleParentChange}
                  containers={containers}
                  isLoading={isLoadingContainers}
                />
              ) : (
                <ParentAssetInfo
                  parentType={container?.parentType}
                  parentName={container?.parentName || "My Home"}
                  onPress={handleParentPress}
                />
              )}
            </View>

            {/* AssetName */}
            <AssetName
              name={
                isEditing ? editedContainer?.name || "" : container?.name || ""
              }
              isEditing={isEditing}
              onNameChange={handleNameChange}
              onClear={handleClearName}
            />

            {/* AssetTags */}
            <AssetTags type="container" />
          </View>

          {/* AssetDescription */}
          <AssetDescription
            description={
              isEditing
                ? editedContainer?.description || ""
                : container?.description || ""
            }
            isEditing={isEditing}
            onDescriptionChange={handleDescriptionChange}
            onClear={handleClearDescription}
          />

          {/* AssetLocation */}
          <AssetLocation />

          {/* AssetOther */}
          <AssetOther id={container?.id || ""} />

          {/* Container Items Count */}
          {/* <AssetContainerContents childCount={container?.childCount || 0} /> */}

          {/* AssetDeleteButton */}
          <AssetDeleteButton onDelete={handleDelete} />
        </View>
      </ScrollView>
    </View>
  );
};

export default ContainerDetail;
