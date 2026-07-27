export interface MenuCopy {
  premise: string;
  workOrderLabel: string;
  workOrderRows: string[];
}

export function menuCopy(): MenuCopy {
  return {
    premise: "Predict token boundaries. Verified tokens extend the shift.",
    workOrderLabel: "WORK ORDER / HUMAN SEGMENTATION",
    workOrderRows: [
      "Predict learned token boundaries.",
      "Exact tokens earn Token Credits.",
      "Rework spends them. Zero closes the queue."
    ]
  };
}
