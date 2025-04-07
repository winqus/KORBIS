import {
  View,
  Text,
  Dimensions,
  Alert,
  Image,
  Platform,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import React from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { deleteItem, getItemById } from "@/lib/supabase";
import { useSupabase } from "@/lib/useSupabase";
import icons from "@/constants/icons";
import images from "@/constants/images";
import { DocumentPill } from "@/components/DocumentPill";
import { TagPill } from "@/components/TagPill";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { ParentAssetInfo } from "@/components/ParentAssetInfo";
import { Quantity } from "@/components/AssetQuantity";

const Item = () => {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  if (!id) {
    console.error("No item ID provided");
    Alert.alert("Error", "No item ID provided");
    router.replace("/");
  }

  const windowHeight = Dimensions.get("window").height;

  const { data: item } = useSupabase({
    fn: getItemById,
    params: {
      ID: id!,
    },
  });

  const handleDelete = () => {
    Alert.alert("Delete Item", "Are you sure you want to delete this item?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Delete",
        onPress: async () => {
          await deleteItem({ ID: id! });
          router.replace("/");
        },
        style: "destructive",
      },
    ]);
  };

  return (
    <View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-32 bg-white"
      >
        <View className="relative w-full" style={{ height: windowHeight / 2 }}>
          <Image
            source={{ uri: item?.imageURI }}
            className="size-full"
            resizeMode="cover"
          />
          <Image
            source={images.whiteGradient}
            className="absolute top-0 w-full z-40"
          />

          <View
            className="z-50 absolute inset-x-2"
            style={{
              top: Platform.OS === "ios" ? 60 : 10,
            }}
          >
            <View className="flex flex-row items-center w-full justify-between">
              <TouchableOpacity
                onPress={() => router.back()}
                className="flex flex-row size-12 items-center justify-center"
              >
                <Image
                  source={icons.back_caret_circle}
                  className="size-full"
                  tintColor={"white"}
                />
              </TouchableOpacity>

              <View className="flex flex-row items-center size-12">
                <Image
                  source={icons.heart}
                  className="size-7"
                  tintColor={"#191D31"}
                />
              </View>
            </View>
          </View>
        </View>

        <View className="flex flex-col px-5 py-6 gap-8">
          {/* Name and Tags*/}
          <View className="flex flex-col items-start gap-3">
            <View className="flex flex-row w-full justify-between items-center py-0.5 gap-2.5">
              <ParentAssetInfo
                parentType={item?.parentType}
                parentName={item?.parentName || "My Home"}
              />
              {item?.quantity! > 1 ? (
                <Quantity mode="read" value={item!.quantity} />
              ) : null}
            </View>
            <Text className="text-2xl font-rubik-bold" selectable={true}>
              {item?.name}
            </Text>

            <View className="flex flex-row items-center gap-1.5">
              <TagPill label="Item" />
              {/*<TagPill label="Drink" />*/}
              {/*<TagPill label="Glass" />*/}
            </View>
          </View>

          {/* Description */}
          <View className="flex flex-col items-start gap-3">
            <Text className="text-black-300 text-xl font-rubik-bold">
              Description
            </Text>
            <Text
              className="text-black-200 text-base font-rubik"
              selectable={true}
            >
              {item?.description || "No description available"}
            </Text>
          </View>

          {/* Documents */}
          <View className="flex flex-col items-start gap-3">
            <Text className="text-black-300 text-xl font-rubik-bold">
              Documents
            </Text>
            <View className="flex col items-start gap-4">
              <DocumentPill label="Manual.pdf" />
              <DocumentPill label="Long manual in English.pdf" />
              <DocumentPill label="2 Long manual in English .pdf" />
              <DocumentPill label="3 A truly honestly very very very long long long manual in English.pdf" />
            </View>
          </View>

          {/* Location */}
          <View className="flex flex-col items-start gap-3">
            <Text className="text-black-300 text-xl font-rubik-bold">
              Location
            </Text>
            <View className="flex flex-row items-center justify-start gap-2">
              <Image source={icons.location} className="w-7 h-7" />
              <Text
                className="text-black-200 text-sm font-rubik-medium"
                selectable={true}
              >
                Lithuania, Vilnius
              </Text>
            </View>
          </View>

          {/* Other */}
          <View className="flex flex-col items-start gap-3">
            <Text className="text-black-300 text-xl font-rubik-bold">
              Other
            </Text>
            <View className="flex flex-row items-center justify-start gap-2">
              <Text
                className="text-black-200 text-sm font-rubik-medium"
                selectable={true}
              >
                ID: {item?.ID}
              </Text>
            </View>
          </View>

          {/* Delete Button */}
          <View className="flex flex-col items-center justify-center py-8 gap-1 w-full">
            <TouchableOpacity
              onPress={handleDelete}
              className="flex flex-row items-center justify-center py-1.5 px-4 gap-1.5 w-32 h-9 border border-red-500 rounded-full"
            >
              <FontAwesome5 name="trash-alt" size={18} color="#FF0000" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default Item;
