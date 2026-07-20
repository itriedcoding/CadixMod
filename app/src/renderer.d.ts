declare global {
  interface Window {
    api: {
      window: {
        minimize: () => Promise<void>;
        maximize: () => Promise<void>;
        close: () => Promise<void>;
        quit: () => Promise<void>;
      };
      discord: {
        detect: () => Promise<any[]>;
        isRunning: () => Promise<boolean>;
        inject: (inst: any) => Promise<{ success: boolean; message: string }>;
        uninject: (inst: any) => Promise<{ success: boolean; message: string }>;
        launch: (inst: any) => Promise<void>;
        kill: () => Promise<void>;
        isInjected: (inst: any) => Promise<boolean>;
        onStatus: (callback: (data: any) => void) => void;
      };
      settings: {
        get: () => Promise<any>;
        set: (s: any) => Promise<any>;
      };
      autoinject: {
        run: () => Promise<void>;
        remove: () => Promise<void>;
      };
      updater: {
        check: () => Promise<{ updateAvailable: boolean; version: string }>;
      };
    };
  }
}
