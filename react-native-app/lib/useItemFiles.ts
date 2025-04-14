import { useState, useEffect } from "react";
import { Alert, Platform } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import * as IntentLauncher from "expo-intent-launcher";
import * as WebBrowser from "expo-web-browser";
import { File } from "../types";
import { getItemFiles, uploadItemFile, deleteItemFile } from "./supabase";

interface UseItemFilesReturn {
  files: File[];
  isLoading: boolean;
  fetchFiles: () => Promise<void>;
  uploadFile: () => Promise<void>;
  openFile: (file: File) => Promise<void>;
  deleteFile: (fileId: string) => Promise<void>;
}

export const useItemFiles = (
  itemId: string | undefined,
): UseItemFilesReturn => {
  const [files, setFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchFiles = async () => {
    if (!itemId) return;

    try {
      const fetchedFiles = await getItemFiles({ itemId });
      setFiles(fetchedFiles);
    } catch (error) {
      console.error("Error fetching files:", error);
    }
  };

  useEffect(() => {
    if (itemId) {
      fetchFiles();
    }
  }, [itemId]);

  const uploadFile = async () => {
    if (!itemId) return;

    try {
      setIsLoading(true);
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        type: "*/*",
      });

      if (result.canceled) {
        console.log("Document picking canceled");
        return;
      }

      const file = result.assets[0];
      const fileUri = file.uri;
      const fileName = file.name;

      console.log("Uploading file:", fileName);

      const uploadedFile = await uploadItemFile({
        itemId,
        fileUri,
        fileName,
      });

      if (uploadedFile) {
        await fetchFiles();
      } else {
        Alert.alert("Error", "Failed to upload file");
      }
    } catch (error) {
      console.error("File upload error:", error);
      Alert.alert("Error", "An error occurred while uploading the file");
    } finally {
      setIsLoading(false);
    }
  };

  const fileDir = FileSystem.cacheDirectory + "item_files/";
  const fileLocalPath = (fileId: string, fileName: string) =>
    fileDir + `${fileId}_${fileName}`;

  const ensureDirExists = async () => {
    const dirInfo = await FileSystem.getInfoAsync(fileDir);
    if (!dirInfo.exists) {
      console.log("File directory doesn't exist, creating…");
      await FileSystem.makeDirectoryAsync(fileDir, { intermediates: true });
    }
  };

  const openFile = async (file: File) => {
    try {
      await ensureDirExists();

      const localFileUri = fileLocalPath(file.id, file.name);
      const fileInfo = await FileSystem.getInfoAsync(localFileUri);

      if (!fileInfo.exists) {
        console.log("File isn't cached locally. Downloading…");
        await FileSystem.downloadAsync(file.fileUrl, localFileUri);
      }

      if (Platform.OS === "ios") {
        const contentUri = await FileSystem.getContentUriAsync(localFileUri);
        await WebBrowser.openBrowserAsync(contentUri);
      } else {
        const contentUri = await FileSystem.getContentUriAsync(localFileUri);
        await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
          data: contentUri,
          flags: 1,
        });
      }
    } catch (error) {
      console.error("Error opening file:", error);
      Alert.alert("Error", "Failed to open file");
    }
  };

  const deleteFile = async (fileId: string) => {
    Alert.alert("Delete File", "Are you sure you want to delete this file?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Delete",
        onPress: async () => {
          try {
            setIsLoading(true);
            const success = await deleteItemFile({
              itemId: itemId!,
              fileId,
            });
            if (success) {
              await fetchFiles();
            } else {
              Alert.alert("Error", "Failed to delete file");
            }
          } catch (error) {
            console.error("Error deleting file:", error);
            Alert.alert("Error", "An error occurred while deleting the file");
          } finally {
            setIsLoading(false);
          }
        },
        style: "destructive",
      },
    ]);
  };

  return {
    files,
    isLoading,
    fetchFiles,
    uploadFile,
    openFile,
    deleteFile,
  };
};
