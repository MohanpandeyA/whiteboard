import { ARROW_LENGTH, TOOL_ITEMS } from "../constants";
import getStroke from "perfect-freehand";
import rough from "roughjs/bin/rough";
import { getArrowHeadsCoordinates, isPointCloseToLine } from "./math";

const gen = rough.generator();

export const createElement = (id, x1, y1, x2, y2, { type, stroke, fill, size }) => {
  const element = { id, x1, y1, x2, y2, type, fill, stroke, size };
  let options = { seed: id + 1, fillStyle: "solid" };
  if (stroke) options.stroke = stroke;
  if (fill) options.fill = fill;
  if (size) options.strokeWidth = size;

  switch (type) {
    case TOOL_ITEMS.BRUSH: {
      const brushSize = size || 4;
      return {
        id, type, stroke, size: brushSize,
        points: [{ x: x1, y: y1 }],
        path: new Path2D(getSvgPathFromStroke(getStroke([{ x: x1, y: y1 }], {
          size: brushSize, thinning: 0.5, smoothing: 0.5, streamline: 0.5,
        }))),
      };
    }
    case TOOL_ITEMS.LINE:
      element.roughEle = gen.line(x1, y1, x2, y2, options);
      return element;
    case TOOL_ITEMS.RECTANGLE:
      element.roughEle = gen.rectangle(x1, y1, x2 - x1, y2 - y1, options);
      return element;
    case TOOL_ITEMS.CIRCLE: {
      const cx = (x1 + x2) / 2, cy = (y1 + y2) / 2;
      element.roughEle = gen.ellipse(cx, cy, x2 - x1, y2 - y1, options);
      return element;
    }
    case TOOL_ITEMS.DIAMOND: {
      const cx = (x1 + x2) / 2, cy = (y1 + y2) / 2;
      const hw = Math.abs(x2 - x1) / 2, hh = Math.abs(y2 - y1) / 2;
      const pts = [
        [cx, cy - hh],  // top
        [cx + hw, cy],  // right
        [cx, cy + hh],  // bottom
        [cx - hw, cy],  // left
        [cx, cy - hh],  // close
      ];
      element.roughEle = gen.linearPath(pts, options);
      return element;
    }
    case TOOL_ITEMS.ARROW: {
      const { x3, y3, x4, y4 } = getArrowHeadsCoordinates(x1, y1, x2, y2, ARROW_LENGTH);
      const pts = [[x1, y1], [x2, y2], [x3, y3], [x2, y2], [x4, y4]];
      element.roughEle = gen.linearPath(pts, options);
      return element;
    }
    case TOOL_ITEMS.TEXT:
      element.text = "";
      return element;
    default:
      throw new Error("Type not recognized: " + type);
  }
};

/**
 * Reconstruct a saved (plain JSON) element back into a drawable element.
 * Called when loading elements from the database.
 */
export const reconstructElement = (savedEl) => {
  const { id, type, x1, y1, x2, y2, stroke, fill, size, points, text } = savedEl;

  if (type === TOOL_ITEMS.ERASER) return { ...savedEl };

  if (type === TOOL_ITEMS.BRUSH) {
    const pts = points || [{ x: x1 || 0, y: y1 || 0 }];
    const brushSize = size || 4;
    return {
      id, type, stroke, size: brushSize, points: pts,
      path: new Path2D(getSvgPathFromStroke(getStroke(pts, {
        size: brushSize, thinning: 0.5, smoothing: 0.5, streamline: 0.5,
      }))),
    };
  }

  if (type === TOOL_ITEMS.TEXT) {
    return { id, type, x1, y1, x2, y2, stroke, size, text: text || "" };
  }

  const options = { seed: (id || 0) + 1, fillStyle: "solid" };
  if (stroke) options.stroke = stroke;
  if (fill) options.fill = fill;
  if (size) options.strokeWidth = size;

  const element = { id, type, x1, y1, x2, y2, stroke, fill, size };

  switch (type) {
    case TOOL_ITEMS.LINE:
      element.roughEle = gen.line(x1, y1, x2, y2, options);
      break;
    case TOOL_ITEMS.RECTANGLE:
      element.roughEle = gen.rectangle(x1, y1, x2 - x1, y2 - y1, options);
      break;
    case TOOL_ITEMS.CIRCLE: {
      const cx = (x1 + x2) / 2, cy = (y1 + y2) / 2;
      element.roughEle = gen.ellipse(cx, cy, x2 - x1, y2 - y1, options);
      break;
    }
    case TOOL_ITEMS.DIAMOND: {
      const cx = (x1 + x2) / 2, cy = (y1 + y2) / 2;
      const hw = Math.abs(x2 - x1) / 2, hh = Math.abs(y2 - y1) / 2;
      const pts = [[cx, cy - hh], [cx + hw, cy], [cx, cy + hh], [cx - hw, cy], [cx, cy - hh]];
      element.roughEle = gen.linearPath(pts, options);
      break;
    }
    case TOOL_ITEMS.ARROW: {
      const { x3, y3, x4, y4 } = getArrowHeadsCoordinates(x1, y1, x2, y2, ARROW_LENGTH);
      const pts = [[x1, y1], [x2, y2], [x3, y3], [x2, y2], [x4, y4]];
      element.roughEle = gen.linearPath(pts, options);
      break;
    }
    default:
      break;
  }

  return element;
};

