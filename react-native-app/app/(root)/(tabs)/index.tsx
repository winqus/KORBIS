/* eslint-disable react-hooks/exhaustive-deps */
import { BackHandler, Image, Text, TouchableOpacity, View } from "react-native";
import { searchAssets } from "@/lib/supabase";
import { useGlobalContext } from "@/lib/global-provider";
import { useSupabase } from "@/lib/useSupabase";
import ItemList from "@/components/ItemList";
import { SafeAreaView } from "react-native-safe-area-context";
import icons from "@/constants/icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { IVirtualAsset } from "@/types";
import SearchBar from "@/components/SearchBar";
import React, { useEffect } from "react";
import { isProcessing, pendingJobsCount } from "@/signals/queue";
import {
  pushParent,
  currentParentAsset,
  popParent,
  parentStack,
} from "@/signals/parent";
import { useIsFocused } from "@react-navigation/core";

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

  const handleCardPress = (asset: IVirtualAsset) => {
    if (asset.type === "item") {
      router.push(`/items/${asset.id}`);
    } else if (asset.type === "container") {
      pushParent({
        type: "container",
        id: asset.id,
        name: asset.name,
      });
    }
  };

  useEffect(() => {
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
    currentParentAsset.value,
  ]);

  const isFocused = useIsFocused();
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

        console.log("[hardwareBackPress] Returning", !isFocused);
        return isFocused; /* true to prevent default behavior */
      },
    );
    return () => backHandler.remove();
  }, [isFocused]);

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
          Found {items?.length} item(s) in{" "}
          <Text className="font-rubik-bold text-primary-300">
            {currentParentAsset.value.name}
          </Text>
        </Text>
      </View>

      {isProcessing.value && (
        <View className="mt-5">
          <Text className="text-lg font-rubik-semiboldtext-primary-300">
            Currently adding {pendingJobsCount} items...
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView className="bg-white h-full">
      <ItemList
        assets={items ?? []}
        onCardPress={handleCardPress}
        loading={loadingItems}
        showHeader={true}
        customHeader={itemListHeader}
      />
    </SafeAreaView>
  );
}
