// Sólo una definición puede quedar fijada a la vez: al abrir una nueva se
// cierra la anterior y cualquier toque posterior en la página la descarta.
type Listener = () => void;

let activeTooltipId: string | null = null;
const listeners = new Set<Listener>();
let detachDismissListeners: (() => void) | null = null;

const emit = (): void => {
  listeners.forEach((listener) => listener());
};

const handleDismissEvent = (): void => {
  closeDefinitionTooltip();
};

const handleKeyDown = (event: KeyboardEvent): void => {
  if (event.key === 'Escape') closeDefinitionTooltip();
};

const attachDismissListeners = (): void => {
  if (detachDismissListeners || typeof document === 'undefined') return;

  // El toque que abre la definición ya ocurrió (la mantiene pulsada), así que
  // el siguiente pointerdown siempre es "el nuevo tap" que debe cerrarla.
  document.addEventListener('pointerdown', handleDismissEvent, true);
  document.addEventListener('keydown', handleKeyDown, true);
  detachDismissListeners = () => {
    document.removeEventListener('pointerdown', handleDismissEvent, true);
    document.removeEventListener('keydown', handleKeyDown, true);
  };
};

const removeDismissListeners = (): void => {
  detachDismissListeners?.();
  detachDismissListeners = null;
};

export const subscribeDefinitionTooltip = (listener: Listener): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const getActiveDefinitionTooltipId = (): string | null => activeTooltipId;

export const getServerDefinitionTooltipId = (): string | null => null;

export const openDefinitionTooltip = (id: string): void => {
  if (activeTooltipId === id) return;
  activeTooltipId = id;
  attachDismissListeners();
  emit();
};

export const closeDefinitionTooltip = (id?: string): void => {
  if (activeTooltipId === null) return;
  if (id !== undefined && activeTooltipId !== id) return;
  activeTooltipId = null;
  removeDismissListeners();
  emit();
};
