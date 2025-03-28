import { Image, Text, TouchableOpacity, View } from "react-native";
import { getItems, logout } from "@/lib/supabase";
import { useGlobalContext } from "@/lib/global-provider";
import { Link } from "expo-router";
import { useSupabase } from "@/lib/useSupabase";
import { useEffect } from "react";
import ItemList from "@/components/ItemList";
import { SafeAreaView } from "react-native-safe-area-context";
import { Item } from "@/types";

export default function Index() {
  const { user, refetch } = useGlobalContext();
  const handleSignOut = async () => {
    await logout();
    refetch({});
  };

  const { data: items, loading: loadingItems } = useSupabase({
    fn: getItems,
  });

  useEffect(() => {
    console.log("items", items);
  }, [items]);

  // TODO: Remove this when testing is done
  const dublicateItems = (arr: Item[], numberOfRepetitions: number) =>
    arr
      .flatMap(
        (i) => Array.from({ length: numberOfRepetitions }).fill(i) as Item[],
      )
      .map((item, index) => ({ ...item, ID: `${item.ID}-${index}` }));

  return (
    <SafeAreaView className="bg-white h-full">
      <View
        style={{
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <TouchableOpacity onPress={handleSignOut}>
          <Text>Sign Out</Text>
        </TouchableOpacity>
        <View className="flex flex-row gap-1">
          <Image
            source={{ uri: user?.avatar }}
            className="size-6 rounded-full"
          />
          <Text>Welcome to Korbis, {user?.name.split(" ")[0]}</Text>
        </View>
        <Text className="text-center">
          {loadingItems
            ? "Loading..."
            : `You have ${items?.length || "(0)"} items in your inventory.`}
        </Text>
        <Link href="/item-creation">Item Creation</Link>
      </View>
      {/*<ItemList items={items ?? []} />*/}
      <ItemList items={dublicateItems(items ?? [], 10)} />
    </SafeAreaView>
  );
}
