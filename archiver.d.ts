declare module "archiver" {
  interface ArchiverOptions {
    zlib?: {
      level?: number;
    };
  }

  interface Archiver {
    directory(path: string, prefix: boolean | string): void;
    finalize(): Promise<void>;
    pipe(stream: any): void;
    on(event: string, callback: (...args: any[]) => void): void;
  }

  function archiver(format: string, options?: ArchiverOptions): Archiver;

  export = archiver;
}
