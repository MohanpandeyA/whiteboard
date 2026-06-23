import { useContext, useEffect, useRef, useState } from "react";
import rough from "roughjs";
import boardContext from "../../store/board-context";
import { TOOL_ACTION_TYPES, TOOL_ITEMS } from "../../constants";
import toolboxContext from "../../store/toolbox-context";
import { getElementBounds } from "../../utils/element";
import classes from "./index.module.css";

// Draw a single element onto the canvas
function drawElement(context, roughCanvas, element) {
  switch (element.type) {
    case TOOL_ITEMS.LINE:
    case TOOL_ITEMS.RECTANGLE:
    case TOOL_ITEMS.CIRCLE:
    case TOOL_ITEMS.DIAMOND:
    case TOOL_ITEMS.ARROW:
      if (element.roughEle) roughCanvas.draw(element.roughEle);
      break;
    case TOOL_ITEMS.BRUSH:
      if (element.path) {
        context.save();
        context.fillStyle = element.stroke;
        context.fill(element.path);
        context.restore();
      }
      break;
    case TOOL_ITEMS.TEXT:
      context.save();
      context.textBaseline = "top";
      context.font = `400 ${element.size}px "Patrick Hand", sans-serif`;
      context.fillStyle = element.stroke;
      context.fillText(element.text || "", element.x1, element.y1);
      context.restore();
      break;
    case TOOL_ITEMS.ERASER:
      context.save();
      context.globalCompositeOperation = "source-over";
      context.strokeStyle = "#ffffff";
      context.lineWidth = element.size || 20;
      context.lineCap = "round";
      context.lineJoin = "round";
      if (element.points && element.points.length > 0) {
        context.beginPath();
        context.moveTo(element.points[0].x, element.points[0].y);
        element.points.forEach((pt) => context.lineTo(pt.x, pt.y));
        context.stroke();
      }
      context.restore();
      break;
    default:
      break;
  }
}

// Draw selection bounding box around selected element
function drawSelectionBox(context, element) {
  const { minX, minY, maxX, maxY } = getElementBounds(element);
  const pad = 6;
  context.save();
  context.strokeStyle = "#3b82f6";
  context.lineWidth = 1.5;
  context.setLineDash([5, 3]);
  context.strokeRect(minX - pad, minY - pad, (maxX - minX) + pad * 2, (maxY - minY) + pad * 2);
  // Corner handles
  context.setLineDash([]);
  context.fillStyle = "#ffffff";
  context.strokeStyle = "#3b82f6";
  context.lineWidth = 1.5;
  const corners = [
    [minX - pad, minY - pad],
    [maxX + pad, minY - pad],
    [maxX + pad, maxY + pad],
    [minX - pad, maxY + pad],
  ];
  corners.forEach(([cx, cy]) => {
    context.beginPath();
    context.arc(cx, cy, 4, 0, Math.PI * 2);
    context.fill();
    context.stroke();
  });
  context.restore();
}

function Board() {
  const canvasRef = useRef();
  const textAreaRef = useRef();
  const rafRef = useRef(null);
  const [renderTick, setRenderTick] = useState(0);

  const {
    elements,
    toolActionType,
    activeToolItem,
    selectedElementId,
    boardMouseDownHandler,
    boardMouseMoveHandler,
    boardMouseUpHandler,
    textAreaBlurHandler,
    undo,
    redo,
  } = useContext(boardContext);
  const { toolboxState } = useContext(toolboxContext);

  // Size canvas to fill container
  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas.parentElement;
    const resize = () => {
      canvas.width = parent.clientWidth || window.innerWidth;
      canvas.height = parent.clientHeight || window.innerHeight;
      setRenderTick((t) => t + 1);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(parent);
    return () => observer.disconnect();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === "z") undo();
      else if (e.ctrlKey && e.key === "y") redo();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo]);

  // Render with requestAnimationFrame
  useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      if (canvas.width === 0 || canvas.height === 0) {
        const parent = canvas.parentElement;
        if (parent) {
          canvas.width = parent.clientWidth || window.innerWidth;
          canvas.height = parent.clientHeight || window.innerHeight;
        }
      }
      const context = canvas.getContext("2d");
      const roughCanvas = rough.canvas(canvas);
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      elements.forEach((el) => drawElement(context, roughCanvas, el));

      // Draw selection box over selected element
      if (selectedElementId !== null) {
        const selectedEl = elements.find(el => el.id === selectedElementId);
        if (selectedEl) drawSelectionBox(context, selectedEl);
      }
    });
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [elements, renderTick, selectedElementId]);

  // Focus textarea when writing
  useEffect(() => {
    if (toolActionType === TOOL_ACTION_TYPES.WRITING) {
      setTimeout(() => textAreaRef.current?.focus(), 0);
    }
  }, [toolActionType]);

  // Cursor style based on active tool
  const getCursor = () => {
    if (activeToolItem === TOOL_ITEMS.SELECT) return "default";
    if (activeToolItem === TOOL_ITEMS.ERASER) return "cell";
    if (activeToolItem === TOOL_ITEMS.TEXT) return "text";
    return "crosshair";
  };

  return (
    <>
      {toolActionType === TOOL_ACTION_TYPES.WRITING && (
        <textarea
          ref={textAreaRef}
          className={classes.textElementBox}
          style={{
            // Canvas is inside canvasArea div which starts after the 50px top bar
            // offsetX/offsetY are relative to canvas, so add canvas's top offset
            top: elements[elements.length - 1].y1,
            left: elements[elements.length - 1].x1,
            fontSize: `${elements[elements.length - 1]?.size}px`,
            color: elements[elements.length - 1]?.stroke,
            position: "absolute",
          }}
          onBlur={(e) => textAreaBlurHandler(e.target.value)}
        />
      )}
      <canvas
        ref={canvasRef}
        id="canvas"
        style={{ display: "block", width: "100%", height: "100%", cursor: getCursor() }}
        onMouseDown={(e) => {
          // Use offsetX/offsetY for canvas-relative coordinates (no top-bar offset)
          boardMouseDownHandler(
            { ...e, clientX: e.nativeEvent.offsetX, clientY: e.nativeEvent.offsetY },
            toolboxState
          );
        }}
        onMouseMove={(e) => {
          boardMouseMoveHandler(
            { ...e, clientX: e.nativeEvent.offsetX, clientY: e.nativeEvent.offsetY }
          );
        }}
        onMouseUp={() => boardMouseUpHandler()}
      />
    </>
  );
}

export default Board;
