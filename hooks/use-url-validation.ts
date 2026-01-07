"use client";

import { useState, useCallback } from "react";
import { ParsedUrl, parseVideoUrlClient } from "@/lib/utils/url-parser";

export interface UseUrlValidationReturn {
    setUrl: (url: string) => void;
    unsetUrl: () => void;
    urlValidationResult?: UrlValidationResult;
    validating: boolean;
}

export type UrlValidationResult = ParsedUrl & {
    validated: boolean;
};

export function useUrlValidation(): UseUrlValidationReturn {
    const [urlValidationResult, setUrlValidationResult] = useState<
        UrlValidationResult | undefined
    >(undefined);
    const [validating, setValidating] = useState(false);

    const setUrl = useCallback(async (newUrl: string) => {
        setValidating(true);
        if (!newUrl.trim()) {
            setUrlValidationResult(undefined);
            return;
        }

        const parsed = await parseVideoUrlClient(newUrl.trim());
        setUrlValidationResult({
            ...parsed,
            validated: true,
        });
        setValidating(false);
    }, []);

    const unsetUrl = useCallback(() => {
        setUrlValidationResult(undefined);
    }, []);

    return {
        setUrl,
        unsetUrl,
        urlValidationResult,
        validating
    };
}
