import { Image, Text, TouchableOpacity, View } from "react-native";
import { searchItems } from "@/lib/supabase";
import { useGlobalContext } from "@/lib/global-provider";
import { useSupabase } from "@/lib/useSupabase";
import ItemList from "@/components/ItemList";
import { SafeAreaView } from "react-native-safe-area-context";
import icons from "@/constants/icons";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { Item } from "@/types";
import SearchBar from "@/components/SearchBar";
import React, { useEffect } from "react";

export default function Index() {
  // TODO: remove
  console.debug("[REMOVE LATER] Redirecting to /camera from /index");
  return <Redirect href="/camera" />;
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
    fn: searchItems,
    params: {
      queryText: params.queryText || "",
      queryImageUri: params.queryImageUri || "",
    },
    skip: true,
  });

  const handleProfilePress = () => router.push("/profile");

  const handleCardPress = ({ ID }: Item) => router.push(`/items/${ID}`);

  useEffect(() => {
    refetchItems({
      queryText: params.queryText || "",
      queryImageUri: params.queryImageUri || "",
    });
  }, [params.queryImageUri, params.queryText]);

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
          Found {items?.length} item(s) in your inventory
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="bg-white h-full">
      <ItemList
        items={items ?? []}
        onCardPress={handleCardPress}
        loading={loadingItems}
        showHeader={true}
        customHeader={itemListHeader}
      />
    </SafeAreaView>
  );
}
