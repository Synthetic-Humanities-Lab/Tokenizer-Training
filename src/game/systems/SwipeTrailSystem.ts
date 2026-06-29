export interface TrailPoint {
  x: number;
  y: number;
}

export interface TrailLayer {
  color: number;
  width: number;
  alpha: number;
}

export interface TrailSegment {
  layerIndex: number;
  from: TrailPoint;
  control: TrailPoint;
  to: TrailPoint;
  color: number;
  width: number;
  alpha: number;
}

export const SWIPE_TRAIL_FADE_MS = 220;
export const MAX_SWIPE_TRAIL_POINTS = 18;

export const ORANGE_BRUSH_TRAIL_LAYERS: TrailLayer[] = [
  { color: 0xffd9a3, width: 28, alpha: 0.24 },
  { color: 0xf28a2e, width: 13, alpha: 0.62 },
  { color: 0xffefbd, width: 4, alpha: 0.72 }
];

export function appendTrailPoint(points: TrailPoint[], point: TrailPoint, limit = MAX_SWIPE_TRAIL_POINTS): TrailPoint[] {
  return [...points, point].slice(-limit);
}

export function buildOrangeBrushTrailSegments(
  points: TrailPoint[],
  layers = ORANGE_BRUSH_TRAIL_LAYERS
): TrailSegment[] {
  if (points.length < 2) {
    return [];
  }

  return layers.flatMap((layer, layerIndex) => {
    return points.slice(1).map((point, index) => {
      const pointIndex = index + 1;
      const previous = points[pointIndex - 1];
      const age = pointIndex / Math.max(1, points.length - 1);
      const from = pointIndex === 1 ? previous : midpoint(points[pointIndex - 2], previous);
      const to = pointIndex === points.length - 1 ? point : midpoint(previous, point);

      return {
        layerIndex,
        from,
        control: previous,
        to,
        color: layer.color,
        width: Math.max(1, layer.width * (0.2 + age * 0.8)),
        alpha: layer.alpha * (0.18 + age * 0.82)
      };
    });
  });
}

function midpoint(a: TrailPoint, b: TrailPoint): TrailPoint {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2
  };
}
