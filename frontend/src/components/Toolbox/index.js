import React, { useContext } from "react";
import cx from "classnames";
import classes from "./index.module.css";
import {
  COLORS,
  FILL_TOOL_TYPES,
  SIZE_TOOL_TYPES,
  STROKE_TOOL_TYPES,
  TOOL_ITEMS,
} from "../../constants";
import toolboxContext from "../../store/toolbox-context";
import boardContext from "../../store/board-context";

// Primary palette: black, white, red first — then the rest
const PRIMARY_COLORS = [
  COLORS.BLACK,
  COLORS.WHITE,
  COLORS.RED,
  COLORS.BLUE,
  COLORS.GREEN,
  COLORS.ORANGE,
  COLORS.YELLOW,
];

const Toolbox = () => {
  const { activeToolItem } = useContext(boardContext);
  const { toolboxState, changeStroke, changeFill, changeSize } =
    useContext(toolboxContext);

  // Don't show toolbox for tools with no configurable properties
  const hasOptions =
    STROKE_TOOL_TYPES.includes(activeToolItem) ||
    FILL_TOOL_TYPES.includes(activeToolItem) ||
    SIZE_TOOL_TYPES.includes(activeToolItem);

  if (!hasOptions) return null;

  const strokeColor = toolboxState[activeToolItem]?.stroke;
  const fillColor = toolboxState[activeToolItem]?.fill;
  const size = toolboxState[activeToolItem]?.size;

  return (
    <div className={classes.container}>
      {STROKE_TOOL_TYPES.includes(activeToolItem) && (
        <div className={classes.selectOptionContainer}>
          <div className={classes.toolBoxLabel}>Stroke</div>
          <div className={classes.colorsContainer}>
            <input
              className={classes.colorPicker}
              type="color"
              value={strokeColor}
              onChange={(e) => changeStroke(activeToolItem, e.target.value)}
            />
            {PRIMARY_COLORS.map((color) => (
              <div
                key={color}
                className={cx(classes.colorBox, {
                  [classes.activeColorBox]: strokeColor === color,
                })}
                style={{
                  backgroundColor: color,
                  border: color === "#ffffff" ? "1.5px solid #d1d5db" : undefined,
                }}
                onClick={() => changeStroke(activeToolItem, color)}
              />
            ))}
          </div>
        </div>
      )}

      {FILL_TOOL_TYPES.includes(activeToolItem) && (
        <div className={classes.selectOptionContainer}>
          <div className={classes.toolBoxLabel}>Fill</div>
          <div className={classes.colorsContainer}>
            {fillColor === null ? (
              <input
                className={classes.colorPicker}
                type="color"
                value="#000000"
                onChange={(e) => changeFill(activeToolItem, e.target.value)}
              />
            ) : (
              <input
                className={classes.colorPicker}
                type="color"
                value={fillColor}
                onChange={(e) => changeFill(activeToolItem, e.target.value)}
              />
            )}
            {/* No fill option */}
            <div
              className={cx(classes.colorBox, classes.noFillColorBox, {
                [classes.activeColorBox]: fillColor === null,
              })}
              onClick={() => changeFill(activeToolItem, null)}
              title="No fill"
            />
            {PRIMARY_COLORS.map((color) => (
              <div
                key={color}
                className={cx(classes.colorBox, {
                  [classes.activeColorBox]: fillColor === color,
                })}
                style={{
                  backgroundColor: color,
                  border: color === "#ffffff" ? "1.5px solid #d1d5db" : undefined,
                }}
                onClick={() => changeFill(activeToolItem, color)}
              />
            ))}
          </div>
        </div>
      )}

      {SIZE_TOOL_TYPES.includes(activeToolItem) && (
        <div className={classes.selectOptionContainer}>
          <div className={classes.toolBoxLabel}>
            {activeToolItem === TOOL_ITEMS.TEXT
              ? "Font Size"
              : activeToolItem === TOOL_ITEMS.ERASER
              ? "Eraser Size"
              : activeToolItem === TOOL_ITEMS.BRUSH
              ? "Brush Size"
              : "Stroke Size"}
          </div>
          <input
            className={classes.sizeSlider}
            type="range"
            min={
              activeToolItem === TOOL_ITEMS.TEXT ? 12
              : activeToolItem === TOOL_ITEMS.ERASER ? 5
              : activeToolItem === TOOL_ITEMS.BRUSH ? 1
              : 1
            }
            max={
              activeToolItem === TOOL_ITEMS.TEXT ? 64
              : activeToolItem === TOOL_ITEMS.ERASER ? 60
              : activeToolItem === TOOL_ITEMS.BRUSH ? 20
              : 10
            }
            step={1}
            value={size}
            onChange={(e) => changeSize(activeToolItem, e.target.value)}
          />
          <span style={{ fontSize: 11, color: "#6b7280" }}>{size}px</span>
        </div>
      )}
    </div>
  );
};

export default Toolbox;
