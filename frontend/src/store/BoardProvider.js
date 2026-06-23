import React, { useCallback, useEffect, useReducer, useRef } from "react";
import boardContext from "./board-context";
import { BOARD_ACTIONS, TOOL_ACTION_TYPES, TOOL_ITEMS } from "../constants";
import {
  createElement,
  reconstructElement,
  getSvgPathFromStroke,
  isPointNearElement,
  isPointInElement,
} from "../utils/element";
import getStroke from "perfect-freehand";

const boardReducer = (state, action) => {
  switch (action.type) {
    case BOARD_ACTIONS.CHANGE_TOOL:
      return { ...state, activeToolItem: action.payload.tool, selectedElementId: null };

    case BOARD_ACTIONS.CHANGE_ACTION_TYPE:
      return { ...state, toolActionType: action.payload.actionType };

    case BOARD_ACTIONS.DRAW_DOWN: {
      const { clientX, clientY, stroke, fill, size } = action.payload;

      if (state.activeToolItem === TOOL_ITEMS.ERASER) {
        const eraserElement = {
          id: state.elements.length,
          type: TOOL_ITEMS.ERASER,
          points: [{ x: clientX, y: clientY }],
          size: size || 20,
        };
        return {
          ...state,
          toolActionType: TOOL_ACTION_TYPES.ERASING,
          elements: [...state.elements, eraserElement],
        };
      }

      const newElement = createElement(
        state.elements.length, clientX, clientY, clientX, clientY,
        { type: state.activeToolItem, stroke, fill, size }
      );
      return {
        ...state,
        toolActionType: state.activeToolItem === TOOL_ITEMS.TEXT
          ? TOOL_ACTION_TYPES.WRITING
          : TOOL_ACTION_TYPES.DRAWING,
        elements: [...state.elements, newElement],
      };
    }

    case BOARD_ACTIONS.DRAW_MOVE: {
      const { clientX, clientY } = action.payload;
      const newElements = [...state.elements];
      const index = state.elements.length - 1;
      const { type } = newElements[index];

      if (type === TOOL_ITEMS.ERASER) {
        newElements[index] = {
          ...newElements[index],
          points: [...newElements[index].points, { x: clientX, y: clientY }],
        };
        return { ...state, elements: newElements };
      }

      switch (type) {
        case TOOL_ITEMS.LINE:
        case TOOL_ITEMS.RECTANGLE:
        case TOOL_ITEMS.CIRCLE:
        case TOOL_ITEMS.DIAMOND:
        case TOOL_ITEMS.ARROW: {
          const { x1, y1, stroke, fill, size } = newElements[index];
          newElements[index] = createElement(index, x1, y1, clientX, clientY, {
            type: state.activeToolItem, stroke, fill, size,
          });
          return { ...state, elements: newElements };
        }
        case TOOL_ITEMS.BRUSH: {
          newElements[index].points = [...newElements[index].points, { x: clientX, y: clientY }];
          const brushSize = newElements[index].size || 4;
          newElements[index].path = new Path2D(
            getSvgPathFromStroke(getStroke(newElements[index].points, {
              size: brushSize,
              thinning: 0.5,
              smoothing: 0.5,
              streamline: 0.5,
            }))
          );
          return { ...state, elements: newElements };
        }
        default:
          throw new Error("Type not recognized");
      }
    }

    case BOARD_ACTIONS.DRAW_UP: {
      const elementsCopy = [...state.elements];
      const newHistory = state.history.slice(0, state.index + 1);
      newHistory.push(elementsCopy);
      return { ...state, history: newHistory, index: state.index + 1, pendingSave: true };
    }

    case BOARD_ACTIONS.ERASE: {
      const { clientX, clientY } = action.payload;
      let newElements = [...state.elements].filter(
        (element) => !isPointNearElement(element, clientX, clientY)
      );
      const newHistory = state.history.slice(0, state.index + 1);
      newHistory.push(newElements);
      return { ...state, elements: newElements, history: newHistory, index: state.index + 1, pendingSave: true };
    }

    case BOARD_ACTIONS.CHANGE_TEXT: {
      const index = state.elements.length - 1;
      const newElements = [...state.elements];
      newElements[index].text = action.payload.text;
      const newHistory = state.history.slice(0, state.index + 1);
      newHistory.push(newElements);
      return {
        ...state,
        toolActionType: TOOL_ACTION_TYPES.NONE,
        elements: newElements,
        history: newHistory,
        index: state.index + 1,
        pendingSave: true,
      };
    }

    case BOARD_ACTIONS.UNDO: {
      if (state.index <= 0) return state;
      return { ...state, elements: state.history[state.index - 1], index: state.index - 1, pendingSave: true };
    }

    case BOARD_ACTIONS.REDO: {
      if (state.index >= state.history.length - 1) return state;
      return { ...state, elements: state.history[state.index + 1], index: state.index + 1, pendingSave: true };
    }

    case BOARD_ACTIONS.CLEAR_PENDING_SAVE:
      return { ...state, pendingSave: false };

    case BOARD_ACTIONS.REMOTE_UPDATE:
      return { ...state, elements: action.payload.elements };

    case BOARD_ACTIONS.CLEAR_CANVAS: {
      const newHistory = state.history.slice(0, state.index + 1);
      newHistory.push([]);
      return { ...state, elements: [], history: newHistory, index: state.index + 1, pendingSave: true, selectedElementId: null };
    }

    // SELECT: find element under cursor
    case BOARD_ACTIONS.SELECT_ELEMENT: {
      const { clientX, clientY } = action.payload;
      // Find topmost element that contains the point
      let found = null;
      for (let i = state.elements.length - 1; i >= 0; i--) {
        if (isPointInElement(state.elements[i], clientX, clientY)) {
          found = state.elements[i].id;
          break;
        }
      }
      return {
        ...state,
        selectedElementId: found,
        toolActionType: found !== null ? TOOL_ACTION_TYPES.SELECTING : TOOL_ACTION_TYPES.NONE,
        dragStart: found !== null ? { x: clientX, y: clientY } : null,
      };
    }

    // MOVE: translate selected element
    case BOARD_ACTIONS.MOVE_ELEMENT: {
      if (state.selectedElementId === null || !state.dragStart) return state;
      const { clientX, clientY } = action.payload;
      const dx = clientX - state.dragStart.x;
      const dy = clientY - state.dragStart.y;

      const newElements = state.elements.map((el) => {
        if (el.id !== state.selectedElementId) return el;

        // Move by dx, dy
        const moved = { ...el };
        if (el.type === TOOL_ITEMS.BRUSH || el.type === TOOL_ITEMS.ERASER) {
          moved.points = el.points.map(p => ({ x: p.x + dx, y: p.y + dy }));
          if (el.type === TOOL_ITEMS.BRUSH) {
            moved.path = new Path2D(getSvgPathFromStroke(getStroke(moved.points)));
          }
        } else {
          moved.x1 = el.x1 + dx;
          moved.y1 = el.y1 + dy;
          moved.x2 = el.x2 + dx;
          moved.y2 = el.y2 + dy;
          // Rebuild roughEle for shapes
          if (el.type !== TOOL_ITEMS.TEXT) {
            const rebuilt = createElement(el.id, moved.x1, moved.y1, moved.x2, moved.y2, {
              type: el.type, stroke: el.stroke, fill: el.fill, size: el.size,
            });
            moved.roughEle = rebuilt.roughEle;
          }
        }
        return moved;
      });

      return {
        ...state,
        elements: newElements,
        dragStart: { x: clientX, y: clientY },
      };
    }

    case BOARD_ACTIONS.MOVE_UP: {
      const elementsCopy = [...state.elements];
      const newHistory = state.history.slice(0, state.index + 1);
      newHistory.push(elementsCopy);
      return {
        ...state,
        history: newHistory,
        index: state.index + 1,
        pendingSave: true,
        toolActionType: TOOL_ACTION_TYPES.SELECTING,
        dragStart: null,
      };
    }

    default:
      return state;
  }
};

