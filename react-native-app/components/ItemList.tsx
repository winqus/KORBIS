import { View, FlatList } from "react-native";
import React from "react";
import { Item } from "@/types";
import { ItemCard } from "@/components/ItemCards";

interface ItemListProps {
  items: Item[];
}

const ItemList = ({ items }: ItemListProps) => {
  const handleCardPress = (item: Item) => {
    console.log(`pressed item ${item.ID}`);
  };

  return (
    <View>
      <FlatList
        data={items}
        renderItem={({ item }) => (
          <ItemCard item={item} onPress={() => handleCardPress(item)} />
        )}
        keyExtractor={(item) => item.ID}
        numColumns={2}
        contentContainerClassName="pb-32"
        columnWrapperClassName="flex gap-5 px-5"
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

export default ItemList;
