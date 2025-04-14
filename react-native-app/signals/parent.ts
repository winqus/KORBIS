import { computed, Signal, signal } from "@preact/signals-react";
export type CurrentParentContext = {
  type: "root" | "container";
  name: string;
  id?: string;
};

const rootParent: CurrentParentContext = {
  type: "root",
  name: "My Home",
  id: undefined,
};

export const parentStack = signal<CurrentParentContext[]>([rootParent]);

export const currentParentAsset = computed(() => {
  const stack = parentStack.value;
  return stack[stack.length - 1] ?? rootParent;
});

export function pushParent(newParent: CurrentParentContext) {
  parentStack.value = [...parentStack.value, newParent];
}

export function popParent() {
  if (parentStack.value.length > 1) {
    parentStack.value = parentStack.value.slice(0, -1);
  }
}
