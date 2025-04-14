import { View, Text } from "react-native";
import React from "react";
import { Container, Item } from "@/types";
import { ContainerCard, ItemCard } from "@/components/ItemCards";
import NoResults from "@/components/NoResults";
import { FlashList } from "@shopify/flash-list";

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
    <FlashList
      data={Array.from({ length: 6 })}
      renderItem={({ item, index }) => (
        <View
          className={`flex-1 mx-5 ${index % 2 === 0 ? "mr-2.5" : "ml-2.5"}`}
        >
          <ItemCard
            item={{
              id: "skeleton",
              name: "Skeleton",
              imageUrl: "",
            }}
            variant="loading"
            onPress={() => {}}
          />
        </View>
      )}
      estimatedItemSize={10}
      numColumns={2}
      contentContainerClassName="pb-64"
      showsVerticalScrollIndicator={false}
    />
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
    <View className="flex-1">
      <FlashList
        data={assets}
        estimatedItemSize={4}
        renderItem={({ item: asset, index }) => {
          return (
            <View
              className={`flex-1 mx-5 ${index % 2 === 0 ? "mr-2.5" : "ml-2.5"}`}
            >
              {asset.type === "item" ? (
                <ItemCard item={asset} onPress={() => onCardPress(asset)} />
              ) : (
                <ContainerCard
                  container={asset}
                  onPress={() => onCardPress(asset)}
                />
              )}
            </View>
          );
        }}
        keyExtractor={(asset) => asset.id}
        numColumns={2}
        contentContainerClassName="pb-64"
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={listEmptyComponent}
        ListHeaderComponent={listHeaderComponent}
      />
    </View>
  );
};

export default ItemList;