/**
 * Get the axis-aligned bounding box of an element.
 * Returns { minX, minY, maxX, maxY }
 */
export const getElementBounds = (element) => {
  const { type, x1, y1, x2, y2, points, size } = element;
  const pad = (size || 1) / 2 + 4;

  if (type === TOOL_ITEMS.BRUSH || type === TOOL_ITEMS.ERASER) {
    if (!points || points.length === 0) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    const xs = points.map(p => p.x);
    const ys = points.map(p => p.y);
    return {
      minX: Math.min(...xs) - pad,
      minY: Math.min(...ys) - pad,
      maxX: Math.max(...xs) + pad,
      maxY: Math.max(...ys) + pad,
    };
  }

  if (type === TOOL_ITEMS.TEXT) {
    const canvas = document.getElementById("canvas");
    if (!canvas) return { minX: x1, minY: y1, maxX: x1 + 100, maxY: y1 + (size || 32) };
    const ctx = canvas.getContext("2d");
    ctx.font = `400 ${size || 32}px "Patrick Hand", sans-serif`;
    const w = ctx.measureText(element.text || "").width;
    const h = size || 32;
    return { minX: x1 - pad, minY: y1 - pad, maxX: x1 + w + pad, maxY: y1 + h + pad };
  }

  return {
    minX: Math.min(x1, x2) - pad,
    minY: Math.min(y1, y2) - pad,
    maxX: Math.max(x1, x2) + pad,
    maxY: Math.max(y1, y2) + pad,
  };
};

/**
 * Check if a point is inside an element's bounding box (for select tool).
 */
export const isPointInElement = (element, px, py) => {
  const { minX, minY, maxX, maxY } = getElementBounds(element);
  return px >= minX && px <= maxX && py >= minY && py <= maxY;
};

export const isPointNearElement = (element, pointX, pointY) => {
  const { x1, y1, x2, y2, type } = element;
  const context = document.getElementById("canvas").getContext("2d");
  switch (type) {
    case TOOL_ITEMS.LINE:
    case TOOL_ITEMS.ARROW:
      return isPointCloseToLine(x1, y1, x2, y2, pointX, pointY);
    case TOOL_ITEMS.RECTANGLE:
    case TOOL_ITEMS.CIRCLE:
    case TOOL_ITEMS.DIAMOND:
      return (
        isPointCloseToLine(x1, y1, x2, y1, pointX, pointY) ||
        isPointCloseToLine(x2, y1, x2, y2, pointX, pointY) ||
        isPointCloseToLine(x2, y2, x1, y2, pointX, pointY) ||
        isPointCloseToLine(x1, y2, x1, y1, pointX, pointY)
      );
    case TOOL_ITEMS.BRUSH:
      return context.isPointInPath(element.path, pointX, pointY);
    case TOOL_ITEMS.TEXT: {
      context.font = `400 ${element.size}px "Patrick Hand", sans-serif`;
      const textWidth = context.measureText(element.text).width;
      const textHeight = parseInt(element.size);
      context.restore();
      return (
        isPointCloseToLine(x1, y1, x1 + textWidth, y1, pointX, pointY) ||
        isPointCloseToLine(x1 + textWidth, y1, x1 + textWidth, y1 + textHeight, pointX, pointY) ||
        isPointCloseToLine(x1 + textWidth, y1 + textHeight, x1, y1 + textHeight, pointX, pointY) ||
        isPointCloseToLine(x1, y1 + textHeight, x1, y1, pointX, pointY)
      );
    }
    default:
      return false;
  }
};

export const getSvgPathFromStroke = (stroke) => {
  if (!stroke.length) return "";
  const d = stroke.reduce(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length];
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
      return acc;
    },
    ["M", ...stroke[0], "Q"]
  );
  return d.join(" ");
};
