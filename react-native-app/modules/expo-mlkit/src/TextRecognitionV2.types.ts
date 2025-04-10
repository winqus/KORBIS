export type Rect = {
  left: number;
  top: number;
  height: number;
  width: number;
};

export type Line = {
  text: string;
  rect: Rect;
};

export type Block = {
  text: string;
  rect: Rect;
  lines: Line[];
};

export type TextRecognitionResult = {
  width: number;
  height: number;
  blocks: Block[];
  text: string;
};
