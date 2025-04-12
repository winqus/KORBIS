import React, { useEffect, useState } from "react";
import { BackHandler, View } from "react-native";
import { VisualAssetCreator } from "./VisualAssetCreator";
import { VisualAssetFinder } from "./VisualAssetFinder";
import { AddFindOptionsSegment } from "@/components/ItemCameraControls";
import { CloseButton } from "@/components/Buttons";
import { AutoCreateItemsPayload } from "@/signals/queue";
import { Item } from "@/types";

type ProcessMode = "add" | "find";

interface PhotoProcessorProps {
  image: { uri: string; width: number; height: number };
  onCancel: () => void;
  onAutoCreate: (payload: AutoCreateItemsPayload) => void;
  onManualAdd: (candidates: { quantity: number; imageUri: string }[]) => void;
  onItemSelect: (item: Item) => void;
  initialMode?: ProcessMode;
  debug?: boolean;
}

export const PhotoProcessor = ({
  image,
  onCancel,
  onAutoCreate,
  onManualAdd,
  onItemSelect,
  initialMode = "add",
  debug = false,
}: PhotoProcessorProps) => {
  const [mode, setMode] = useState<ProcessMode>(initialMode);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        onCancel();

        return true; /* prevent default behavior */
      },
    );
    return () => backHandler.remove();
  }, [onCancel]);

  return (
    <View className="flex-1">
      <CloseButton onCancel={onCancel} className="left-2 absolute top-1" />
      <AddFindOptionsSegment
        onPressAdd={() => setMode("add")}
        onPressFind={() => setMode("find")}
        activeOption={mode}
        containerClassName="absolute top-0 left-0 right-0 z-10 pt-2 pb-1 bg-black/70"
      />

      {/* Content based on mode */}
      {mode === "add" ? (
        <VisualAssetCreator
          image={image}
          onCancel={onCancel}
          onAutoCreate={onAutoCreate}
          onManualAdd={onManualAdd}
          debug={debug}
        />
      ) : (
        <VisualAssetFinder
          image={image}
          onCancel={onCancel}
          onItemSelect={onItemSelect}
          debug={debug}
        />
      )}
    </View>
  );
};
