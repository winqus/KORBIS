import { View, Text, Image, ImageSourcePropType } from "react-native";
import React from "react";
import { Tabs } from "expo-router";
import icons from "@/constants/icons";

const TabIcon = ({
  focused,
  source,
  title,
}: {
  focused: boolean;
  source: ImageSourcePropType;
  title: string;
}) => (
  <View
    className={`flex-[1] flex-row justify-between items-center p-2.5 gap-2.5`}
  >
    <View
      className={`rounded-full size-14 items-center justify-center ${focused ? "bg-black" : "bg-gray-400"}`}
    >
      <Image
        source={source}
        tintColor="white"
        resizeMode="contain"
        className="size-7"
      />
    </View>
  </View>
);

const TabsLayout = () => {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "white",
        tabBarInactiveTintColor: "white",
        tabBarShowLabel: false,
        tabBarStyle: {
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          position: "absolute",
          height: 82,
          backgroundColor: "white",
          borderRadius: 50,
          paddingBottom: 0, // for iOS
          marginHorizontal: 30,
          marginBottom: 20,
        },
        tabBarItemStyle: { height: 35 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon source={icons.home} focused={focused} title="Home" />
          ),
        }}
      />
      <Tabs.Screen
        name="camera"
        options={{
          title: "Camera",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon source={icons.camera} focused={focused} title="Camera" />
          ),
          tabBarStyle: { display: "none" },
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon source={icons.person} focused={focused} title="Profile" />
          ),
        }}
      />
    </Tabs>
  );
};

export default TabsLayout;
