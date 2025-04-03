// TODO remove
export interface Item {
  ID: string;
  name: string;
  description: string;
  imageID?: string;
}

export type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;

export type Scored<T> = T & { score: number };
