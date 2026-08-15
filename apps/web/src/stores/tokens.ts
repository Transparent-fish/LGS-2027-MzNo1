import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { api, type TokenFormState, type TokenOption, type TokenView } from '../api/client';

export const useTokensStore = defineStore('tokens', () => {
    const tokens = ref<TokenView[]>([]);
    const loading = ref(false);

    const tokenOptions = computed<TokenOption[]>(() =>
        tokens.value.map((token) => ({
            label: `${token.name} (uid ${token.uid})`,
            value: token.id,
        })),
    );

    async function refresh(): Promise<void> {
        loading.value = true;
        try {
            const response = await api.listTokens();
            tokens.value = response.tokens;
        } finally {
            loading.value = false;
        }
    }

    async function add(input: TokenFormState) {
        const response = await api.addToken(input);
        if (response.ok) await refresh();
        return response;
    }

    async function update(id: string, input: Partial<TokenFormState>) {
        const response = await api.updateToken(id, input);
        if (response.ok) await refresh();
        return response;
    }

    async function remove(id: string) {
        const response = await api.deleteToken(id);
        if (response.ok) await refresh();
        return response;
    }

    async function refreshPaintKey(id: string) {
        const response = await api.refreshToken(id);
        if (response.ok) await refresh();
        return response;
    }

    return {
        tokens,
        loading,
        tokenOptions,
        refresh,
        add,
        update,
        remove,
        refreshPaintKey,
    };
});
