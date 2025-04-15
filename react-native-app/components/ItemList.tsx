import { View, Text, ActivityIndicator } from "react-native";
import React from "react";
import { Container, Item, IVirtualAsset } from "@/types";
import { ContainerCard, ItemCard } from "@/components/ItemCards";
import NoResults from "@/components/NoResults";
import { FlashList } from "@shopify/flash-list";

interface ItemListProps {
  assets: IVirtualAsset[];
  onCardPress: (item: IVirtualAsset) => void;
  loading?: boolean;
  showHeader?: boolean;
  customHeader?: React.ReactElement;
  listRef?: React.RefObject<FlashList<IVirtualAsset>>;
  onScroll?: (event: any) => void;
  onLoad?: () => void;
}

const ItemList = ({
  assets,
  loading,
  showHeader,
  customHeader,
  onCardPress,
  listRef,
  onScroll,
  onLoad,
}: ItemListProps) => {
  const listEmptyComponent = loading ? (
    <ActivityIndicator color="#0061FF" />
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

  const skeletons: IVirtualAsset[] = Array.from({ length: 20 }).map(
    (_, index) => ({
      id: `skeleton-${index}`,
      type: "item",
      name: "Skeleton",
      imageUrl: "",
      ownerId: "skeleton",
    }),
  );

  return (
    <View className="flex-1">
      <FlashList
        ref={listRef}
        onScroll={onScroll}
        onContentSizeChange={onLoad}
        scrollEventThrottle={16}
        data={loading ? skeletons : assets}
        estimatedItemSize={50}
        renderItem={({ item: asset, index }) => {
          if (loading) {
            return (
              <View
                className={`flex-1 mx-5 ${index % 2 === 0 ? "mr-2.5" : "ml-2.5"}`}
              >
                <ItemCard item={asset} onPress={() => {}} variant="loading" />
              </View>
            );
          }

          // Check if this is a queue item that should be shown in generating state
          const isQueueItem =
            asset.ownerId === "queue" || asset.ownerId === "manual-queue";
          const variant = isQueueItem ? "generating" : "default";

          return (
            <View
              className={`flex-1 mx-5 ${index % 2 === 0 ? "mr-2.5" : "ml-2.5"}`}
            >
              {asset.type === "item" ? (
                <ItemCard
                  item={asset}
                  onPress={() => onCardPress(asset)}
                  variant={variant}
                />
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
