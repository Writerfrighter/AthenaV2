'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Pencil, Eraser, Undo2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FieldDrawingCanvasProps {
  /** Initial drawing data as a base64 data URL */
  initialData?: string;
  /** Callback when drawing changes, returns base64 data URL of the drawing */
  onChange?: (dataUrl: string) => void;
  /** Image source for the field background */
  fieldImageSrc?: string;
  /** CSS class for the container */
  className?: string;
}

type Tool = 'pen' | 'eraser';

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  points: Point[];
  color: string;
  size: number;
}

// ── Geometry helpers ──

/** Minimum distance from a point to a line segment (all in normalized 0-1 coords). */
function distPointToSegment(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) {
    // a and b are the same point
    const ex = p.x - a.x;
    const ey = p.y - a.y;
    return Math.sqrt(ex * ex + ey * ey);
  }
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const projX = a.x + t * dx;
  const projY = a.y + t * dy;
  const ex = p.x - projX;
  const ey = p.y - projY;
  return Math.sqrt(ex * ex + ey * ey);
}

/** Check whether a point is close enough to any segment of a stroke to "hit" it. */
function pointHitsStroke(
  p: Point,
  stroke: Stroke,
  canvasWidth: number,
  canvasHeight: number,
): boolean {
  // The hit threshold is half the stroke width (in normalised space) plus a
  // small fixed tolerance so thin lines are still easy to tap.
  const halfW = (stroke.size / 2) / Math.min(canvasWidth, canvasHeight);
  const tolerance = 8 / Math.min(canvasWidth, canvasHeight); // 8 px extra
  const threshold = halfW + tolerance;

  for (let i = 0; i < stroke.points.length - 1; i++) {
    if (distPointToSegment(p, stroke.points[i], stroke.points[i + 1]) < threshold) {
      return true;
    }
  }
  return false;
}

