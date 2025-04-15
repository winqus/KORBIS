import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import React from "react";
import { Container, Item } from "@/types";
import images from "@/constants/images";
import icons from "@/constants/icons";
import { FontAwesome } from "@expo/vector-icons";

const BackgroundGradient = () => (
  <Image
    source={images.cardGradient}
    className="size-full absolute bottom-0 z-10"
  />
);

const SkeletonName = () => (
  <View className="size-full flex flex-col justify-end items-start absolute p-2 z-20">
    <View className="flex-grow-0">
      <View className="w-24 h-6 bg-accent-100 rounded-xl mb-1 animate-pulse"></View>
    </View>
  </View>
);

const LoadingState = () => (
  <>
    <ActivityIndicator className="size-full" size="large" color="white" />
    <SkeletonName />
  </>
);

const GeneratingState = ({ imageURI }: { imageURI?: string }) => (
  <>
    {imageURI && (
      <Image
        source={{ uri: imageURI }}
        className="size-full"
        contentFit="cover"
        transition={200}
        blurRadius={4}
      />
    )}
    <View className="absolute size-full flex items-center justify-center">
      <Image
        source={icons.shines}
        className="size-12 animate-pulse"
        contentFit="contain"
        tintColor="white"
      />
    </View>
    <SkeletonName />
  </>
);

const DefaultImage = ({ imageURI }: { imageURI?: string }) => (
  <>
    {imageURI && (
      <Image
        source={{ uri: imageURI }}
        className="size-full"
        contentFit="cover"
      />
    )}
  </>
);

const ItemTextOverlay = ({ name }: { name: string }) => (
  <View className="size-full flex flex-col justify-end items-start absolute p-1 z-10">
    <View className="flex-grow-0">
      <Text className="text-base font-rubik-bold text-white ml-1 line-clamp-2">
        {name}
      </Text>
    </View>
  </View>
);

const ContainerTextOverlay = ({ name }: { name: string }) => (
  <View className="absolute bottom-0 left-0 right-0 p-2 h-12 bg-white/90 z-10 flex-row items-center gap-2.5">
    <FontAwesome name="folder" size={16} color="#666876" />
    <Text className="text-sm font-rubik-bold text-black-200 line-clamp-2 leading-none mr-6 ">
      {name}
    </Text>
  </View>
);

interface ItemCardProps {
  item?: Pick<Item, "id" | "name" | "imageUrl">;
  onPress?: () => void;
  onLongPress?: () => void;
  variant?: "default" | "loading" | "highlighted" | "generating";
  borderClassName?: string;
}

export const ItemCard = ({
  item,
  onPress,
  onLongPress,
  variant = "default",
  borderClassName = "",
}: ItemCardProps) => {
  const name = item?.name || "-";
  const imageURI = item?.imageUrl;
  let borderClass = borderClassName;
  if (variant === "generating") {
    borderClass = "border-4 border-primary-200";
  } else if (variant === "highlighted") {
    borderClass = "border-4 border-primary-200";
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={variant === "loading" || variant === "generating"}
      className={`flex-1 w-full h-44 mt-4 rounded-2xl bg-accent shadow-lg shadow-black-100/70 relative overflow-hidden ${borderClass}`}
    >
      {variant === "default" && <BackgroundGradient />}

      {variant === "loading" ? (
        <LoadingState />
      ) : variant === "generating" ? (
        <GeneratingState imageURI={imageURI} />
      ) : (
        <>
          <DefaultImage imageURI={imageURI} />
          <ItemTextOverlay name={name} />
        </>
      )}
    </TouchableOpacity>
  );
};

interface ContainerCardProps {
  container?: Pick<Container, "id" | "name" | "imageUrl">;
  onPress?: () => void;
  onLongPress?: () => void;
  variant?: "default" | "loading" | "highlighted" | "generating";
  borderClassName?: string;
}

export const ContainerCard = ({
  container,
  onPress,
  onLongPress,
  variant = "default",
  borderClassName = "",
}: ContainerCardProps) => {
  const name = container?.name || "-";
  const imageURI = container?.imageUrl;
  let borderClass = borderClassName;
  if (variant === "generating") {
    borderClass = "border-4 border-primary-200";
  } else if (variant === "highlighted") {
    borderClass = "border-4 border-primary-200";
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={variant === "loading" || variant === "generating"}
      className={`flex-1 w-full h-44 mt-4 rounded-2xl bg-accent shadow-lg shadow-black-100/70 relative overflow-hidden ${borderClass}`}
    >
      {variant === "default" && <BackgroundGradient />}

      {variant === "loading" ? (
        <LoadingState />
      ) : variant === "generating" ? (
        <GeneratingState imageURI={imageURI} />
      ) : (
        <>
          <DefaultImage imageURI={imageURI} />
          <ContainerTextOverlay name={name} />
        </>
      )}
    </TouchableOpacity>
  );
};
