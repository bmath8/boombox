// Global type declarations for process in Next.js environment
declare const process: {
    env: {
        [key: string]: string | undefined;
        NODE_ENV: string;
    };
    version: string;
    uptime: () => number;
};
