// Type declaration for Telegram Mini App WebApp global
interface TelegramWebApp {
  ready(): void;
  expand(): void;
  close(): void;
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  colorScheme: "light" | "dark";
  themeParams: Record<string, string>;
  initData: string;
  initDataUnsafe: Record<string, unknown>;
  MainButton: {
    text: string;
    show(): void;
    hide(): void;
    onClick(fn: () => void): void;
  };
  setHeaderColor(color: string): void;
  setBackgroundColor(color: string): void;
  [key: string]: unknown;
}

interface Window {
  Telegram?: {
    WebApp: TelegramWebApp;
  };
}
