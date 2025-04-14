import { useState, useEffect } from "react";
import { Alert, Platform } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import * as IntentLauncher from "expo-intent-launcher";
import * as WebBrowser from "expo-web-browser";
import { File } from "../types";
import { getItemFiles, uploadItemFile, deleteItemFile } from "./supabase";

export interface FileWithStatus extends File {
  isDownloaded: boolean;
}

interface UseItemFilesReturn {
  files: FileWithStatus[];
  isLoading: boolean;
  fetchFiles: () => Promise<void>;
  uploadFile: () => Promise<void>;
  openFile: (file: FileWithStatus) => Promise<void>;
  deleteFile: (fileId: string) => Promise<void>;
  checkFileStatus: (file: File) => Promise<boolean>;
}

export const useItemFiles = (
  itemId: string | undefined,
): UseItemFilesReturn => {
  const [files, setFiles] = useState<FileWithStatus[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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

  const checkFileStatus = async (file: File): Promise<boolean> => {
    await ensureDirExists();
    const localFileUri = fileLocalPath(file.id, file.name);
    const fileInfo = await FileSystem.getInfoAsync(localFileUri);
    return fileInfo.exists;
  };

  const addDownloadStatus = async (
    files: File[],
  ): Promise<FileWithStatus[]> => {
    const filesWithStatus = await Promise.all(
      files.map(async (file) => {
        const isDownloaded = await checkFileStatus(file);
        return { ...file, isDownloaded };
      }),
    );
    return filesWithStatus;
  };

  const fetchFiles = async () => {
    if (!itemId) return;

    try {
      const fetchedFiles = await getItemFiles({ itemId });
      const filesWithStatus = await addDownloadStatus(fetchedFiles);
      setFiles(filesWithStatus);
    } catch (error) {
      console.error("Error fetching files:", error);
    }
  };

  useEffect(() => {
    if (itemId) {
      fetchFiles();
    }
  }, [itemId]);

  const cacheFile = async (file: File) => {
    try {
      await ensureDirExists();
      const localFileUri = fileLocalPath(file.id, file.name);
      const fileInfo = await FileSystem.getInfoAsync(localFileUri);

      if (!fileInfo.exists) {
        console.log("Caching file locally:", file.name);
        await FileSystem.downloadAsync(file.fileUrl, localFileUri);
        return true;
      }
      return true;
    } catch (error) {
      console.error("Error caching file:", error);
      return false;
    }
  };

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
        if (uploadedFile.fileUrl) {
          await cacheFile(uploadedFile);
        }
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

  const openFile = async (file: FileWithStatus) => {
    try {
      await ensureDirExists();

      const localFileUri = fileLocalPath(file.id, file.name);
      const fileInfo = await FileSystem.getInfoAsync(localFileUri);

      if (!fileInfo.exists) {
        console.log("File isn't cached locally. Downloading…");
        await FileSystem.downloadAsync(file.fileUrl, localFileUri);

        setFiles((prevFiles) =>
          prevFiles.map((f) =>
            f.id === file.id ? { ...f, isDownloaded: true } : f,
          ),
        );
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
              const fileToDelete = files.find((f) => f.id === fileId);
              if (fileToDelete) {
                const localFileUri = fileLocalPath(
                  fileToDelete.id,
                  fileToDelete.name,
                );
                const fileInfo = await FileSystem.getInfoAsync(localFileUri);
                if (fileInfo.exists) {
                  await FileSystem.deleteAsync(localFileUri);
                }
              }
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
    checkFileStatus,
  };
};