export function FieldDrawingCanvas({
  initialData,
  onChange,
  fieldImageSrc = '/assets/Rebuilt Field .png',
  className,
}: FieldDrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<Tool>('pen');
  const [penColor, setPenColor] = useState('#ff0000');
  const [brushSize, setBrushSize] = useState(3);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const currentStrokeRef = useRef<Stroke | null>(null);
  // Track which stroke indices are highlighted for removal while eraser is held
  const eraserHitsRef = useRef<Set<number>>(new Set());
  const bgImageRef = useRef<HTMLImageElement | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const initialDataLoadedRef = useRef(false);

  const colors = [
    '#ff0000', // Red
    '#0000ff', // Blue
    '#00cc00', // Green
    '#ffaa00', // Orange
    '#ffffff', // White
    '#000000', // Black
  ];

  // Load the background image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      bgImageRef.current = img;
      setImageLoaded(true);
    };
    img.onerror = () => {
      console.error('Failed to load field image');
      setImageLoaded(true); // Still allow drawing even without bg
    };
    img.src = fieldImageSrc;
  }, [fieldImageSrc]);

  // Resize canvas to fit container while maintaining aspect ratio
  useEffect(() => {
    if (!containerRef.current || !imageLoaded) return;

    const updateSize = () => {
      const container = containerRef.current;
      if (!container) return;

      const containerWidth = container.clientWidth;
      const img = bgImageRef.current;

      if (img && img.naturalWidth > 0) {
        const aspectRatio = img.naturalHeight / img.naturalWidth;
        const height = Math.round(containerWidth * aspectRatio);
        setCanvasSize({ width: containerWidth, height });
      } else {
        // Default 16:9 aspect ratio if no image
        setCanvasSize({ width: containerWidth, height: Math.round(containerWidth * 0.5625) });
      }
    };

    updateSize();
    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(containerRef.current);

    return () => resizeObserver.disconnect();
  }, [imageLoaded]);

  // ── Drawing helpers ──

  const drawStrokeOnCtx = useCallback(
    (ctx: CanvasRenderingContext2D, stroke: Stroke, cw: number, ch: number, dimmed = false) => {
      if (stroke.points.length < 2) return;

      ctx.save();
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = stroke.color;
      ctx.globalAlpha = dimmed ? 0.25 : 1;
      ctx.lineWidth = stroke.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x * cw, stroke.points[0].y * ch);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x * cw, stroke.points[i].y * ch);
      }
      ctx.stroke();
      ctx.restore();
    },
    [],
  );

  // Redraw canvas whenever strokes or size changes
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background image
    if (bgImageRef.current) {
      ctx.drawImage(bgImageRef.current, 0, 0, canvas.width, canvas.height);
    }

    // Draw all completed strokes (dim those targeted by eraser)
    strokes.forEach((stroke, idx) => {
      const dimmed = eraserHitsRef.current.has(idx);
      drawStrokeOnCtx(ctx, stroke, canvas.width, canvas.height, dimmed);
    });

    // Draw current in-progress pen stroke
    if (currentStrokeRef.current) {
      drawStrokeOnCtx(ctx, currentStrokeRef.current, canvas.width, canvas.height);
    }
  }, [strokes, drawStrokeOnCtx]);

  useEffect(() => {
    if (canvasSize.width > 0 && canvasSize.height > 0) {
      requestAnimationFrame(() => {
        redrawCanvas();
      });
    }
  }, [canvasSize, redrawCanvas]);

  // Load initial data
  useEffect(() => {
    if (!initialData || !imageLoaded || initialDataLoadedRef.current) return;
    if (canvasSize.width === 0 || canvasSize.height === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      if (bgImageRef.current) {
        ctx.drawImage(bgImageRef.current, 0, 0, canvas.width, canvas.height);
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      initialDataLoadedRef.current = true;
    };
    img.src = initialData;
  }, [initialData, imageLoaded, canvasSize]);

  // ── Coordinate helpers ──

  const getCanvasPoint = (e: React.MouseEvent | React.TouchEvent): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    let clientX: number, clientY: number;

    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: (clientX - rect.left) / rect.width,
      y: (clientY - rect.top) / rect.height,
    };
  };

  // ── Emit helper ──

  const emitChange = useCallback(
    (currentStrokes: Stroke[]) => {
      if (!onChange) return;
      requestAnimationFrame(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        if (currentStrokes.length === 0) {
          onChange('');
          return;
        }
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        if (tempCtx) {
          for (const stroke of currentStrokes) {
            drawStrokeOnCtx(tempCtx, stroke, canvas.width, canvas.height);
          }
          onChange(tempCanvas.toDataURL('image/png'));
        }
      });
    },
    [onChange, drawStrokeOnCtx],
  );

  // ── Pointer event handlers ──

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const point = getCanvasPoint(e);
    if (!point) return;

    if (tool === 'eraser') {
      // Begin an eraser gesture – check if the start point already hits a stroke
      eraserHitsRef.current = new Set<number>();
      strokes.forEach((stroke, idx) => {
        if (pointHitsStroke(point, stroke, canvasSize.width, canvasSize.height)) {
          eraserHitsRef.current.add(idx);
        }
      });
      setIsDrawing(true);
      redrawCanvas();
      return;
    }

    // Pen
    const newStroke: Stroke = {
      points: [point],
      color: penColor,
      size: brushSize,
    };
    currentStrokeRef.current = newStroke;
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;

    const point = getCanvasPoint(e);
    if (!point) return;

    if (tool === 'eraser') {
      // Continue eraser gesture – accumulate hits
      let changed = false;
      strokes.forEach((stroke, idx) => {
        if (!eraserHitsRef.current.has(idx) && pointHitsStroke(point, stroke, canvasSize.width, canvasSize.height)) {
          eraserHitsRef.current.add(idx);
          changed = true;
        }
      });
      if (changed) {
        redrawCanvas();
      }
      return;
    }

    // Pen
    if (!currentStrokeRef.current) return;
    currentStrokeRef.current.points.push(point);
    redrawCanvas();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;

    if (tool === 'eraser') {
      // Commit the eraser: remove all hit strokes
      if (eraserHitsRef.current.size > 0) {
        const newStrokes = strokes.filter((_, idx) => !eraserHitsRef.current.has(idx));
        eraserHitsRef.current = new Set();
        setStrokes(newStrokes);
        emitChange(newStrokes);
      }
      eraserHitsRef.current = new Set();
      setIsDrawing(false);
      return;
    }

    // Pen
    const completedStroke = currentStrokeRef.current;
    currentStrokeRef.current = null;
    setIsDrawing(false);

    if (completedStroke && completedStroke.points.length >= 2) {
      const newStrokes = [...strokes, completedStroke];
      setStrokes(newStrokes);
      emitChange(newStrokes);
    }
  };

  // ── Undo / Clear ──

  const handleUndo = () => {
    if (strokes.length === 0) return;
    const newStrokes = strokes.slice(0, -1);
    setStrokes(newStrokes);
    emitChange(newStrokes);
  };

  const handleClear = () => {
    setStrokes([]);
    currentStrokeRef.current = null;
    eraserHitsRef.current = new Set();
    if (onChange) {
      onChange('');
    }
  };

  return (
    <div className={cn('space-y-3', className)}>
      <Label className="text-base font-medium">Autonomous Path Drawing</Label>
      <p className="text-sm text-muted-foreground">
        Draw the robot&apos;s autonomous path on the field. Use the pen to draw and the eraser to remove entire strokes.
      </p>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 p-2 bg-muted/50 rounded-lg border">
        {/* Tool Selection */}
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant={tool === 'pen' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTool('pen')}
            title="Pen"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant={tool === 'eraser' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTool('eraser')}
            title="Stroke Eraser – drag over strokes to remove them"
          >
            <Eraser className="h-4 w-4" />
          </Button>
        </div>

        {/* Separator */}
        <div className="h-6 w-px bg-border" />

        {/* Color Palette (only shown for pen) */}
        {tool === 'pen' && (
          <div className="flex items-center gap-1">
            {colors.map((color) => (
              <button
                key={color}
                type="button"
                className={cn(
                  'w-6 h-6 rounded-full border-2 transition-transform',
                  penColor === color ? 'border-foreground scale-110' : 'border-muted-foreground/30 hover:scale-105'
                )}
                style={{ backgroundColor: color }}
                onClick={() => setPenColor(color)}
                title={color}
              />
            ))}
          </div>
        )}

        {tool === 'eraser' && (
          <p className="text-xs text-muted-foreground">Drag over a stroke to remove it</p>
        )}

        {/* Separator */}
        {tool === 'pen' && <div className="h-6 w-px bg-border" />}

        {/* Brush Size (pen only) */}
        {tool === 'pen' && (
          <div className="flex items-center gap-2 min-w-[120px]">
            <span className="text-xs text-muted-foreground whitespace-nowrap">Size:</span>
            <Slider
              value={[brushSize]}
              onValueChange={([val]) => setBrushSize(val)}
              min={1}
              max={20}
              step={1}
              className="w-20"
            />
            <span className="text-xs text-muted-foreground w-4">{brushSize}</span>
          </div>
        )}

        {/* Separator */}
        <div className="h-6 w-px bg-border" />

        {/* Undo / Clear */}
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleUndo}
            disabled={strokes.length === 0}
            title="Undo"
          >
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClear}
            disabled={strokes.length === 0}
            title="Clear All"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className="relative w-full border rounded-lg overflow-hidden bg-muted/30 touch-none"
      >
        <canvas
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          className={cn(
            'block w-full',
            tool === 'pen' ? 'cursor-crosshair' : 'cursor-pointer',
          )}
          style={{
            height: canvasSize.height > 0 ? `${canvasSize.height}px` : 'auto',
          }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          onTouchCancel={stopDrawing}
        />
      </div>
    </div>
  );
}
