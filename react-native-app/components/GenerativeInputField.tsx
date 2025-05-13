import {
  View,
  Text,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  ImageSourcePropType,
  Image,
  TextInput,
  Platform,
  TouchableOpacity,
  Keyboard,
  ActivityIndicator,
  TextInputProps,
} from "react-native";
import React from "react";
import icons from "@/constants/icons";

interface GenerativeInputFieldProps extends TextInputProps {
  label?: string;
  placeholder: string;
  value: string;
  isLoading?: boolean;
  onChangeText: (text: string) => void;
  onClear?: () => void;
  icon?: ImageSourcePropType;
  labelClass?: string;
  containerClass?: string;
  iconClass?: string;
  inputClass?: string;
}

const GenerativeInputField = ({
  label,
  placeholder,
  value,
  isLoading,
  onChangeText,
  onClear,
  icon,
  containerClass,
  labelClass,
  iconClass,
  inputClass,
  ...props
}: GenerativeInputFieldProps) => {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View className="flex flex-col w-full justify-center items-start py-1.5 px-5">
          {label && (
            <Text className={`text-xl font-rubik-semibold ${labelClass || ""}`}>
              {label}
            </Text>
          )}
          <View
            className={`flex flex-row justify-start items-center relative gap-1 min-h-14 ${containerClass}`}
          >
            {icon && (
              <Image
                source={icon}
                className={`size-6 ${iconClass}`}
                tintColor="#0061FF"
              />
            )}
            {!isLoading && (
              <TextInput
                testID="__generative-input-field__"
                className={`flex-1 font-rubik text-justify ${inputClass || "text-black-200 text-3xl leading-[3rem]"} `}
                placeholder={placeholder}
                onChangeText={onChangeText}
                value={value}
                importantForAutofill="no"
                autoComplete="off"
                placeholderTextColor="#8C8E98"
                {...props}
              />
            )}
            {isLoading && (
              <View className="flex-1 w-full items-start">
                <ActivityIndicator size="large" color="#0061FF" />
              </View>
            )}
            {onClear && value && (
              <TouchableOpacity onPress={onClear}>
                <Image source={icons.clear} className={`size-6 ${iconClass}`} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

export default GenerativeInputField;