const BoardProvider = ({
  children,
  initialElements = [],
  onSave,
  autoSaveDelay = 2000,
  remoteUpdateRef = null,
}) => {
  const reconstructed = initialElements.map(reconstructElement);

  const [boardState, dispatchBoardAction] = useReducer(boardReducer, {
    activeToolItem: TOOL_ITEMS.BRUSH,
    toolActionType: TOOL_ACTION_TYPES.NONE,
    elements: reconstructed,
    history: [reconstructed],
    index: 0,
    pendingSave: false,
    selectedElementId: null,
    dragStart: null,
  });

  // Wire remoteUpdateRef
  useEffect(() => {
    if (!remoteUpdateRef) return;
    remoteUpdateRef.current = (remoteElements) => {
      const rebuilt = remoteElements.map(reconstructElement);
      dispatchBoardAction({ type: BOARD_ACTIONS.REMOTE_UPDATE, payload: { elements: rebuilt } });
    };
    return () => { if (remoteUpdateRef) remoteUpdateRef.current = null; };
  }, [remoteUpdateRef]);

  // Auto-save debounce
  const saveTimerRef = useRef(null);
  useEffect(() => {
    if (!boardState.pendingSave || !onSave) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      const serializable = boardState.elements.map((el) => {
        const { roughEle, path, ...rest } = el;
        return rest;
      });
      onSave(serializable);
      dispatchBoardAction({ type: BOARD_ACTIONS.CLEAR_PENDING_SAVE });
    }, autoSaveDelay);
    return () => clearTimeout(saveTimerRef.current);
  }, [boardState.pendingSave, boardState.elements, onSave, autoSaveDelay]);

  const changeToolHandler = (tool) => {
    dispatchBoardAction({ type: BOARD_ACTIONS.CHANGE_TOOL, payload: { tool } });
  };

  const boardMouseDownHandler = (event, toolboxState) => {
    if (boardState.toolActionType === TOOL_ACTION_TYPES.WRITING) return;
    const { clientX, clientY } = event;

    // Explicit SELECT tool
    if (boardState.activeToolItem === TOOL_ITEMS.SELECT) {
      dispatchBoardAction({ type: BOARD_ACTIONS.SELECT_ELEMENT, payload: { clientX, clientY } });
      return;
    }

    // Smart select: clicking on an existing element with any non-brush/eraser tool
    // selects and moves it instead of drawing a new element
    if (
      boardState.activeToolItem !== TOOL_ITEMS.ERASER &&
      boardState.activeToolItem !== TOOL_ITEMS.BRUSH
    ) {
      let hitElement = null;
      for (let i = boardState.elements.length - 1; i >= 0; i--) {
        if (isPointInElement(boardState.elements[i], clientX, clientY)) {
          hitElement = boardState.elements[i];
          break;
        }
      }
      if (hitElement) {
        dispatchBoardAction({ type: BOARD_ACTIONS.SELECT_ELEMENT, payload: { clientX, clientY } });
        return;
      }
    }

    dispatchBoardAction({
      type: BOARD_ACTIONS.DRAW_DOWN,
      payload: {
        clientX, clientY,
        stroke: toolboxState[boardState.activeToolItem]?.stroke,
        fill: toolboxState[boardState.activeToolItem]?.fill,
        size: toolboxState[boardState.activeToolItem]?.size,
      },
    });
  };

  const boardMouseMoveHandler = (event) => {
    if (boardState.toolActionType === TOOL_ACTION_TYPES.WRITING) return;
    const { clientX, clientY } = event;

    if (boardState.toolActionType === TOOL_ACTION_TYPES.SELECTING && boardState.selectedElementId !== null) {
      dispatchBoardAction({ type: BOARD_ACTIONS.MOVE_ELEMENT, payload: { clientX, clientY } });
      return;
    }

    if (boardState.toolActionType === TOOL_ACTION_TYPES.DRAWING ||
        boardState.toolActionType === TOOL_ACTION_TYPES.ERASING) {
      dispatchBoardAction({ type: BOARD_ACTIONS.DRAW_MOVE, payload: { clientX, clientY } });
    }
  };

  const boardMouseUpHandler = () => {
    if (boardState.toolActionType === TOOL_ACTION_TYPES.WRITING) return;

    if (boardState.toolActionType === TOOL_ACTION_TYPES.SELECTING) {
      dispatchBoardAction({ type: BOARD_ACTIONS.MOVE_UP });
      return;
    }

    if (boardState.toolActionType === TOOL_ACTION_TYPES.DRAWING) {
      dispatchBoardAction({ type: BOARD_ACTIONS.DRAW_UP });
    }
    dispatchBoardAction({
      type: BOARD_ACTIONS.CHANGE_ACTION_TYPE,
      payload: { actionType: TOOL_ACTION_TYPES.NONE },
    });
  };

  const textAreaBlurHandler = (text) => {
    dispatchBoardAction({ type: BOARD_ACTIONS.CHANGE_TEXT, payload: { text } });
  };

  const boardUndoHandler = useCallback(() => {
    dispatchBoardAction({ type: BOARD_ACTIONS.UNDO });
  }, []);

  const boardRedoHandler = useCallback(() => {
    dispatchBoardAction({ type: BOARD_ACTIONS.REDO });
  }, []);

  const boardClearHandler = useCallback(() => {
    dispatchBoardAction({ type: BOARD_ACTIONS.CLEAR_CANVAS });
  }, []);

  const boardContextValue = {
    activeToolItem: boardState.activeToolItem,
    elements: boardState.elements,
    toolActionType: boardState.toolActionType,
    selectedElementId: boardState.selectedElementId,
    changeToolHandler,
    boardMouseDownHandler,
    boardMouseMoveHandler,
    boardMouseUpHandler,
    textAreaBlurHandler,
    undo: boardUndoHandler,
    redo: boardRedoHandler,
    clearCanvas: boardClearHandler,
  };

  return (
    <boardContext.Provider value={boardContextValue}>
      {children}
    </boardContext.Provider>
  );
};

export default BoardProvider;
