"use client";

import { useState, useCallback } from "react";
import { ParsedUrl, parseVideoUrlClient } from "@/lib/utils/url-parser";

export interface UseUrlValidationReturn {
    setUrl: (url: string) => void;
    unsetUrl: () => void;
    urlValidationResult?: UrlValidationResult;
}

export type UrlValidationResult = ParsedUrl & {
    validated: boolean;
};

export function useUrlValidation(): UseUrlValidationReturn {
    const [urlValidationResult, setUrlValidationResult] = useState<
        UrlValidationResult | undefined
    >(undefined);

    const setUrl = useCallback(async (newUrl: string) => {
        if (!newUrl.trim()) {
            setUrlValidationResult(undefined);
            return;
        }

        const parsed = await parseVideoUrlClient(newUrl.trim());
        setUrlValidationResult({
            ...parsed,
            validated: true,
        });
    }, []);

    const unsetUrl = useCallback(() => {
        setUrlValidationResult(undefined);
    }, []);

    return {
        setUrl,
        unsetUrl,
        urlValidationResult,
    };
}
