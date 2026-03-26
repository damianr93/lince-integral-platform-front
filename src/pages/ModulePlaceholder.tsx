interface Props {
  moduleName?: string;
}

export function ModulePlaceholder({ moduleName = 'Módulo' }: Props) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] space-y-3">
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
        <span className="text-2xl">🚧</span>
      </div>
      <h2 className="text-lg font-semibold text-foreground">{moduleName}</h2>
      <p className="text-sm text-muted-foreground text-center max-w-xs">
        Este módulo se está migrando a la plataforma unificada.
      </p>
    </div>
  );
}
