"use client";

import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import {
  buildNoisePool,
  createSchedule,
  getUnlockPassword,
  PUZZLE_SUCCESS_PHASES,
} from "../lib/cuneiform";

const COLUMN_COUNT = 4;
const ROW_COUNT = 7;
const TICK_MS = 760;

function makeNoiseCell(noisePool, serial) {
  return {
    id: `cell-${serial}`,
    glyph: noisePool[Math.floor(Math.random() * noisePool.length)],
    isTarget: false,
    frozen: false,
  };
}

function makeFrozenColumn(glyph, serial) {
  return Array.from({ length: ROW_COUNT }, (_, index) => ({
    id: `frozen-${glyph}-${serial}-${index}`,
    glyph,
    isTarget: false,
    frozen: true,
  }));
}

function buildInitialGrid(noisePool, serial) {
  let nextSerial = serial;
  const grid = Array.from({ length: COLUMN_COUNT }, () =>
    Array.from({ length: ROW_COUNT }, () => {
      nextSerial += 1;
      return makeNoiseCell(noisePool, nextSerial);
    }),
  );

  return { grid, serial: nextSerial };
}

function reducer(state, action) {
  switch (action.type) {
    case "init": {
      const initial = buildInitialGrid(action.noisePool, 0);
      return {
        ...state,
        ready: true,
        noisePool: action.noisePool,
        grid: initial.grid,
        serial: initial.serial,
        schedule: createSchedule([], [null, null, null, null]),
      };
    }

    case "tick": {
      if (!state.ready || state.solvedPassword) return state;

      let nextSerial = state.serial;
      const assignments = state.schedule[state.tickInWindow] || [];
      const assignmentMap = new Map(assignments.map((item) => [item.column, item.glyph]));
      const nextGrid = state.grid.map((column, columnIndex) => {
        if (state.frozenColumns[columnIndex]) {
          return makeFrozenColumn(state.frozenColumns[columnIndex], nextSerial);
        }

        const nextColumn = column.slice(0, ROW_COUNT - 1);
        const scheduledGlyph = assignmentMap.get(columnIndex);
        nextSerial += 1;
        const nextCell = scheduledGlyph
          ? {
              id: `target-${scheduledGlyph}-${nextSerial}`,
              glyph: scheduledGlyph,
              isTarget: true,
              frozen: false,
            }
          : makeNoiseCell(state.noisePool, nextSerial);

        return [nextCell, ...nextColumn];
      });

      const nextTick = state.tickInWindow === 12 ? 0 : state.tickInWindow + 1;
      const nextSchedule =
        state.tickInWindow === 12
          ? createSchedule(state.foundOrder, state.frozenColumns)
          : state.schedule;

      return {
        ...state,
        grid: nextGrid,
        serial: nextSerial,
        tickInWindow: nextTick,
        schedule: nextSchedule,
      };
    }

    case "wrong": {
      return {
        ...state,
        flashingCellId: action.cellId,
      };
    }

    case "clear-wrong": {
      if (state.flashingCellId !== action.cellId) return state;
      return {
        ...state,
        flashingCellId: null,
      };
    }

    case "click": {
      if (!state.ready || state.solvedPassword) return state;

      const { columnIndex, cell } = action;
      const alreadyFound = state.foundOrder.includes(cell.glyph);
      if (!cell.isTarget || alreadyFound || state.frozenColumns[columnIndex]) {
        return {
          ...state,
          flashingCellId: cell.id,
        };
      }

      const nextFoundOrder = [...state.foundOrder, cell.glyph];
      const nextFrozenColumns = [...state.frozenColumns];
      nextFrozenColumns[columnIndex] = cell.glyph;
      const solvedPassword = getUnlockPassword(nextFoundOrder);

      return {
        ...state,
        foundOrder: nextFoundOrder,
        frozenColumns: nextFrozenColumns,
        grid: state.grid.map((column, index) =>
          index === columnIndex ? makeFrozenColumn(cell.glyph, state.serial + index + 1) : column,
        ),
        solvedPassword,
      };
    }

    case "unlock-phase": {
      return {
        ...state,
        unlockPhase: action.phase,
      };
    }

    case "reset": {
      const initial = buildInitialGrid(state.noisePool, 0);
      return {
        ...state,
        grid: initial.grid,
        serial: initial.serial,
        schedule: createSchedule([], [null, null, null, null]),
        tickInWindow: 0,
        foundOrder: [],
        frozenColumns: [null, null, null, null],
        flashingCellId: null,
        solvedPassword: null,
        unlockPhase: -1,
      };
    }

    default:
      return state;
  }
}

