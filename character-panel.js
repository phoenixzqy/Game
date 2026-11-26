// The source stateitem offsets share this anchor on both native paperdolls.
export const characterArt = { width: 289, height: 302, anchorX: 50, anchorY: 80 };
export const characterEquipmentLayout = [
  { slot: 0, x: 57, y: 48, width: 65, height: 111, body: true },
  { slot: 1, x: 123, y: 104, width: 57, height: 128, body: true },
  { slot: 2, x: 125, y: 61, width: 42, height: 42, body: true },
  ...[
    [14, 7, 135],
    [5, 7, 177],
    [7, 7, 220],
    [4, 249, 135],
    [6, 249, 177],
    [8, 249, 220],
    [3, 10, 264],
    [10, 56, 264],
    [11, 102, 264],
    [12, 148, 264],
    [9, 194, 264],
    [13, 241, 264],
  ].map(([slot, x, y]) => ({ slot, x, y, width: 33, height: 32, body: false })),
];

