"use client";

import { Button } from "@/components/ui/button";
import { Choice, Item, NumberField, TextField, Toggle, hint } from "./fields";
import { DatapointPicker } from "./datapoint-picker";
import { buildDatapointRegistry } from "@/lib/game-config/datapoint-registry";
import type { TeamPageConfig, YearConfig } from "@/lib/types";

export type TeamPageSection =
  | "kpi" | "autoPerformance" | "teleopPerformance" | "chart" | "endgame" | "penalties" | "custom";

const CHART_COLORS = ["#f97316", "#ef4444", "#3b82f6", "#22c55e", "#a855f7", "#ec4899", "#14b8a6"];

export function TeamPageInspector({ section, config, value, onChange }: {
  section: TeamPageSection;
  config: YearConfig;
  value: TeamPageConfig;
  onChange: (patch: Partial<TeamPageConfig>) => void;
}) {
  const datapoints = buildDatapointRegistry(config).filter((d) => !d.pitSection);
  const numeric = datapoints.filter((d) => d.valueType === "number" || d.valueType === "boolean");
  const field = (label: string, key: string | undefined, change: (key: string) => void, enums = false) => (
    <div className="space-y-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <DatapointPicker value={key} onChange={change}
        datapoints={enums ? datapoints.filter((d) => d.valueType === "enum") : numeric} />
    </div>
  );
  const remove = (label: string, action: () => void) => (
    <Button type="button" variant="outline" size="sm" onClick={action}>{label}</Button>
  );

  if (section === "kpi") {
    return <div className="space-y-5">{(["auto", "teleop"] as const).map((phase) => {
      const kpi = value.kpis[phase];
      const update = (patch: Partial<typeof kpi>) => onChange({
        kpis: { ...value.kpis, [phase]: { ...kpi, ...patch } },
      });
      return <div key={phase} className="space-y-3">
        <p className="text-sm font-semibold">{phase === "auto" ? "Autonomous KPI" : "Teleop KPI"}</p>
        <TextField label="Label" value={kpi.label} onChange={(label) => update({ label })} />
        {field("Field", kpi.key, (key) => update({ key }))}
        <Choice label="Primary format" value={kpi.format ?? "number"} options={["number", "percent"]}
          onChange={(format) => update({ format })} />
        {field("Secondary field", kpi.subKey, (subKey) => update({ subKey }))}
        {kpi.subKey && remove("Remove secondary field", () => update({ subKey: undefined }))}
        <TextField label="Secondary label" value={kpi.subLabel} onChange={(subLabel) => update({ subLabel })} />
        <Choice label="Secondary format" value={kpi.subFormat ?? "number"} options={["number", "percent"]}
          onChange={(subFormat) => update({ subFormat })} />
        <Choice label="Icon" value={kpi.icon ?? "Activity"}
          options={["Activity", "Target", "Trophy", "Flame", "Package", "Puzzle", "BarChart", "Sparkles"]}
          onChange={(icon) => update({ icon })} />
      </div>;
    })}</div>;
  }

  if (section === "autoPerformance" || section === "teleopPerformance") {
    const performance = value[section];
    const update = (patch: Partial<typeof performance>) => onChange({ [section]: { ...performance, ...patch } });
    return <div className="space-y-4">
      {performance.metrics.map((metric, index) => {
        const edit = (patch: Partial<typeof metric>) => update({
          metrics: performance.metrics.map((item, i) => i === index ? { ...item, ...patch } : item),
        });
        return <div key={index} className="space-y-2 border-t pt-3">
          <TextField label="Metric label" value={metric.label} onChange={(label) => edit({ label })} />
          {field("Metric field", metric.key, (key) => edit({ key }))}
          <Choice label="Display" value={metric.type ?? "number"} options={["number", "rate", "badge"]}
            onChange={(type) => edit({ type })} />
          <TextField label="Unit" value={metric.unit} onChange={(unit) => edit({ unit })} />
          {remove("Remove metric", () => update({ metrics: performance.metrics.filter((_, i) => i !== index) }))}
        </div>;
      })}
      <Button type="button" variant="outline" size="sm" onClick={() => update({
        metrics: [...performance.metrics, { key: numeric[0]?.key ?? "", label: numeric[0]?.label ?? "New metric" }],
      })}>Add metric</Button>
      <Toggle label="Show points estimate" checked={!!performance.showPointsEstimate}
        onChange={(showPointsEstimate) => update({ showPointsEstimate })} />
      <p className={hint}>Without a custom formula, estimates use the scouting field points.</p>
      {(performance.pointsFormula ?? []).map((term, index) => (
        <div key={index} className="space-y-2 border-t pt-3">
          {field("Points field", term.key, (key) => update({
            pointsFormula: performance.pointsFormula?.map((item, i) => i === index ? { ...item, key } : item),
          }))}
          <NumberField label="Points multiplier" value={term.points} onChange={(points) => update({
            pointsFormula: performance.pointsFormula?.map((item, i) => i === index ? { ...item, points: points ?? 0 } : item),
          })} />
          {remove("Remove formula term", () => {
            const terms = performance.pointsFormula?.filter((_, i) => i !== index);
            update({ pointsFormula: terms?.length ? terms : undefined });
          })}
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={() => update({
        pointsFormula: [...(performance.pointsFormula ?? []), { key: numeric[0]?.key ?? "", points: 1 }],
      })}>Add formula term</Button>
    </div>;
  }

  if (section === "chart") {
    const chart = value.scoringBreakdownChart;
    const update = (patch: Partial<typeof chart>) => onChange({ scoringBreakdownChart: { ...chart, ...patch } });
    return <div className="space-y-3">
      <TextField label="Chart title" value={chart.title} onChange={(title) => update({ title })} />
      <TextField label="Chart description" value={chart.description} onChange={(description) => update({ description })} />
      <TextField label="Chart unit" value={chart.unit} onChange={(unit) => update({ unit })} />
      {chart.items.map((item, index) => {
        const edit = (patch: Partial<typeof item>) => update({
          items: chart.items.map((entry, i) => i === index ? { ...entry, ...patch } : entry),
        });
        return <div key={index} className="space-y-2 border-t pt-3">
          <TextField label="Item name" value={item.name} onChange={(name) => edit({ name })} />
          {field("Item field", item.key, (key) => edit({ key }))}
          <TextField label="Color" value={item.fill} onChange={(fill) => edit({ fill })} />
          {remove("Remove chart item", () => update({ items: chart.items.filter((_, i) => i !== index) }))}
        </div>;
      })}
      <Button type="button" variant="outline" size="sm" onClick={() => update({
        items: [...chart.items, {
          name: numeric[0]?.label ?? "New item", key: numeric[0]?.key ?? "",
          fill: CHART_COLORS[chart.items.length % CHART_COLORS.length],
        }],
      })}>Add chart item</Button>
    </div>;
  }

  if (section === "custom") {
    const sections = value.customSections ?? [];
    const set = (next: typeof sections) => onChange({ customSections: next.length ? next : undefined });
    const enums = datapoints.filter((d) => d.valueType === "enum");
    return <div className="space-y-3">
      <p className={hint}>Extra sections shown after the built-in ones.</p>
      {sections.map((custom, index) => {
        const edit = (patch: Partial<typeof custom>) =>
          set(sections.map((item, i) => i === index ? { ...item, ...patch } : item));
        const items = custom.items ?? [];
        const editItem = (itemIndex: number, patch: Partial<(typeof items)[number]>) =>
          edit({ items: items.map((item, i) => i === itemIndex ? { ...item, ...patch } : item) });
        const states = enums.find((d) => d.key === custom.fieldKey)?.states ?? [];
        const distribution = custom.type === "distribution";
        return <Item key={custom.id} title={custom.title || "Section"}
          onRemove={() => set(sections.filter((_, i) => i !== index))}>
          <TextField label="Title" value={custom.title} onChange={(title) => edit({ title })} />
          <TextField label="Description" value={custom.description}
            onChange={(description) => edit({ description: description || undefined })} />
          <Choice label="Shows" value={custom.type}
            options={[["distribution", "How often each choice is picked"], ["summaryCards", "Averages of fields"]]}
            onChange={(type) => edit({ type, fieldKey: undefined, items: [] })} />
          {distribution && field("Choice field", custom.fieldKey, (fieldKey) => edit({
            fieldKey,
            items: (enums.find((d) => d.key === fieldKey)?.states ?? []).map((state) => ({ key: state, label: state })),
          }), true)}
          {items.map((item, itemIndex) => <div key={itemIndex} className="space-y-2 border-l pl-3">
            {distribution
              ? states.length > 0
                ? <Choice label="Choice" value={item.key} options={states} onChange={(key) => editItem(itemIndex, { key })} />
                : <TextField label="Choice" value={item.key} onChange={(key) => editItem(itemIndex, { key })} />
              : field("Field", item.key, (key) => editItem(itemIndex, { key }))}
            <TextField label="Label" value={item.label} onChange={(label) => editItem(itemIndex, { label })} />
            {!distribution && <NumberField label="Points each (optional)" value={item.pointsMultiplier}
              onChange={(pointsMultiplier) => editItem(itemIndex, { pointsMultiplier })} />}
            {remove("Remove item", () => edit({ items: items.filter((_, i) => i !== itemIndex) }))}
          </div>)}
          <Button type="button" variant="outline" size="sm" onClick={() => edit({
            items: [...items, distribution
              ? { key: states[0] ?? "", label: states[0] ?? "New item" }
              : { key: numeric[0]?.key ?? "", label: numeric[0]?.label ?? "New item" }],
          })}>Add item</Button>
        </Item>;
      })}
      <Button type="button" variant="outline" size="sm" onClick={() => set([...sections, {
        id: `custom_${Date.now()}`, title: "New section", type: "summaryCards", items: [],
      }])}>Add section</Button>
    </div>;
  }

  if (section === "endgame") {
    const endgame = value.endgame;
    const update = (patch: Partial<typeof endgame>) => onChange({ endgame: { ...endgame, ...patch } });
    return <div className="space-y-3">
      <TextField label="Endgame title" value={endgame.title} onChange={(title) => update({ title })} />
      <TextField label="Endgame description" value={endgame.description} onChange={(description) => update({ description })} />
      <Choice label="Endgame display" value={endgame.displayType ?? "cards"} options={["cards", "chart", "both"]}
        onChange={(displayType) => update({ displayType })} />
      <TextField label="Summary title" value={endgame.summaryTitle} onChange={(summaryTitle) => update({ summaryTitle })} />
      <TextField label="Summary description" value={endgame.summaryDescription} onChange={(summaryDescription) => update({ summaryDescription })} />
      {field("Robot state field", endgame.stateKey, (stateKey) => {
        const selected = datapoints.find((d) => d.key === stateKey);
        const [phase, key] = stateKey.split(".");
        const definition = config.scoring[phase as keyof typeof config.scoring]?.[key];
        update({ stateKey, states: (selected?.states ?? []).map((state) => ({
          value: state, label: state, points: definition?.pointValues?.[state],
        })) });
      }, true)}
      {field("Breakdown field", endgame.breakdownKey, (breakdownKey) => update({ breakdownKey }))}
      {endgame.breakdownKey && remove("Remove breakdown field", () => update({ breakdownKey: undefined }))}
      {endgame.states.map((state, index) => {
        const edit = (patch: Partial<typeof state>) => update({
          states: endgame.states.map((item, i) => i === index ? { ...item, ...patch } : item),
        });
        return <div key={index} className="space-y-2 border-t pt-3">
          <TextField label="State value" value={state.value} onChange={(value) => edit({ value })} />
          <TextField label="State label" value={state.label} onChange={(label) => edit({ label })} />
          <NumberField label="State points" value={state.points} onChange={(points) => edit({ points })} />
          <NumberField label="Highlight threshold (%)" value={state.highlightThreshold} onChange={(highlightThreshold) => edit({ highlightThreshold })} />
          <TextField label="State color" value={state.fill} onChange={(fill) => edit({ fill })} />
          {remove("Remove state", () => update({ states: endgame.states.filter((_, i) => i !== index) }))}
        </div>;
      })}
      <Button type="button" variant="outline" size="sm" onClick={() => update({
        states: [...endgame.states, { value: "", label: "New state" }],
      })}>Add state</Button>
    </div>;
  }

  const penalties = value.penalties;
  const update = (patch: Partial<typeof penalties>) => onChange({ penalties: { ...penalties, ...patch } });
  return <div className="space-y-3">
    <TextField label="Penalties title" value={penalties.title} onChange={(title) => update({ title })} />
    <TextField label="Penalties description" value={penalties.description} onChange={(description) => update({ description })} />
    {(["minor", "major"] as const).map((kind) => <div key={kind} className="space-y-2">
      {field(`${kind} foul field`, penalties[`${kind}Key`], (key) => update({ [`${kind}Key`]: key }))}
      <TextField label={`${kind} foul label`} value={penalties[`${kind}Label`]}
        onChange={(label) => update({ [`${kind}Label`]: label })} />
      <NumberField label={`${kind} foul points`} value={penalties[`${kind}Points`]}
        onChange={(points) => update({ [`${kind}Points`]: points ?? 0 })} />
    </div>)}
    <NumberField label="Tech foul alert threshold" value={penalties.techFoulAlertThreshold}
      onChange={(techFoulAlertThreshold) => update({ techFoulAlertThreshold })} />
    <NumberField label="Breakdown alert threshold (%)" value={penalties.breakdownAlertThreshold}
      onChange={(breakdownAlertThreshold) => update({ breakdownAlertThreshold })} />
  </div>;
}
