/* eslint-disable react-hooks/exhaustive-deps */
import { BackHandler, Image, Text, TouchableOpacity, View } from "react-native";
import { searchAssets } from "@/lib/supabase";
import { useGlobalContext } from "@/lib/global-provider";
import { useSupabase } from "@/lib/useSupabase";
import ItemList from "@/components/ItemList";
import { SafeAreaView } from "react-native-safe-area-context";
import icons from "@/constants/icons";
import {
  router,
  useLocalSearchParams,
  useNavigation,
  useRouter,
} from "expo-router";
import { AssetType, IVirtualAsset, VirtualAsset } from "@/types";
import SearchBar from "@/components/SearchBar";
import React, { useEffect, useRef } from "react";
import {
  isProcessing,
  pendingJobsCount,
  jobQueue,
  completedJobs,
  Job,
  clearCompletedAutoQueueJobs,
} from "@/signals/queue";
import {
  isManualProcessing,
  pendingManualJobsCount,
  manualJobQueue,
  ManualItemPayload,
  clearCompletedManualQueueJobs,
} from "@/signals/manual-queue";
import {
  pushParent,
  currentParentAsset,
  popParent,
  parentStack,
  clearParentStack,
} from "@/signals/parent";
import { useIsFocused } from "@react-navigation/core";
import { FlashList } from "@shopify/flash-list";
import { manualCompletedJobs } from "../../../signals/manual-queue";
import { AutoCreateItemPayload } from "../../../signals/queue";

