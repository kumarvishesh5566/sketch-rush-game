import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Stroke, StrokePoint } from '../../types/game';
import { Undo2, Trash2, Eraser, Paintbrush, PaintBucket } from 'lucide-react';

interface DrawingCanvasProps {
  isDrawer: boolean;
  onStrokeComplete: (stroke: Stroke) => void;
  onUndo: () => void;
  onClear: () => void;
  currentStrokes: Stroke[];
  incomingStroke?: Stroke | null;
}

export const PALETTE_COLORS = [
  '#ffffff', '#c1c1c1', '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#a855f7', '#ec4899',
  '#000000', '#4b5563', '#991b1b', '#9a3412', '#854d0e', '#166534', '#155e75', '#1e40af', '#6b21a8', '#9d174d',
  '#78350f', '#d97706', '#bbf7d0', '#bae6fd', '#fbcfe8', '#fef08a'
];

export const BRUSH_SIZES = [
  { label: 'S', size: 3 },
  { label: 'M', size: 8 },
  { label: 'L', size: 16 },
  { label: 'XL', size: 28 },
];

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  isDrawer,
  onStrokeComplete,
  onUndo,
  onClear,
  currentStrokes,
  incomingStroke,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [currentColor, setCurrentColor] = useState<string>('#000000');
  const [brushSize, setBrushSize] = useState<number>(8);
  const [activeTool, setActiveTool] = useState<'brush' | 'eraser' | 'fill'>('brush');
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const currentPointsRef = useRef<StrokePoint[]>([]);

  // Internal logical resolution
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;

  // Redraw all strokes on canvas
  const redrawAllStrokes = useCallback((strokes: Stroke[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear background to white
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    strokes.forEach((stroke) => {
      if (stroke.type === 'fill') {
        ctx.fillStyle = stroke.color;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      } else if (stroke.points && stroke.points.length > 0) {
        ctx.beginPath();
        ctx.strokeStyle = stroke.isEraser ? '#ffffff' : stroke.color;
        ctx.lineWidth = stroke.size;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (stroke.points.length === 1) {
          ctx.arc(stroke.points[0].x, stroke.points[0].y, stroke.size / 2, 0, Math.PI * 2);
          ctx.fillStyle = stroke.isEraser ? '#ffffff' : stroke.color;
          ctx.fill();
        } else {
          ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
          for (let i = 1; i < stroke.points.length; i++) {
            ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
          }
          ctx.stroke();
        }
      }
    });
  }, []);

  // Sync canvas when stroke history changes
  useEffect(() => {
    redrawAllStrokes(currentStrokes);
  }, [currentStrokes, redrawAllStrokes]);

  // Real-time render incoming stroke incrementally if viewer
  useEffect(() => {
    if (!incomingStroke || isDrawer) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (incomingStroke.type === 'fill') {
      ctx.fillStyle = incomingStroke.color;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    } else if (incomingStroke.points && incomingStroke.points.length > 0) {
      ctx.beginPath();
      ctx.strokeStyle = incomingStroke.isEraser ? '#ffffff' : incomingStroke.color;
      ctx.lineWidth = incomingStroke.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (incomingStroke.points.length === 1) {
        ctx.arc(incomingStroke.points[0].x, incomingStroke.points[0].y, incomingStroke.size / 2, 0, Math.PI * 2);
        ctx.fillStyle = incomingStroke.isEraser ? '#ffffff' : incomingStroke.color;
        ctx.fill();
      } else {
        ctx.moveTo(incomingStroke.points[0].x, incomingStroke.points[0].y);
        for (let i = 1; i < incomingStroke.points.length; i++) {
          ctx.lineTo(incomingStroke.points[i].x, incomingStroke.points[i].y);
        }
        ctx.stroke();
      }
    }
  }, [incomingStroke, isDrawer]);

  // Convert client mouse/touch point to internal 800x600 coordinates
  const getCanvasCoords = (clientX: number, clientY: number): StrokePoint => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;

    return {
      x: Math.round((clientX - rect.left) * scaleX),
      y: Math.round((clientY - rect.top) * scaleY),
    };
  };

  const handleStartDraw = (clientX: number, clientY: number) => {
    if (!isDrawer) return;

    const coords = getCanvasCoords(clientX, clientY);

    if (activeTool === 'fill') {
      const fillStroke: Stroke = {
        id: Math.random().toString(36).substring(7),
        type: 'fill',
        color: currentColor,
        size: 0,
        points: [],
      };
      onStrokeComplete(fillStroke);
      return;
    }

    setIsDrawing(true);
    currentPointsRef.current = [coords];

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.arc(coords.x, coords.y, brushSize / 2, 0, Math.PI * 2);
    ctx.fillStyle = activeTool === 'eraser' ? '#ffffff' : currentColor;
    ctx.fill();
  };

  const handleMoveDraw = (clientX: number, clientY: number) => {
    if (!isDrawer || !isDrawing) return;

    const coords = getCanvasCoords(clientX, clientY);
    const prevPoints = currentPointsRef.current;
    const lastPoint = prevPoints[prevPoints.length - 1];

    if (lastPoint && (lastPoint.x !== coords.x || lastPoint.y !== coords.y)) {
      currentPointsRef.current.push(coords);

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.beginPath();
      ctx.strokeStyle = activeTool === 'eraser' ? '#ffffff' : currentColor;
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.moveTo(lastPoint.x, lastPoint.y);
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
    }
  };

  const handleEndDraw = () => {
    if (!isDrawer || !isDrawing) return;
    setIsDrawing(false);

    if (currentPointsRef.current.length > 0) {
      const stroke: Stroke = {
        id: Math.random().toString(36).substring(7),
        type: 'brush',
        color: currentColor,
        size: brushSize,
        isEraser: activeTool === 'eraser',
        points: [...currentPointsRef.current],
      };
      onStrokeComplete(stroke);
      currentPointsRef.current = [];
    }
  };

  // Keyboard shortcut Ctrl+Z / Cmd+Z for Undo
  useEffect(() => {
    if (!isDrawer) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        onUndo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawer, onUndo]);

  const handleClearClick = () => {
    // Immediate canvas wipe for instant visual feedback
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      }
    }
    onClear();
  };

  return (
    <div className="flex flex-col w-full h-full select-none" ref={containerRef}>
      {/* Canvas viewport container */}
      <div className="relative flex-1 bg-white rounded-xl shadow-md border-3 border-slate-300 overflow-hidden flex items-center justify-center min-h-[360px]">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          data-testid="game-drawing-canvas"
          className={`w-full h-full object-contain ${
            isDrawer
              ? activeTool === 'eraser'
                ? 'cursor-cell'
                : activeTool === 'fill'
                ? 'cursor-pointer'
                : 'cursor-crosshair'
              : 'cursor-not-allowed'
          }`}
          onMouseDown={(e) => handleStartDraw(e.clientX, e.clientY)}
          onMouseMove={(e) => handleMoveDraw(e.clientX, e.clientY)}
          onMouseUp={handleEndDraw}
          onMouseLeave={handleEndDraw}
          onTouchStart={(e) => {
            if (e.touches[0]) handleStartDraw(e.touches[0].clientX, e.touches[0].clientY);
          }}
          onTouchMove={(e) => {
            if (e.touches[0]) handleMoveDraw(e.touches[0].clientX, e.touches[0].clientY);
          }}
          onTouchEnd={handleEndDraw}
        />

        {!isDrawer && (
          <div className="absolute top-2 right-2 bg-slate-800/60 backdrop-blur-xs text-white text-xs px-2.5 py-1 rounded-md pointer-events-none">
            Viewing Mode (Guess in chat)
          </div>
        )}
      </div>

      {/* Drawer toolbar (Only active when player is drawing) */}
      {isDrawer && (
        <div className="mt-2 bg-slate-100 p-2.5 rounded-xl border border-slate-300 shadow-sm flex flex-wrap items-center justify-between gap-3">
          {/* Tools: Brush, Eraser, Fill */}
          <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setActiveTool('brush')}
              title="Brush / Pen"
              aria-label="Brush tool"
              className={`p-1.5 rounded-md transition-colors ${
                activeTool === 'brush' ? 'bg-sky-500 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Paintbrush size={18} />
            </button>
            <button
              type="button"
              onClick={() => setActiveTool('eraser')}
              title="Eraser"
              aria-label="Eraser tool"
              className={`p-1.5 rounded-md transition-colors ${
                activeTool === 'eraser' ? 'bg-sky-500 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Eraser size={18} />
            </button>
            <button
              type="button"
              onClick={() => setActiveTool('fill')}
              title="Fill Canvas"
              aria-label="Bucket fill tool"
              className={`p-1.5 rounded-md transition-colors ${
                activeTool === 'fill' ? 'bg-sky-500 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <PaintBucket size={18} />
            </button>
          </div>

          {/* Brush sizes */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200">
            {BRUSH_SIZES.map((b) => (
              <button
                key={b.size}
                type="button"
                onClick={() => setBrushSize(b.size)}
                title={`Brush Size ${b.label}`}
                aria-label={`Brush size ${b.label}`}
                className={`w-7 h-7 flex items-center justify-center rounded-md transition-colors ${
                  brushSize === b.size ? 'bg-sky-100 text-sky-800 font-bold border border-sky-400' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div
                  className="rounded-full bg-slate-800"
                  style={{ width: Math.max(3, b.size / 2.2), height: Math.max(3, b.size / 2.2) }}
                />
              </button>
            ))}
          </div>

          {/* Color Palette (16 colors grid) */}
          <div className="flex flex-wrap items-center gap-1 max-w-[280px]">
            {PALETTE_COLORS.slice(0, 16).map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => {
                  setCurrentColor(color);
                  if (activeTool === 'eraser') setActiveTool('brush');
                }}
                title={`Color ${color}`}
                aria-label={`Color ${color}`}
                style={{ backgroundColor: color }}
                className={`w-5 h-5 rounded-full border transition-transform ${
                  currentColor === color && activeTool !== 'eraser'
                    ? 'scale-125 border-slate-900 shadow-md ring-2 ring-sky-400'
                    : 'border-slate-300 hover:scale-110'
                }`}
              />
            ))}
          </div>

          {/* Actions: Undo & Delete / Clear */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onUndo}
              title="Undo last stroke (Ctrl+Z)"
              aria-label="Undo last stroke"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-800 text-xs font-bold rounded-lg border-2 border-slate-300 shadow-xs active:scale-95 transition-all cursor-pointer"
            >
              <Undo2 size={15} />
              <span>Undo</span>
            </button>
            <button
              type="button"
              onClick={handleClearClick}
              title="Clear/Delete canvas"
              aria-label="Clear or delete canvas"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 active:bg-rose-200 text-rose-700 text-xs font-bold rounded-lg border-2 border-rose-300 shadow-xs active:scale-95 transition-all cursor-pointer"
            >
              <Trash2 size={15} />
              <span>Delete / Clear</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
