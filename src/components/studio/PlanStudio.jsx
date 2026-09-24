/** Plan Studio: upload a floor plan photo, trace it, and hand back a compiled
 *  BuildingGeometry. Opens as a full-screen overlay from step 3, lazy-loaded
 *  so nothing here touches the homeowner path unless it is actually opened.
 *
 *  Every stage after the outline is optional - accepting the defaults (an
 *  inferred grid, a 3.0 m storey) is always a valid way to finish, exactly
 *  the same fallback compileGeometry itself would take. This component only
 *  orchestrates the flow; the maths lives in usePlanTrace/geometry/compile.js,
 *  and the canvas interaction lives in StudioCanvas. */

import { useState } from 'react';
import { usePlanTrace, STUDIO_STAGES } from '../../hooks/usePlanTrace.js';
import StudioCanvas from './StudioCanvas.jsx';
import { Chip, ExitIcon, ArrowLeft, ArrowRight, CheckIcon } from '../ui/Primitives.jsx';
import { formatNumber, formatArea, sqmToSqft } from '../../lib/units.js';

const STAGE_TITLES = {
  upload: 'Upload a floor plan',
  scale: 'Set the scale',
  outline: 'Trace the outline',
  columns: 'Place your columns',
  storey: 'Storey height',
  done: 'Review and use',
};

