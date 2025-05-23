import { ExpoItemCamera } from "@/components/ExpoItemCamera";
import { useEffect, useState } from "react";
import { CameraItemOption } from "@/components/ItemCameraControls";
import { PhotoProcessor } from "@/components/PhotoProcessor";
import { SafeAreaView } from "react-native-safe-area-context";
import { ImageType, Item } from "@/types";
import { useIsFocused } from "@react-navigation/core";
import { AutoCreateItemsPayload, enqueueJobs } from "@/signals/queue";
import { useRouter } from "expo-router";
import { signal } from "@preact/signals-react";

export const manualCandidates = signal<
  { quantity: number; imageUri: string }[]
>([]);

const Camera = () => {
  const router = useRouter();
  const [activeOption, setActiveOption] = useState<CameraItemOption>("add");
  const [photo, setPhoto] = useState<ImageType | null>(null);
  const isFocused = useIsFocused();

  useEffect(() => {
    if (!isFocused) {
      setPhoto(null);
    }
  }, [isFocused]);

  const handlePictureTaken = (image: ImageType) => {
    setPhoto(image);
  };

  const handleCancel = () => {
    setPhoto(null);
  };

  const handleAutoCreate = (payload: AutoCreateItemsPayload) => {
    enqueueJobs(payload);
    router.push("/");
  };

  const handleManualAdd = (
    candidates: { quantity: number; imageUri: string }[],
  ) => {
    if (candidates.length > 0) {
      manualCandidates.value = candidates;

      processNextCandidate();
    }
  };

  const processNextCandidate = () => {
    if (manualCandidates.value.length > 0) {
      const firstCandidate = manualCandidates.value[0];

      router.push({
        pathname: "/item-creation",
        params: {
          initialQuantity: firstCandidate.quantity.toString(),
          initialPictureUri: firstCandidate.imageUri,
          remainingCandidates: (manualCandidates.value.length - 1).toString(),
        },
      });
    }
  };

  const handleItemSelect = (item: Item) => {
    router.push({
      pathname: "/items/[id]",
      params: { id: item.id, itemData: JSON.stringify(item) },
    });
  };

  const handleActiveOptionChange = (option: CameraItemOption) => {
    setActiveOption(option);
  };

  return (
    <SafeAreaView className="flex-1">
      {photo ? (
        <PhotoProcessor
          image={photo}
          onCancel={handleCancel}
          onAutoCreate={handleAutoCreate}
          onManualAdd={handleManualAdd}
          onItemSelect={handleItemSelect}
          initialMode={activeOption}
          debug={false}
        />
      ) : (
        <ExpoItemCamera
          onPhotoTaken={handlePictureTaken}
          onActiveOptionChange={handleActiveOptionChange}
        />
      )}
    </SafeAreaView>
  );
};

export default Camera;
