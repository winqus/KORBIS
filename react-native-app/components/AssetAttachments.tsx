import React from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { DocumentPill } from "./DocumentPill";
import { File } from "../types";

interface AssetAttachmentsProps {
  files: (File & { isDownloaded?: boolean })[];
  isLoading: boolean;
  onUploadFile: () => void;
  onOpenFile: (file: File) => void;
  onDeleteFile: (fileId: string) => void;
}

export const AssetAttachments = ({
  files,
  isLoading,
  onUploadFile,
  onOpenFile,
  onDeleteFile,
}: AssetAttachmentsProps) => {
  return (
    <View className="flex flex-col items-start gap-3">
      <View className="flex flex-row justify-start items-center gap-2.5">
        <Text className="text-black-300 text-xl font-rubik-bold">
          Attachments
        </Text>
        <TouchableOpacity disabled={isLoading} onPress={onUploadFile}>
          <Feather
            name="file-plus"
            size={20}
            color="#666876"
            className="size-7"
          />
        </TouchableOpacity>
      </View>
      {isLoading ? (
        <ActivityIndicator size="small" color="#0061ff" />
      ) : files.length > 0 ? (
        <View className="flex flex-col items-start gap-4 w-full">
          {files.map((file) => (
            <DocumentPill
              key={file.id}
              label={file.originalName}
              onPress={() => onOpenFile(file)}
              onDelete={() => onDeleteFile(file.id)}
              isDownloaded={file.isDownloaded}
            />
          ))}
        </View>
      ) : (
        <Text
          className="text-black-200 text-sm font-rubik-medium"
          onPress={onUploadFile}
        >
          Tap + to add files
        </Text>
      )}
    </View>
  );
};
