import React, { useContext } from "react";
import classes from "./index.module.css";
import cx from "classnames";
import {
  FaSlash,
  FaRegCircle,
  FaArrowRight,
  FaPaintBrush,
  FaEraser,
  FaUndoAlt,
  FaRedoAlt,
  FaFont,
  FaDownload,
  FaTrash,
  FaMousePointer,
} from "react-icons/fa";
import { BsDiamond } from "react-icons/bs";
import { LuRectangleHorizontal } from "react-icons/lu";
import { TOOL_ITEMS } from "../../constants";
import boardContext from "../../store/board-context";

const Toolbar = () => {
  const { activeToolItem, changeToolHandler, undo, redo, clearCanvas } =
    useContext(boardContext);

  const handleDownloadClick = () => {
    const canvas = document.getElementById("canvas");
    const data = canvas.toDataURL("image/png");
    const anchor = document.createElement("a");
    anchor.href = data;
    anchor.download = "board.png";
    anchor.click();
  };

  const handleClearClick = () => {
    if (window.confirm("Clear the entire canvas? This cannot be undone.")) {
      clearCanvas();
    }
  };

  return (
    <div className={classes.container}>
      {/* Select / Move tool */}
      <div
        className={cx(classes.toolItem, { [classes.active]: activeToolItem === TOOL_ITEMS.SELECT })}
        onClick={() => changeToolHandler(TOOL_ITEMS.SELECT)}
        title="Select & Move (V)"
      >
        <FaMousePointer />
      </div>

      {/* Divider */}
      <div className={classes.divider} />

      {/* Drawing tools */}
      <div
        className={cx(classes.toolItem, { [classes.active]: activeToolItem === TOOL_ITEMS.BRUSH })}
        onClick={() => changeToolHandler(TOOL_ITEMS.BRUSH)}
        title="Brush (freehand)"
      >
        <FaPaintBrush />
      </div>
      <div
        className={cx(classes.toolItem, { [classes.active]: activeToolItem === TOOL_ITEMS.LINE })}
        onClick={() => changeToolHandler(TOOL_ITEMS.LINE)}
        title="Line"
      >
        <FaSlash />
      </div>
      <div
        className={cx(classes.toolItem, { [classes.active]: activeToolItem === TOOL_ITEMS.RECTANGLE })}
        onClick={() => changeToolHandler(TOOL_ITEMS.RECTANGLE)}
        title="Rectangle"
      >
        <LuRectangleHorizontal />
      </div>
      <div
        className={cx(classes.toolItem, { [classes.active]: activeToolItem === TOOL_ITEMS.CIRCLE })}
        onClick={() => changeToolHandler(TOOL_ITEMS.CIRCLE)}
        title="Circle / Ellipse"
      >
        <FaRegCircle />
      </div>
      <div
        className={cx(classes.toolItem, { [classes.active]: activeToolItem === TOOL_ITEMS.DIAMOND })}
        onClick={() => changeToolHandler(TOOL_ITEMS.DIAMOND)}
        title="Diamond"
      >
        <BsDiamond />
      </div>
      <div
        className={cx(classes.toolItem, { [classes.active]: activeToolItem === TOOL_ITEMS.ARROW })}
        onClick={() => changeToolHandler(TOOL_ITEMS.ARROW)}
        title="Arrow"
      >
        <FaArrowRight />
      </div>
      <div
        className={cx(classes.toolItem, { [classes.active]: activeToolItem === TOOL_ITEMS.TEXT })}
        onClick={() => changeToolHandler(TOOL_ITEMS.TEXT)}
        title="Text"
      >
        <FaFont />
      </div>

      {/* Divider */}
      <div className={classes.divider} />

      {/* Eraser */}
      <div
        className={cx(classes.toolItem, { [classes.active]: activeToolItem === TOOL_ITEMS.ERASER })}
        onClick={() => changeToolHandler(TOOL_ITEMS.ERASER)}
        title="Eraser"
      >
        <FaEraser />
      </div>

      {/* Divider */}
      <div className={classes.divider} />

      {/* Undo / Redo */}
      <div className={classes.toolItem} onClick={undo} title="Undo (Ctrl+Z)">
        <FaUndoAlt />
      </div>
      <div className={classes.toolItem} onClick={redo} title="Redo (Ctrl+Y)">
        <FaRedoAlt />
      </div>

      {/* Divider */}
      <div className={classes.divider} />

      {/* Download */}
      <div className={classes.toolItem} onClick={handleDownloadClick} title="Download as PNG">
        <FaDownload />
      </div>

      {/* Divider */}
      <div className={classes.divider} />

      {/* Clear canvas */}
      <div className={classes.toolItem} onClick={handleClearClick} title="Clear canvas">
        <FaTrash />
      </div>
    </div>
  );
};

export default Toolbar;
