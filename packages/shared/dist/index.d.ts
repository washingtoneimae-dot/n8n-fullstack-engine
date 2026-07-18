export interface AppDefinition {
    routes: RouteDefinition[];
    auth?: AuthConfig;
    storage?: StorageConfig;
}
export interface RouteDefinition {
    path: string;
    page: string;
    auth?: boolean;
    layout?: 'default' | 'centered' | 'fullwidth';
}
export interface AuthConfig {
    provider: 'builtin' | 'oauth';
    sessionDuration: number;
}
export interface StorageConfig {
    type: 'sqlite' | 'postgres';
    connection?: string;
}
export interface PageOutput {
    html: string;
    title: string;
    data: Record<string, any>;
    scripts?: string[];
    styles?: string[];
}
export interface UserSession {
    userId: string;
    email: string;
    role: 'user' | 'admin';
    expiresAt: number;
}
//# sourceMappingURL=index.d.ts.map