export default function Index() {
  // TODO: remove
  // console.debug("[REMOVE LATER] Redirecting to /camera from /index");
  // return <Redirect href="/camera" />;
  // return <Redirect href="/item-creation" />;
  /* REMOVE UNTIL HERE */

  const { user } = useGlobalContext();
  const params = useLocalSearchParams<{
    queryText?: string;
    queryImageUri?: string;
  }>();
  const router = useRouter();
  const navigation = useNavigation();
  const listRef = useRef<FlashList<IVirtualAsset>>(null);

  const scrollPositionsRef = useRef<Record<string, number>>({});
  const currentContainerId = String(currentParentAsset.value.id || "root");

  const {
    data: items,
    loading: loadingItems,
    refetch: refetchItems,
  } = useSupabase({
    fn: searchAssets,
    params: {
      queryText: params.queryText || "",
      queryImageUri: params.queryImageUri || "",
      parentId: currentParentAsset.value.id,
      parentType: currentParentAsset.value.type,
    },
    skip: true,
  });

  const handleProfilePress = () => router.push("/profile");

  const handleGoAssetDetails = ({
    id,
    type,
    name,
    data,
  }: Pick<IVirtualAsset, "id" | "type" | "name"> & {
    data?: Partial<IVirtualAsset>;
  }) => {
    if (type === "item") {
      router.push({
        pathname: "/items/[id]",
        params: { id: id, itemData: data ? JSON.stringify(data) : undefined },
      });
    } else if (type === "container") {
      router.push({
        pathname: "/containers/[id]",
        params: {
          id: id,
          containerData: data ? JSON.stringify(data) : undefined,
        },
      });
    }
  };

  const handleCardPress = (asset: IVirtualAsset) => {
    if (asset.ownerId === "queue" || asset.ownerId === "manual-queue") {
      return;
    }

    if (asset.type === "item") {
      router.push({
        pathname: "/items/[id]",
        params: { id: asset.id, itemData: JSON.stringify(asset) },
      });
    } else if (asset.type === "container") {
      pushParent({
        type: "container",
        id: asset.id,
        name: asset.name,
      });
    }
  };

  const handleCardLongPress = (asset: IVirtualAsset) => {
    if (asset.ownerId === "queue" || asset.ownerId === "manual-queue") {
      return;
    }

    if (asset.type === "item") {
      return;
    } else if (asset.type === "container") {
      console.log("Long pressed container", asset);
      router.push({
        pathname: "/containers/[id]",
        params: { id: asset.id, containerData: JSON.stringify(asset) },
      });
    }
  };

  const filterAutoJobsOfCurrentParent = (
    jobs: Job<AutoCreateItemPayload>[],
  ) => {
    return jobs.filter(
      (job) =>
        (job.parent?.id == null &&
          job.parent?.type === currentParentAsset.value.id) ||
        (job.parent?.id === currentParentAsset.value.id &&
          job.parent?.type === currentParentAsset.value.type),
    );
  };
  const filterManualJobsOfCurrentParent = (jobs: Job<ManualItemPayload>[]) => {
    return jobs.filter(
      (job) =>
        job.parentId == null ||
        (job.parentId === currentParentAsset.value.id &&
          job.parentType === currentParentAsset.value.type),
    );
  };
  const autoQueueItems: IVirtualAsset[] = filterAutoJobsOfCurrentParent(
    jobQueue.value,
  ).map((job) => ({
    id: job.id,
    type: "item" as AssetType,
    name: job.candidate.name || "Processing item...",
    imageUrl: job.imageUri,
    ownerId: "queue",
  }));
  const completedAutoQueueItems: IVirtualAsset[] =
    filterAutoJobsOfCurrentParent(completedJobs.value).map((job) => ({
      id: job.id,
      type: "item" as AssetType,
      name: job.candidate.name || "Processing item...",
      imageUrl: job.imageUri,
      ownerId: "manual-queue",
    }));
  const manualQueueItems: IVirtualAsset[] = filterManualJobsOfCurrentParent(
    manualJobQueue.value,
  ).map((job) => ({
    id: job.id,
    type: "item" as AssetType,
    name: job.name || "Processing item...",
    imageUrl: job.imageUri,
    ownerId: "manual-queue",
  }));
  const completedManualQueueItems: IVirtualAsset[] =
    filterManualJobsOfCurrentParent(manualCompletedJobs.value).map((job) => ({
      id: job.id,
      type: "item" as AssetType,
      name: job.name || "Processing item...",
      imageUrl: job.imageUri,
      ownerId: "manual-queue",
    }));

  const combinedAssets = [
    ...autoQueueItems,
    ...manualQueueItems,
    ...completedAutoQueueItems,
    ...completedManualQueueItems,
    ...(items || []),
  ];

  useEffect(() => {
    navigation.addListener("tabPress" as any, () => {
      clearParentStack();
    });
  }, [navigation]);

  useEffect(() => {
    if (isProcessing.value === false) {
      clearCompletedAutoQueueJobs();
    }

    if (isManualProcessing.value === false) {
      clearCompletedManualQueueJobs();
    }

    refetchItems({
      queryText: params.queryText || "",
      queryImageUri: params.queryImageUri || "",
      parentId: currentParentAsset.value.id,
      parentType: currentParentAsset.value.type,
    });
  }, [
    params.queryImageUri,
    params.queryText,
    isProcessing.value,
    isManualProcessing.value,
    currentParentAsset.value,
  ]);

  const isFocused = useIsFocused();

  const restoreScroll = () => {
    const savedPosition = scrollPositionsRef.current[currentContainerId] || 0;

    listRef.current?.scrollToOffset({
      offset: savedPosition,
      animated: false,
    });
  };

  const handleListLoad = () => {
    if (listRef.current) {
      setTimeout(() => {
        restoreScroll();
      }, 10);
    }
  };

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (params.queryImageUri || params.queryText) {
          console.log("[hardwareBackPress] Clearing search params");
          router.setParams({
            queryText: "",
            queryImageUri: "",
          });
          return true;
        }

        if (parentStack.value.length > 1) {
          console.log("[hardwareBackPress] Popping parent");
          popParent();
          return true;
        }

        return isFocused; /* true to prevent default behavior */
      },
    );
    return () => backHandler.remove();
  }, [isFocused]);

  const handleScroll = (event: any) => {
    const position = event.nativeEvent.contentOffset.y;
    scrollPositionsRef.current[currentContainerId] = position;
  };

  const totalAddingItems =
    pendingJobsCount.value + pendingManualJobsCount.value;
  const isAnyProcessing = isProcessing.value || isManualProcessing.value;

  const itemListHeader = (
    <View className="px-5">
      {/* Avatar */}
      <View className="flex flex-row items-center justify-between mt-5">
        <TouchableOpacity
          onPress={handleProfilePress}
          className="flex flex-row items-center"
        >
          <Image
            source={{ uri: user?.avatar }}
            className="size-12 rounded-full"
          />
          <View className="flex flex-col items-start ml-2 justify-center">
            <Text className="text-xs font-rubik text-black-100">Welcome,</Text>
            <Text className="text-base font-rubik-medium text-black-300">
              {user?.name.split(" ")[0]}
            </Text>
          </View>
        </TouchableOpacity>
        <Image source={icons.bell} className="size-6" />
      </View>

      {/* Search bar */}
      <SearchBar />

      {/* Found Items text */}
      <View className="mt-5">
        <Text className="text-xl font-rubik-bold text-black-300 mt-5">
          {loadingItems
            ? "Searching in"
            : `Found ${combinedAssets.length} item(s) in`}{" "}
          <Text
            className="font-rubik-bold text-primary-300"
            onPress={() => {
              if (currentParentAsset.value.type !== "root") {
                handleGoAssetDetails({
                  id: currentParentAsset.value.id!,
                  type: currentParentAsset.value.type,
                  name: currentParentAsset.value.name,
                });
              }
            }}
          >
            {currentParentAsset.value.name}
          </Text>
        </Text>
      </View>

      {isAnyProcessing && (
        <View className="mt-5">
          <Text className="text-lg font-rubik-semibold text-primary-300">
            Currently adding {totalAddingItems} item
            {totalAddingItems > 1 ? "s" : ""}...
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView className="bg-white h-full">
      <ItemList
        assets={loadingItems ? [] : combinedAssets}
        onCardPress={handleCardPress}
        onCardLongPress={handleCardLongPress}
        loading={loadingItems}
        showHeader={true}
        customHeader={itemListHeader}
        listRef={listRef}
        onScroll={handleScroll}
        onLoad={handleListLoad}
      />
    </SafeAreaView>
  );
}
