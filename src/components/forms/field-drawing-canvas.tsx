'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Pencil, Eraser, Undo2, Trash2, Target, Fuel, X, MapPin, ArrowUpFromLine } from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Marker types ──

type MarkerType = 'shooting' | 'fuel-pickup' | 'starting-position' | 'climb';

interface Marker {
  id: string;
  type: MarkerType;
  /** Normalised 0-1 position on the field */
  x: number;
  y: number;
  /** Global placement order (1-based) */
  order: number;
}

const MARKER_DEFS: Record<MarkerType, { label: string; color: string }> = {
  'starting-position': { label: 'Start',       color: '#22c55e' },
  'shooting':          { label: 'Shooting',     color: '#ef4444' },
  'fuel-pickup':       { label: 'Fuel Pickup',  color: '#f59e0b' },
  'climb':             { label: 'Climb',        color: '#8b5cf6' },
};

const MARKER_ICONS: Record<MarkerType, React.ComponentType<{ className?: string }>> = {
  'starting-position': MapPin,
  'shooting':          Target,
  'fuel-pickup':       Fuel,
  'climb':             ArrowUpFromLine,
};

interface FieldDrawingCanvasProps {
  /** Initial drawing data as a base64 data URL */
  initialData?: string;
  /** Callback when drawing changes, returns base64 data URL of the drawing */
  onChange?: (dataUrl: string) => void;
  /** Callback when markers change */
  onMarkersChange?: (markers: Marker[]) => void;
  /** Initial markers */
  initialMarkers?: Marker[];
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
  onMarkersChange,
  initialMarkers,
  fieldImageSrc = '/assets/Rebuilt Field .png',
  className,
}: FieldDrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<Tool>('pen');
  const penColor = '#000000';
  const brushSize = 3;
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const currentStrokeRef = useRef<Stroke | null>(null);
  // Track which stroke indices are highlighted for removal while eraser is held
  const eraserHitsRef = useRef<Set<number>>(new Set());
  const bgImageRef = useRef<HTMLImageElement | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const initialDataLoadedRef = useRef(false);
  // Track the endpoint of the last completed stroke for marker placement
  const lastStrokeEndRef = useRef<Point>({ x: 0.5, y: 0.5 });

  // ── Markers state ──
  const [markers, setMarkers] = useState<Marker[]>(initialMarkers ?? []);
  const draggingMarkerRef = useRef<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const initialMarkersLoadedRef = useRef(false);

  // Sync initial markers once
  useEffect(() => {
    if (initialMarkers && !initialMarkersLoadedRef.current) {
      setMarkers(initialMarkers);
      initialMarkersLoadedRef.current = true;
    }
  }, [initialMarkers]);

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

    // Clear canvas and fill with white background
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

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
      // Track the last point for marker spawn position
      lastStrokeEndRef.current = completedStroke.points[completedStroke.points.length - 1];
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
    setMarkers([]);
    if (onChange) {
      onChange('');
    }
    if (onMarkersChange) {
      onMarkersChange([]);
    }
  };

  // ── Marker helpers ──

  const addMarker = (type: MarkerType) => {
    // Enforce single-use for starting-position and climb
    if (type === 'starting-position' && markers.some((m) => m.type === 'starting-position')) return;
    if (type === 'climb' && markers.some((m) => m.type === 'climb')) return;

    const nextOrder = markers.length + 1;
    const spawnPos = lastStrokeEndRef.current;
    const newMarker: Marker = {
      id: `${type}-${Date.now()}-${nextOrder}`,
      type,
      x: spawnPos.x,
      y: spawnPos.y,
      order: nextOrder,
    };
    const updated = [...markers, newMarker];
    setMarkers(updated);
    onMarkersChange?.(updated);
  };

  const removeMarker = (id: string) => {
    // Remove the marker and re-number remaining markers to keep order contiguous
    const filtered = markers.filter((m) => m.id !== id);
    const updated = filtered.map((m, idx) => ({ ...m, order: idx + 1 }));
    setMarkers(updated);
    onMarkersChange?.(updated);
  };

  const handleMarkerPointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    marker: Marker,
  ) => {
    e.stopPropagation();
    e.preventDefault();
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    draggingMarkerRef.current = {
      id: marker.id,
      offsetX: e.clientX - rect.left - rect.width / 2,
      offsetY: e.clientY - rect.top - rect.height / 2,
    };
    el.setPointerCapture(e.pointerId);
  };

  const handleMarkerPointerMove = (
    e: React.PointerEvent<HTMLDivElement>,
  ) => {
    if (!draggingMarkerRef.current) return;
    e.stopPropagation();
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();

    const dragId = draggingMarkerRef.current.id;
    const x = (e.clientX - draggingMarkerRef.current.offsetX - rect.left) / rect.width;
    const y = (e.clientY - draggingMarkerRef.current.offsetY - rect.top) / rect.height;

    const clampedX = Math.max(0, Math.min(1, x));
    const clampedY = Math.max(0, Math.min(1, y));

    setMarkers((prev) =>
      prev.map((m) =>
        m.id === dragId
          ? { ...m, x: clampedX, y: clampedY }
          : m,
      ),
    );
  };

  const handleMarkerPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingMarkerRef.current) return;
    e.stopPropagation();
    draggingMarkerRef.current = null;
    // Emit the latest markers after drag ends
    setMarkers((prev) => {
      onMarkersChange?.(prev);
      return prev;
    });
  };

  return (
    <div className={cn('space-y-3', className)}>
      <Label className="text-base font-medium">Autonomous Path Drawing</Label>
      <p className="text-sm text-muted-foreground">
        Draw the robot&apos;s autonomous path on the field. Drag markers onto the field to indicate shooting and fuel pickup positions.
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

        {tool === 'eraser' && (
          <p className="text-xs text-muted-foreground">Drag over a stroke to remove it</p>
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
            disabled={strokes.length === 0 && markers.length === 0}
            title="Clear All"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Marker Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">Add markers:</span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => addMarker('starting-position')}
          disabled={markers.some((m) => m.type === 'starting-position')}
          className="gap-1.5"
        >
          <MapPin className="h-4 w-4 text-green-500" />
          Start
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => addMarker('shooting')}
          className="gap-1.5"
        >
          <Target className="h-4 w-4 text-red-500" />
          Shooting
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => addMarker('fuel-pickup')}
          className="gap-1.5"
        >
          <Fuel className="h-4 w-4 text-amber-500" />
          Fuel Pickup
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => addMarker('climb')}
          disabled={markers.some((m) => m.type === 'climb')}
          className="gap-1.5"
        >
          <ArrowUpFromLine className="h-4 w-4 text-violet-500" />
          Climb
        </Button>
        {markers.length > 0 && (
          <span className="text-xs text-muted-foreground ml-1">
            ({markers.length} marker{markers.length !== 1 ? 's' : ''} placed — drag to reposition)
          </span>
        )}
      </div>

      {/* Canvas + Markers */}
      <div
        ref={containerRef}
        className="relative w-full border rounded-lg overflow-hidden bg-white touch-none select-none"
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

        {/* Draggable Markers */}
        {markers.map((marker) => {
          const def = MARKER_DEFS[marker.type];
          const MarkerIcon = MARKER_ICONS[marker.type];
          const markerNumber = marker.order;
          return (
            <div
              key={marker.id}
              className="absolute pointer-events-auto group"
              style={{
                left: `${marker.x * 100}%`,
                top: `${marker.y * 100}%`,
                transform: 'translate(-50%, -50%)',
                zIndex: 10,
                touchAction: 'none',
              }}
              onPointerDown={(e) => handleMarkerPointerDown(e, marker)}
              onPointerMove={handleMarkerPointerMove}
              onPointerUp={handleMarkerPointerUp}
            >
              {/* Circle marker with icon and number badge */}
              <div
                className="relative w-9 h-9 rounded-full flex items-center justify-center text-white shadow-lg cursor-grab active:cursor-grabbing border-2 border-white/60"
                style={{ backgroundColor: def.color }}
                title={`${def.label} #${markerNumber}`}
              >
                <MarkerIcon className="h-4 w-4" />
                {/* Number badge */}
                <span
                  className="absolute -bottom-1.5 -left-1.5 w-5 h-5 rounded-full bg-white text-[10px] font-bold flex items-center justify-center shadow-sm border"
                  style={{ color: def.color, borderColor: def.color }}
                >
                  {markerNumber}
                </span>
                {/* Remove button – appears on hover */}
                <button
                  type="button"
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black"
                  onPointerDown={(e) => {
                    e.stopPropagation();
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeMarker(marker.id);
                  }}
                  title={`Remove ${def.label} #${markerNumber}`}
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
