interface BrandHeaderProps {
  subtitle: string;
}

export function BrandHeader({ subtitle }: BrandHeaderProps) {
  return (
    <div className="flex flex-col items-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary" aria-hidden="true">
        <span className="text-xl font-bold text-white">M</span>
      </div>
      <h1 className="text-2xl font-bold text-foreground">Monito</h1>
      <p className="mt-2 text-foreground-muted">{subtitle}</p>
    </div>
  );
}
