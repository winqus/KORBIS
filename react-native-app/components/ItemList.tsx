import { View, FlatList, ActivityIndicator, Text } from "react-native";
import React from "react";
import { Item } from "@/types";
import { ItemCard } from "@/components/ItemCards";
import NoResults from "@/components/NoResults";

interface ItemListProps {
  items: Item[];
  loading?: boolean;
  showHeader?: boolean;
  customHeader?: React.ReactElement;
}

const ItemList = ({
  items,
  loading,
  showHeader,
  customHeader,
}: ItemListProps) => {
  const handleCardPress = (item: Item) => {
    console.log(`pressed item ${item.ID}`);
  };

  const listEmptyComponent = loading ? (
    <ActivityIndicator size="large" className="text-primary-300 mt-5" />
  ) : (
    <NoResults />
  );

  const listHeaderComponent = !showHeader
    ? null
    : (customHeader ?? (
        <View className="flex gap-3">
          <Text className="text-2xl font-rubik-bold text-primary-500 mt-5 ml-5">
            Inventory
          </Text>
          <Text className="text-lg text-primary-300 ml-5">
            {items.length} items
          </Text>
        </View>
      ));

  return (
    <View>
      <FlatList
        data={items}
        renderItem={({ item }) => (
          <ItemCard item={item} onPress={() => handleCardPress(item)} />
        )}
        keyExtractor={(item) => item.ID}
        numColumns={2}
        contentContainerClassName="pb-64"
        columnWrapperClassName="flex gap-5 px-5"
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={listEmptyComponent}
        ListHeaderComponent={listHeaderComponent}
      />
    </View>
  );
};

export default ItemList;
