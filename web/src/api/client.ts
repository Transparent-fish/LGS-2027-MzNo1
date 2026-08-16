export interface TokenView {
    id: string;
    name: string;
    uid: number;
    paintKeyReady: boolean;
    createdAt: string;
    lastUsedAt?: string;
}

export interface TokenFormState {
    name: string;
    uid: number;
    accessKey: string;
}

export interface PaintProgress {
    status: 'idle' | 'running' | 'paused' | 'stopping';
    total: number;
    painted: number;
    failed: number;
    ackCounts: Record<number, number>;
    queueLength: number;
    lastError?: string;
}

export interface StatusResponse {
    painter: PaintProgress;
    connected: boolean;
    tokens: number;
}

export interface TokenOption {
    label: string;
    value: string;
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(path, {
        headers: { 'content-type': 'application/json' },
        ...init,
    });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    return (await response.json()) as T;
}

export interface TokenListResponse {
    tokens: TokenView[];
}

export interface TokenMutationResponse {
    ok: boolean;
    id?: string;
    paintKeyReady?: boolean;
    errorType?: string;
    error?: string;
}

export interface SimpleOkResponse {
    ok: boolean;
    error?: string;
}

export interface PaintActionResponse {
    ok: boolean;
    message?: string;
}

export const api = {
    listTokens: () => req<TokenListResponse>('/api/tokens'),

    addToken: (body: TokenFormState) =>
        req<TokenMutationResponse>('/api/tokens', {
            method: 'POST',
            body: JSON.stringify(body),
        }),

    updateToken: (id: string, body: Partial<TokenFormState>) =>
        req<SimpleOkResponse>(`/api/tokens/${id}`, {
            method: 'PUT',
            body: JSON.stringify(body),
        }),

    deleteToken: (id: string) => req<SimpleOkResponse>(`/api/tokens/${id}`, { method: 'DELETE' }),

    refreshToken: (id: string) =>
        req<TokenMutationResponse>(`/api/tokens/${id}/refresh`, {
            method: 'POST',
        }),

    startPaint: (body: { tokenId: string; imagePath?: string; mode?: 'paint' | 'guard' }) =>
        req<PaintActionResponse>('/api/paint/start', {
            method: 'POST',
            body: JSON.stringify(body),
        }),

    stopPaint: () => req<{ ok: boolean }>('/api/paint/stop', { method: 'POST' }),

    pausePaint: () => req<{ ok: boolean }>('/api/paint/pause', { method: 'POST' }),

    resumePaint: () => req<{ ok: boolean }>('/api/paint/resume', { method: 'POST' }),

    status: () => req<StatusResponse>('/api/status'),
};
