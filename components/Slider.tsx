export type SliderProps = {
  label: string
  value: number
  min: number
  max: number
  onChange: (value: number) => void
}

/** Labelled range slider. The caller builds the label text, e.g. "Tempo: 120 BPM". */
export function Slider({ label, value, min, max, onChange }: SliderProps) {
  return (
    <label className="flex items-center gap-4">
      <span className="w-24">{label}</span>
      <input
        type="range"
        className="w-64 focus-ring"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(e) => {
          onChange(e.currentTarget.valueAsNumber)
        }}
      />
    </label>
  )
}
