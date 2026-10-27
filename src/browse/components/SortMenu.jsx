import { ArrowUpDown, Check } from 'lucide-react';
import { Button } from '../ui/Button.jsx';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '../ui/DropdownMenu.jsx';

export const SORT_OPTIONS = [
  { id: 'relevance', label: 'Most relevant' },
  { id: 'recent', label: 'Newest first' },
  { id: 'salary-desc', label: 'Salary: high to low' },
  { id: 'salary-asc', label: 'Salary: low to high' },
  { id: 'applicants', label: 'Fewest applicants' },
];

export const SortMenu = ({ value, onChange }) => {
  const active = SORT_OPTIONS.find((option) => option.id === value);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" size="sm" className="gap-1.5">
          <ArrowUpDown className="h-3.5 w-3.5 text-ink-400" aria-hidden="true" />
          <span className="hidden sm:inline text-ink-500">Sort:</span>
          <span className="font-medium text-ink-900">{active?.label}</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel>Sort results</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={value} onValueChange={onChange}>
          {SORT_OPTIONS.map((option) => (
            <DropdownMenuRadioItem key={option.id} value={option.id}>
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
