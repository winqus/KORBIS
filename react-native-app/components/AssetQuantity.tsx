import { View, TouchableOpacity, Text } from "react-native";
import React from "react";
import Entypo from "@expo/vector-icons/Entypo";

type EditQuantityProps = {
  value: number;
  onDecrease: () => void;
  onIncrease: () => void;
  minValue?: number;
};

const EditQuantity = ({
  value,
  onDecrease,
  onIncrease,
  minValue = 1,
}: EditQuantityProps) => {
  return (
    <View
      testID="__edit-asset-quantity__"
      className="flex-row justify-center items-center gap-4"
    >
      <TouchableOpacity
        testID="__decrease-edit-asset-quantity__"
        onPress={onDecrease}
        disabled={value <= minValue}
        className="w-6 h-6 rounded-full justify-center items-center bg-primary-100"
      >
        <Entypo name="minus" size={16} color="black" />
      </TouchableOpacity>

      <Text className="font-bold text-xs text-black-300">{value}</Text>

      <TouchableOpacity
        testID="__increase-edit-asset-quantity__"
        onPress={onIncrease}
        className="w-6 h-6 rounded-full justify-center items-center bg-primary-100"
      >
        <Entypo name="plus" size={16} color="black" />
      </TouchableOpacity>
    </View>
  );
};

type ReadQuantityProps = {
  value: number;
};

const ReadQuantity = ({ value }: ReadQuantityProps) => {
  return (
    <View
      testID="__read-asset-quantity__"
      className="min-w-20 h-6 p-0.5 rounded-full justify-center items-center bg-primary-100"
    >
      <Text className="font-rubik-semibold text-xs text-black-300">
        {value} {value === 1 ? "unit" : "units"}
      </Text>
    </View>
  );
};

type QuantityProps = {
  value: number;
  onDecrease?: () => void;
  onIncrease?: () => void;
  minValue?: number;
  mode?: "edit" | "read";
};

const Quantity = ({
  value,
  onDecrease,
  onIncrease,
  minValue = 1,
  mode = "read",
}: QuantityProps) => {
  if (mode === "read") {
    return <ReadQuantity value={value} />;
  }

  return (
    <EditQuantity
      value={value}
      onDecrease={onDecrease || (() => {})}
      onIncrease={onIncrease || (() => {})}
      minValue={minValue}
    />
  );
};

export { Quantity, EditQuantity, ReadQuantity };
