import { FlatList, ImageSourcePropType, Pressable } from "react-native";
import React, { useState } from "react";
import { Image } from "expo-image";

export const SmallImageList = ({
  onSelect,
  onCloseModal,
  images,
}: {
  onSelect: (image: ImageSourcePropType) => void;
  onCloseModal: () => void;
  images: ImageSourcePropType[];
}) => {
  const [imageList] = useState<ImageSourcePropType[]>(images);

  return (
    <FlatList
      horizontal
      showsHorizontalScrollIndicator={false}
      data={imageList}
      keyExtractor={(_, index) => index.toString()}
      contentContainerStyle={{
        paddingHorizontal: 20,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,
      }}
      renderItem={({ item }) => (
        <Pressable
          onPress={() => {
            onSelect(item);
            onCloseModal();
          }}
          className="mr-5"
        >
          <Image
            source={item}
            contentFit="contain"
            className="size-24 bg-red-500"
          />
        </Pressable>
      )}
    />
  );
};