const initialState = {
  ready: false,
  noisePool: [],
  grid: Array.from({ length: COLUMN_COUNT }, () => []),
  serial: 0,
  schedule: Array.from({ length: 13 }, () => []),
  tickInWindow: 0,
  foundOrder: [],
  frozenColumns: [null, null, null, null],
  flashingCellId: null,
  solvedPassword: null,
  unlockPhase: -1,
};

export default function CuneiformPuzzle({ onSolved }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [fontReady, setFontReady] = useState(false);
  const timeoutsRef = useRef([]);

  useEffect(() => {
    let active = true;
    const ensureFont = async () => {
      await document.fonts.load('1em "Noto Sans Cuneiform"');
      if (!active) return;
      setFontReady(true);
      dispatch({ type: "init", noisePool: buildNoisePool() });
    };

    ensureFont();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!state.ready || state.solvedPassword) return undefined;
    const timer = window.setInterval(() => {
      dispatch({ type: "tick" });
    }, TICK_MS);
    return () => window.clearInterval(timer);
  }, [state.ready, state.solvedPassword]);

  useEffect(() => {
    if (!state.flashingCellId) return undefined;
    const timer = window.setTimeout(() => {
      dispatch({ type: "clear-wrong", cellId: state.flashingCellId });
    }, 400);
    return () => window.clearTimeout(timer);
  }, [state.flashingCellId]);

  useEffect(() => {
    if (!state.solvedPassword) return undefined;

    const timers = [
      window.setTimeout(() => dispatch({ type: "unlock-phase", phase: 0 }), 700),
      window.setTimeout(() => dispatch({ type: "unlock-phase", phase: 1 }), 1800),
      window.setTimeout(() => dispatch({ type: "unlock-phase", phase: 2 }), 2900),
      window.setTimeout(() => onSolved("puzzle"), 4100),
    ];

    timeoutsRef.current = timers;
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      timeoutsRef.current = [];
    };
  }, [onSolved, state.solvedPassword]);

  const phaseLines = useMemo(() => {
    if (state.unlockPhase < 0) return [];
    return PUZZLE_SUCCESS_PHASES[state.unlockPhase] || PUZZLE_SUCCESS_PHASES[PUZZLE_SUCCESS_PHASES.length - 1];
  }, [state.unlockPhase]);

  if (!fontReady) {
    return (
      <div className="matrix-loading" aria-label="Loading cuneiform matrix">
        <span className="matrix-loading-dot" />
      </div>
    );
  }

  return (
    <div className="matrix-shell">
      <div className="matrix-progress">
        <div className="matrix-found">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="matrix-slot">
              {state.foundOrder[index] || ""}
            </div>
          ))}
        </div>
        <div className="matrix-counter">Alternate entry</div>
      </div>

      <div className="matrix-grid" role="grid" aria-label="Cuneiform lock">
        {state.grid.map((column, columnIndex) => (
          <div key={columnIndex} className={`matrix-column ${state.frozenColumns[columnIndex] ? "is-frozen" : ""}`}>
            {column.map((cell, rowIndex) => {
              const opacity = cell.frozen ? 1 : 0.15 + (1 - rowIndex / 6) * 0.7;
              return (
                <button
                  key={cell.id}
                  type="button"
                  className={`matrix-cell ${state.flashingCellId === cell.id ? "is-wrong" : ""} ${cell.frozen ? "is-frozen" : ""}`}
                  style={{
                    color: cell.frozen
                      ? "rgba(160, 106, 63, 0.92)"
                      : `rgba(79, 71, 63, ${0.2 + opacity * 0.62})`,
                  }}
                  onClick={() => dispatch({ type: "click", columnIndex, cell })}
                  aria-label={`Cuneiform cell ${columnIndex + 1}-${rowIndex + 1}`}
                >
                  {cell.glyph}
                </button>
              );
            })}
          </div>
        ))}
        <div className="matrix-scanline" />
      </div>

      {state.unlockPhase >= 0 && (
        <div className="matrix-unlock">
          {phaseLines.map((line) => (
            <div key={line} className="matrix-phase-line">
              {line}
            </div>
          ))}
        </div>
      )}

      <button type="button" className="matrix-reset" onClick={() => dispatch({ type: "reset" })}>
        Reset matrix
      </button>
    </div>
  );
}
