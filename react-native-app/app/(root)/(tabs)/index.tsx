import { Image, Text, TouchableOpacity, View } from "react-native";
import { Link } from "expo-router";
import { logout } from "@/lib/supabase";
import { useGlobalContext } from "@/lib/global-provider";

export default function Index() {
  const { user, refetch } = useGlobalContext();
  const handleSignOut = async () => {
    await logout();
    refetch({});
  };
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Image source={{ uri: user?.avatar }} className="size-12 rounded-full" />
      <Text className="font-bold my-10 font-rubik text-3xl text-center">
        Welcome to Korbis,{"\n"}
        {user?.name.split(" ")[0]}
      </Text>
      <Link href="/explore">Explore</Link>
      <Link href="/profile">Profile</Link>
      <Link href="/properties/1">Property</Link>

      <TouchableOpacity onPress={handleSignOut}>
        <Text>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}
