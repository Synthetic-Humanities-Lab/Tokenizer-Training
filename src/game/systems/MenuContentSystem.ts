export interface MenuCopy {
  premise: string;
  workOrderLabel: string;
  workOrderRows: string[];
}

export function menuCopy(): MenuCopy {
  return {
    premise: "Predict token boundaries. Accuracy extends the shift.",
    workOrderLabel: "WORK ORDER / HUMAN SEGMENTATION",
    workOrderRows: [
      "Predict learned token boundaries.",
      "Useful cuts earn pay.",
      "Misses and false cuts create company cost."
    ]
  };
}
