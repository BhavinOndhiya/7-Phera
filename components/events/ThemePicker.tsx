'use client';

import { useState } from 'react';
import { Check, Palette, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { PRESET_THEMES } from '@/lib/constants';

interface ThemePickerProps {
  value: {
    theme_name: string | null;
    theme_colors: string[] | null;
    theme_description: string | null;
  };
  onChange: (value: {
    theme_name: string | null;
    theme_colors: string[] | null;
    theme_description: string | null;
  }) => void;
}

export function ThemePicker({ value, onChange }: ThemePickerProps) {
  const [customColor, setCustomColor] = useState('#fb2e63');

  function selectPreset(preset: (typeof PRESET_THEMES)[number]) {
    onChange({
      theme_name: preset.name,
      theme_colors: preset.colors,
      theme_description: preset.description,
    });
  }

  function addCustomColor() {
    if (!customColor || (value.theme_colors?.length ?? 0) >= 6) return;
    onChange({
      ...value,
      theme_colors: [...(value.theme_colors ?? []), customColor],
    });
  }

  function removeColor(idx: number) {
    onChange({
      ...value,
      theme_colors: value.theme_colors?.filter((_, i) => i !== idx) ?? null,
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <Label className="flex items-center gap-2 mb-3">
          <Palette className="h-4 w-4" /> Choose a preset theme
        </Label>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {PRESET_THEMES.map((preset) => {
            const isSelected = value.theme_name === preset.name;
            return (
              <button
                key={preset.name}
                type="button"
                onClick={() => selectPreset(preset)}
                className={cn(
                  'group relative rounded-xl border-2 p-4 text-left transition-all',
                  isSelected
                    ? 'border-rose-500 shadow-md'
                    : 'border-border hover:border-rose-200'
                )}
              >
                {isSelected && (
                  <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-rose-500 flex items-center justify-center">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                )}
                <div className="flex gap-1 mb-3">
                  {preset.colors.map((c, i) => (
                    <div
                      key={i}
                      className="h-8 flex-1 rounded-md ring-1 ring-black/5"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <p className="font-medium text-sm leading-tight">{preset.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {preset.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <Label className="mb-3 block">Custom palette</Label>
        <div className="flex flex-wrap items-center gap-3 p-4 rounded-lg border bg-muted/30">
          {value.theme_colors?.map((color, i) => (
            <div key={`${color}-${i}`} className="relative group">
              <div
                className="h-12 w-12 rounded-lg ring-1 ring-black/5 shadow-sm"
                style={{ backgroundColor: color }}
              />
              <button
                type="button"
                onClick={() => removeColor(i)}
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <Input
              type="color"
              value={customColor}
              onChange={(e) => setCustomColor(e.target.value)}
              className="h-12 w-12 p-1 cursor-pointer"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addCustomColor}
              disabled={(value.theme_colors?.length ?? 0) >= 6}
            >
              <Plus className="h-3 w-3 mr-1" />
              Add
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Pick up to 6 colours for your theme palette.
        </p>
      </div>
    </div>
  );
}
