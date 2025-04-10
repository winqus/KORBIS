import {
  View,
  Text,
  ActivityIndicator,
  Button,
  TouchableOpacity,
} from "react-native";
import React, { useRef, useState } from "react";
import { CameraType, CameraView, useCameraPermissions } from "expo-camera";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation, useRouter } from "expo-router";
import { mostRecentlyTakenPictureUri } from "@/lib/signals";
import { CameraOld } from "@/components/CameraOld";

const Camera = () => {
  return <CameraOld />;
};

export default Camera;
