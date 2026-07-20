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
      plugins: {
        get: () => Promise<any[]>;
        enable: (name: string) => Promise<{ success: boolean }>;
        disable: (name: string) => Promise<{ success: boolean }>;
        getSettings: (name: string) => Promise<Record<string, any>>;
        setSettings: (name: string, data: Record<string, any>) => Promise<{ success: boolean }>;
        readDir: (name: string) => Promise<{ success: boolean; files: string[] }>;
        writeFile: (pluginName: string, filePath: string, content: string) => Promise<{ success: boolean }>;
        readFile: (pluginName: string, filePath: string) => Promise<{ success: boolean; content: string }>;
      };
      themes: {
        get: () => Promise<any[]>;
        install: (name: string, data: any) => Promise<{ success: boolean }>;
        remove: (name: string) => Promise<{ success: boolean }>;
        readDir: () => Promise<{ success: boolean; files: string[] }>;
        writeFile: (fileName: string, content: string) => Promise<{ success: boolean }>;
        deleteFile: (fileName: string) => Promise<{ success: boolean }>;
      };
    };
  }
}
