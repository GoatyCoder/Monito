import { Button } from '@/components/ui/button';

export type ResourceView = 'active' | 'deleted';

interface ViewToggleProps {
  view: ResourceView;
  onChange: (view: ResourceView) => void;
  activeLabel?: string;
  deletedLabel?: string;
}

export function ViewToggle({
  view,
  onChange,
  activeLabel = 'Attivi',
  deletedLabel = 'Cestino',
}: ViewToggleProps) {
  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant={view === 'active' ? 'default' : 'outline'}
        onClick={() => onChange('active')}
      >
        {activeLabel}
      </Button>
      <Button
        type="button"
        variant={view === 'deleted' ? 'default' : 'outline'}
        onClick={() => onChange('deleted')}
      >
        {deletedLabel}
      </Button>
    </div>
  );
}
