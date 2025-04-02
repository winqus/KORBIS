import { View, Image, TextInput, TouchableOpacity } from "react-native";
import React, { useEffect, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import icons from "@/constants/icons";
import { useDebouncedCallback } from "use-debounce";

const SearchBar = () => {
  const params = useLocalSearchParams<{
    queryText?: string;
    queryImageUri?: string;
  }>();
  const [searchText, setSearchText] = useState(params.queryText);
  const [searchImageUri, setSearchImageUri] = useState(params.queryImageUri);

  useEffect(() => {
    setSearchText(params.queryText);
    setSearchImageUri(params.queryImageUri);
  }, [params.queryText, params.queryImageUri]);

  const debouncedTextSearch = useDebouncedCallback((text: string) => {
    router.setParams({ queryText: text });
  }, 500);

  const handleTextSearch = (text: string) => {
    setSearchText(text);
    debouncedTextSearch(text);
  };

  const handleClear = () => {
    router.setParams({
      queryText: "",
      queryImageUri: "",
    });
  };

  return (
    <View className="flex flex-row items-center justify-between w-full px-4 rounded-lg bg-accent-100 border border-primary-100 mt-5 py-2">
      <View className="flex-1 flex flex-row items-center justify-start z-10 gap-3">
        <Image source={icons.search} className="size-5" />
        {searchImageUri && (
          <Image
            source={{ uri: searchImageUri }}
            className="w-12 h-9 rounded-md"
            resizeMode="cover"
          />
        )}
        <TextInput
          value={searchText}
          onChangeText={handleTextSearch}
          placeholder="Search anything"
          className="text-sm font-rubik text-black-300 flex-1"
        />
      </View>

      {(searchText || searchImageUri) && (
        <TouchableOpacity
          onPress={handleClear}
          className="flex justify-center items-center size-5"
        >
          <Image source={icons.clear} className="size-5" />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default SearchBar;
