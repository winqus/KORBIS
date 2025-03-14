import { View } from "react-native";
import React, { ReactNode } from "react";

interface StaticFooterMenuProps {
  children: ReactNode;
  containerClass?: string;
}

const StaticFooterMenu = ({
  children,
  containerClass,
}: StaticFooterMenuProps) => {
  return (
    <View
      className={`absolute bottom-0 bg-white w-full rounded-t-[2.25rem] border-t border-r border-l border-primary-200 ${containerClass || ""}`}
    >
      <View className="flex flex-col justify-center items-center gap-6 py-6 px-9">
        {children}
      </View>
    </View>
  );
};
export default StaticFooterMenu;