function newTraceId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `trace-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

export default function PlanStudio({ onClose, onUseTrace }) {
  const { state, dispatch, geometry, canUndo, loadImageFile } = usePlanTrace();
  const { stage, doc } = state;
  const [dragOver, setDragOver] = useState(false);

  const stageIndex = STUDIO_STAGES.indexOf(stage);
  const prevStage = stageIndex > 1 ? STUDIO_STAGES[stageIndex - 1] : null; // never back into 'upload'

  const onFileChosen = (file) => {
    if (file && file.type.startsWith('image/')) loadImageFile(file);
  };

  const finish = () => {
    if (!geometry) return;
    // A lightweight snapshot of the drawing itself - just enough to redraw
    // the outline/grid/columns over the photo elsewhere (step 3's detail
    // pane), without carrying the whole editable TraceDoc out of the Studio.
    const preview = {
      imageUrl: doc.image.url,
      imageW: doc.image.w,
      imageH: doc.image.h,
      outline: doc.outline.points,
      columns: doc.columns,
      scale: doc.scale,
    };
    onUseTrace({ id: newTraceId(), geometry, preview });
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-base">
      <header className="flex items-center justify-between gap-4 border-b border-line px-4 py-3 sm:px-6">
        <div className="min-w-0">
          <p className="label-eyebrow">
            Plan Studio {stage !== 'upload' && `· Step ${stageIndex} of ${STUDIO_STAGES.length - 1}`}
          </p>
          <h2 className="mt-0.5 truncate text-base text-ink sm:text-lg">{STAGE_TITLES[stage]}</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex shrink-0 items-center gap-1.5 font-mono text-xs text-dim transition-colors hover:text-molten"
        >
          Close <ExitIcon className="h-3.5 w-3.5" />
        </button>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* ---- canvas -------------------------------------------------- */}
        <div className="relative min-h-[45vh] flex-1 overflow-hidden bg-raised">
          {!doc.image ? (
            <UploadDropzone
              dragOver={dragOver}
              setDragOver={setDragOver}
              onFileChosen={onFileChosen}
            />
          ) : (
            <StudioCanvas image={doc.image} stage={stage} doc={doc} geometry={geometry} dispatch={dispatch} />
          )}
        </div>

        {/* ---- side panel ------------------------------------------------ */}
        <aside className="flex w-full shrink-0 flex-col gap-4 border-t border-line bg-panel p-4 sm:p-5 lg:w-80 lg:border-l lg:border-t-0">
          {stage === 'upload' && (
            <p className="text-xs leading-relaxed text-dim">
              Upload a photo or scan of a floor plan. It stays on this device - nothing is
              uploaded anywhere. JPG or PNG.
            </p>
          )}

          {stage === 'scale' && (
            <ScalePanel doc={doc} dispatch={dispatch} />
          )}

          {stage === 'outline' && (
            <OutlinePanel doc={doc} geometry={geometry} canUndo={canUndo} dispatch={dispatch} />
          )}

          {stage === 'columns' && (
            <ColumnsPanel doc={doc} geometry={geometry} canUndo={canUndo} dispatch={dispatch} />
          )}

          {stage === 'storey' && (
            <StoreyPanel doc={doc} dispatch={dispatch} />
          )}

          {stage === 'done' && (
            <DonePanel geometry={geometry} onUseTrace={finish} onStartOver={() => dispatch({ type: 'reset' })} />
          )}

          <div className="mt-auto flex items-center justify-between gap-3 pt-2">
            {prevStage ? (
              <button
                type="button"
                onClick={() => dispatch({ type: 'goToStage', value: prevStage })}
                className="btn-ghost"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </button>
            ) : (
              <span />
            )}
            <StageNextButton stage={stage} doc={doc} geometry={geometry} dispatch={dispatch} />
          </div>
        </aside>
      </div>
    </div>
  );
}

function StageNextButton({ stage, doc, geometry, dispatch }) {
  if (stage === 'upload' || stage === 'done') return null;

  if (stage === 'scale') {
    const ready = Boolean(doc.scale?.a && doc.scale?.b && Number(doc.scale.value) > 0);
    return (
      <button type="button" className="btn-primary" disabled={!ready} onClick={() => dispatch({ type: 'confirmScale' })}>
        Next <ArrowRight className="h-3.5 w-3.5" />
      </button>
    );
  }
  if (stage === 'outline') {
    return (
      <button
        type="button"
        className="btn-primary"
        disabled={!doc.outline.closed}
        onClick={() => dispatch({ type: 'confirmOutline' })}
      >
        Next <ArrowRight className="h-3.5 w-3.5" />
      </button>
    );
  }
  if (stage === 'columns') {
    return (
      <button type="button" className="btn-primary" onClick={() => dispatch({ type: 'confirmColumns' })}>
        Next <ArrowRight className="h-3.5 w-3.5" />
      </button>
    );
  }
  if (stage === 'storey') {
    return (
      <button
        type="button"
        className="btn-primary"
        disabled={!(Number(doc.storey.heightM) > 0)}
        onClick={() => dispatch({ type: 'confirmStorey' })}
      >
        Next <ArrowRight className="h-3.5 w-3.5" />
      </button>
    );
  }
  return null;
}

function UploadDropzone({ dragOver, setDragOver, onFileChosen }) {
  return (
    <div
      className={[
        'flex h-full w-full flex-col items-center justify-center gap-4 border-2 border-dashed p-8 text-center transition-colors',
        dragOver ? 'border-molten bg-molten/[0.05]' : 'border-line',
      ].join(' ')}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        onFileChosen(e.dataTransfer.files?.[0]);
      }}
    >
      <p className="max-w-xs text-sm text-dim">Drag a floor plan photo here, or</p>
      <label className="btn-primary cursor-pointer">
        Choose a photo
        <input
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => onFileChosen(e.target.files?.[0])}
        />
      </label>
    </div>
  );
}

function ScalePanel({ doc, dispatch }) {
  const { scale } = doc;
  const bothSet = Boolean(scale?.a && scale?.b);
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs leading-relaxed text-dim">
        Tap two points across a wall or dimension you already know the real length of - a door
        width, a room wall. A longer, more careful line gives a tighter estimate: area error
        grows with the square of scale error.
      </p>
      <div className="flex items-center gap-2">
        <span className="label-key">Points</span>
        <span className="font-mono text-xs text-ink">
          {scale?.b ? '2 / 2 set' : scale?.a ? '1 / 2 - tap the other end' : '0 / 2'}
        </span>
        {(scale?.a || scale?.b) && (
          <button
            type="button"
            onClick={() => dispatch({ type: 'clearScalePoints' })}
            className="ml-auto font-mono text-[10px] text-dim underline underline-offset-4 hover:text-molten"
          >
            Reset
          </button>
        )}
      </div>

      {bothSet && (
        <div className="flex flex-col gap-2">
          <label className="label-key">Real length of that line</label>
          <div className="flex gap-2">
            <div className="field flex-1">
              <input
                type="number"
                inputMode="decimal"
                value={scale.value}
                onChange={(e) => dispatch({ type: 'setScaleValue', value: e.target.value })}
                placeholder="0"
                className="w-full bg-transparent px-3 py-2.5 text-center font-mono text-lg tabular-nums text-ink outline-none"
              />
            </div>
            <div className="flex gap-1.5">
              {['m', 'ft'].map((u) => (
                <Chip key={u} selected={scale.unit === u} onClick={() => dispatch({ type: 'setScaleUnit', value: u })}>
                  {u}
                </Chip>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function OutlinePanel({ doc, geometry, canUndo, dispatch }) {
  const n = doc.outline.points.length;
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs leading-relaxed text-dim">
        Tap around the outer walls, corner by corner. Tap back on the first point (the hollow
        ring) to close the outline once you have gone all the way around.
      </p>
      <dl className="divide-y divide-line overflow-hidden rounded border border-line bg-base">
        <Row k="Points placed" v={n} />
        <Row k="Live area" v={geometry ? `${formatArea(sqmToSqft(geometry.derived.areaSqM), 'sqft')}` : '—'} accent />
      </dl>
      <button
        type="button"
        disabled={!canUndo}
        onClick={() => dispatch({ type: 'undo' })}
        className="btn-ghost self-start disabled:opacity-40"
      >
        Undo last point
      </button>
    </div>
  );
}

function ColumnsPanel({ doc, geometry, canUndo, dispatch }) {
  const placed = doc.columns.length;
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs leading-relaxed text-dim">
        Optional. Tap where the real columns sit for the tightest estimate, or skip this and an
        evenly spaced grid will be inferred automatically.
      </p>
      <dl className="divide-y divide-line overflow-hidden rounded border border-line bg-base">
        <Row k="You placed" v={placed} />
        <Row
          k="In use"
          v={
            geometry
              ? `${geometry.derived.columnCount} ${geometry.columnsInferred ? '(inferred grid)' : '(your columns)'}`
              : '—'
          }
          accent
        />
      </dl>
      <button
        type="button"
        disabled={!canUndo || placed === 0}
        onClick={() => dispatch({ type: 'undo' })}
        className="btn-ghost self-start disabled:opacity-40"
      >
        Undo last column
      </button>
    </div>
  );
}

function StoreyPanel({ doc, dispatch }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs leading-relaxed text-dim">
        Height of one storey, floor to floor. 3.0 m is a typical residential default - shown, not
        hidden, so you can correct it if you know better.
      </p>
      <div className="field">
        <input
          type="number"
          inputMode="decimal"
          step="0.1"
          value={doc.storey.heightM}
          onChange={(e) => dispatch({ type: 'setStoreyHeight', value: e.target.value })}
          className="w-full bg-transparent px-4 py-3 text-center font-mono text-2xl tabular-nums text-ink outline-none"
        />
        <span className="border-l border-line px-3.5 py-3.5 font-mono text-xs text-dim">m</span>
      </div>
    </div>
  );
}

function DonePanel({ geometry, onUseTrace, onStartOver }) {
  if (!geometry) {
    return (
      <p className="text-xs leading-relaxed text-dim">
        This trace could not be compiled - the outline may be too small or self-intersecting. Go
        back and adjust it, or start over.
      </p>
    );
  }
  const d = geometry.derived;
  return (
    <div className="flex flex-col gap-3">
      <dl className="divide-y divide-line overflow-hidden rounded border border-line bg-base">
        <Row k="Area" v={formatArea(sqmToSqft(d.areaSqM), 'sqft')} accent />
        <Row k="Columns" v={`${d.columnCount} ${geometry.columnsInferred ? '(inferred)' : '(placed)'}`} />
        <Row k="Beam run" v={`${formatNumber(d.beamRunM, 1)} m`} />
        <Row k="Typical span" v={`${formatNumber(d.avgSpanM, 1)} m`} />
        <Row k="Storey height" v={`${formatNumber(geometry.storey.heightM, 1)} m`} />
      </dl>
      <button type="button" className="btn-primary" onClick={onUseTrace}>
        Use this trace <CheckIcon className="h-3.5 w-3.5" />
      </button>
      <button type="button" className="btn-ghost" onClick={onStartOver}>
        Start over
      </button>
    </div>
  );
}

function Row({ k, v, accent }) {
  return (
    <div className="flex items-center justify-between px-3 py-2">
      <dt className="label-key">{k}</dt>
      <dd className={`font-mono text-xs tabular-nums ${accent ? 'text-molten' : 'text-ink'}`}>{v}</dd>
    </div>
  );
}
