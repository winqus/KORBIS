import { View, FlatList, ActivityIndicator, Text } from "react-native";
import React from "react";
import { Container, Item } from "@/types";
import { ContainerCard, ItemCard } from "@/components/ItemCards";
import NoResults from "@/components/NoResults";

interface ItemListProps {
  assets: (Item | Container)[];
  onCardPress: (item: Item | Container) => void;
  loading?: boolean;
  showHeader?: boolean;
  customHeader?: React.ReactElement;
}

const ItemList = ({
  assets,
  loading,
  showHeader,
  customHeader,
  onCardPress,
}: ItemListProps) => {
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
            {assets.length} items
          </Text>
        </View>
      ));

  return (
    <View>
      <FlatList
        data={assets}
        renderItem={({ item: asset }) => {
          return (
            <>
              {asset.type === "item" ? (
                <ItemCard item={asset} onPress={() => onCardPress(asset)} />
              ) : (
                <ContainerCard
                  container={asset}
                  onPress={() => onCardPress(asset)}
                />
              )}
            </>
          );
        }}
        keyExtractor={(asset) => asset.id}
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
