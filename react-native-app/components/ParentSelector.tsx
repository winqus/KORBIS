import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { Container } from "../types";
import { ParentAssetInfo } from "./ParentAssetInfo";
import { Feather } from "@expo/vector-icons";

type ParentSelectorProps = {
  currentParentId?: string;
  currentParentType?: "root" | "container";
  currentParentName?: string;
  onSelectParent: (parent: {
    id?: string;
    type?: "root" | "container";
    name?: string;
  }) => void;
  containers: Container[];
  isLoading: boolean;
};

type RootItem = {
  id: string;
  type: "root";
  name: string;
};

const ParentSelector = ({
  currentParentId,
  currentParentType,
  currentParentName = "My Home",
  onSelectParent,
  containers,
  isLoading,
}: ParentSelectorProps) => {
  const [modalVisible, setModalVisible] = useState(false);

  const handleSelectContainer = (container: Container) => {
    onSelectParent({
      id: container.id,
      type: "container",
      name: container.name,
    });
    setModalVisible(false);
  };

  const handleSelectRoot = () => {
    onSelectParent({
      id: undefined,
      type: "root",
      name: "My Home",
    });
    setModalVisible(false);
  };

  const rootItem: RootItem = {
    id: "root",
    type: "root",
    name: "My Home",
  };

  return (
    <View>
      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        className="flex flex-row items-center gap-2 border-4 border-primary-200 rounded-xl p-2"
      >
        <ParentAssetInfo
          parentType={currentParentType}
          parentName={currentParentName || "My Home"}
        />
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-5 h-2/3">
            <View className="flex-row justify-between items-center mb-5">
              <Text className="text-xl font-rubik-bold text-primary-300">
                Select Parent
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Feather name="x" size={24} color="#666876" />
              </TouchableOpacity>
            </View>

            {isLoading ? (
              <ActivityIndicator size="large" color="#0061ff" />
            ) : (
              <FlatList
                data={[rootItem, ...containers] as (Container | RootItem)[]}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => {
                  if (item.id === "root") {
                    return (
                      <TouchableOpacity
                        onPress={handleSelectRoot}
                        className={`p-4 border-b border-gray-200 flex-row items-center ${
                          !currentParentId ? "bg-blue-50" : ""
                        }`}
                      >
                        <ParentAssetInfo
                          parentType="root"
                          parentName="My Home"
                        />
                        {!currentParentId && (
                          <View className="ml-auto">
                            <Feather name="check" size={20} color="#0061ff" />
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  }

                  return (
                    <TouchableOpacity
                      onPress={() => handleSelectContainer(item as Container)}
                      className={`p-4 border-b border-gray-200 flex-row items-center ${
                        currentParentId === item.id ? "bg-blue-50" : ""
                      }`}
                    >
                      <ParentAssetInfo
                        parentType="container"
                        parentName={item.name}
                      />
                      {currentParentId === item.id && (
                        <View className="ml-auto">
                          <Feather name="check" size={20} color="#0061ff" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                }}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default ParentSelector;
