import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Option {
  label: string;
  value: string | number;
}

interface ChipSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
}

export function ChipSelect({ value, onChange, options }: ChipSelectProps) {
  const selectedValues = value ? String(value).split(',').filter(v => v !== "") : [];

  const handleSelect = (optionValue: string) => {
    const strVal = String(optionValue);
    if (!selectedValues.includes(strVal)) {
      const newValues = [...selectedValues, strVal];
      onChange(newValues.join(','));
    }
  };

  const handleRemove = (optionValue: string) => {
    const strVal = String(optionValue);
    const newValues = selectedValues.filter((v) => v !== strVal);
    onChange(newValues.join(','));
  };

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {selectedValues.map((val) => {
        const option = options.find((o) => String(o.value) === val);
        // If option not found (e.g. legacy data), render value? Or skip?
        // User requested showing labels.
        const label = option ? option.label : val; 
        
        return (
          <Badge key={val} variant="secondary" className="flex items-center gap-1 pr-1">
            {label}
            <button
              type="button"
              onClick={() => handleRemove(val)}
              className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
            </button>
          </Badge>
        );
      })}

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="icon" className="h-8 w-8 rounded-full border-dashed">
            <Plus className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0" align="start">
          <div className="p-1">
             <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                Seleccionar opciones
             </div>
            {options.map((option) => {
              const isSelected = selectedValues.includes(String(option.value));
              return (
                <div
                  key={option.value}
                  className={cn(
                    "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                    isSelected && "bg-accent/50"
                  )}
                  onClick={() => !isSelected ? handleSelect(String(option.value)) : handleRemove(String(option.value))}
                >
                  <div className={cn("mr-2 flex h-4 w-4 items-center justify-center", 
                    isSelected ? "opacity-100" : "opacity-0"
                  )}>
                    <Check className="h-4 w-4" />
                  </div>
                  <span>{option.label}</span>
                </div>
              );
            })}
             {options.length === 0 && <div className="p-2 text-sm text-center text-muted-foreground">No hay opciones</div>}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
