'use client'

import { Check, ChevronsUpDown, Loader2, RotateCcw, Save } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import type { OpenRouterModel } from '@/app/api/openrouter/models/route'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command'
import { Label } from '@/components/ui/label'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import type { AIModelConfig, AIPromptConfig } from '@/lib/services/ai-config'
import {
    CONFIG_KEY_AI_MODEL,
    CONFIG_KEY_AI_PROMPT_PLATFORM_DETECTION,
    CONFIG_KEY_AI_PROMPT_TITLE_SUGGESTION,
    DEFAULT_MODEL_ID,
    DEFAULT_PLATFORM_DETECTION_SYSTEM_PROMPT,
    DEFAULT_PLATFORM_DETECTION_USER_PROMPT_TEMPLATE,
    DEFAULT_TITLE_SUGGESTION_SYSTEM_PROMPT,
    DEFAULT_TITLE_SUGGESTION_USER_PROMPT_TEMPLATE,
} from '@/lib/services/ai-config'
import { cn } from '@/lib/utils'

// ── Helpers ─────────────────────────────────────────────────────────────────

function formatContextLength(length: number | null): string {
    if (!length) return '?'
    if (length >= 1_000_000) return `${(length / 1_000_000).toFixed(0)}M`
    if (length >= 1_000) return `${(length / 1_000).toFixed(0)}K`
    return String(length)
}

function formatPricing(model: OpenRouterModel): string {
    const prompt = Number(model.pricing.prompt)
    const completion = Number(model.pricing.completion)
    if (prompt === 0 && completion === 0) return 'Free'
    // Pricing is per token, display per 1M tokens
    const promptPer1M = (prompt * 1_000_000).toFixed(2)
    const completionPer1M = (completion * 1_000_000).toFixed(2)
    return `$${promptPer1M} / $${completionPer1M} per 1M tokens`
}

function isModelFree(model: OpenRouterModel): boolean {
    return (
        Number(model.pricing.prompt) === 0 &&
        Number(model.pricing.completion) === 0
    )
}

// ── Component ───────────────────────────────────────────────────────────────

export function AISettings() {
    // Model state
    const [models, setModels] = useState<OpenRouterModel[]>([])
    const [modelsLoading, setModelsLoading] = useState(true)
    const [modelOpen, setModelOpen] = useState(false)
    const [selectedModelId, setSelectedModelId] = useState(DEFAULT_MODEL_ID)

    // Prompt state
    const [platformSystemPrompt, setPlatformSystemPrompt] = useState(
        DEFAULT_PLATFORM_DETECTION_SYSTEM_PROMPT,
    )
    const [platformUserPrompt, setPlatformUserPrompt] = useState(
        DEFAULT_PLATFORM_DETECTION_USER_PROMPT_TEMPLATE,
    )
    const [titleSystemPrompt, setTitleSystemPrompt] = useState(
        DEFAULT_TITLE_SUGGESTION_SYSTEM_PROMPT,
    )
    const [titleUserPrompt, setTitleUserPrompt] = useState(
        DEFAULT_TITLE_SUGGESTION_USER_PROMPT_TEMPLATE,
    )

    // UI state
    const [saving, setSaving] = useState(false)
    const [configLoading, setConfigLoading] = useState(true)

    // ── Load existing config from DB ────────────────────────────────────

    useEffect(() => {
        async function loadConfig() {
            try {
                const res = await fetch('/api/config')
                const json = await res.json()
                if (!json.success) return

                for (const config of json.data) {
                    switch (config.configKey) {
                        case CONFIG_KEY_AI_MODEL: {
                            const val = config.configValue as AIModelConfig
                            if (val?.modelId) setSelectedModelId(val.modelId)
                            break
                        }
                        case CONFIG_KEY_AI_PROMPT_PLATFORM_DETECTION: {
                            const val = config.configValue as AIPromptConfig
                            if (val?.systemPrompt)
                                setPlatformSystemPrompt(val.systemPrompt)
                            if (val?.userPromptTemplate)
                                setPlatformUserPrompt(val.userPromptTemplate)
                            break
                        }
                        case CONFIG_KEY_AI_PROMPT_TITLE_SUGGESTION: {
                            const val = config.configValue as AIPromptConfig
                            if (val?.systemPrompt)
                                setTitleSystemPrompt(val.systemPrompt)
                            if (val?.userPromptTemplate)
                                setTitleUserPrompt(val.userPromptTemplate)
                            break
                        }
                    }
                }
            } catch (error) {
                console.error('Failed to load AI config:', error)
            } finally {
                setConfigLoading(false)
            }
        }
        loadConfig()
    }, [])

    // ── Load models from OpenRouter ─────────────────────────────────────

    useEffect(() => {
        async function loadModels() {
            try {
                const res = await fetch('/api/openrouter/models')
                const json = await res.json()
                if (json.success) {
                    setModels(json.data)
                }
            } catch (error) {
                console.error('Failed to load models:', error)
                toast.error('Failed to load models from OpenRouter')
            } finally {
                setModelsLoading(false)
            }
        }
        loadModels()
    }, [])

    // ── Save config ─────────────────────────────────────────────────────

    const handleSave = useCallback(async () => {
        setSaving(true)
        try {
            const updates = [
                {
                    configKey: CONFIG_KEY_AI_MODEL,
                    configValue: { modelId: selectedModelId },
                },
                {
                    configKey: CONFIG_KEY_AI_PROMPT_PLATFORM_DETECTION,
                    configValue: {
                        systemPrompt: platformSystemPrompt,
                        userPromptTemplate: platformUserPrompt,
                    },
                },
                {
                    configKey: CONFIG_KEY_AI_PROMPT_TITLE_SUGGESTION,
                    configValue: {
                        systemPrompt: titleSystemPrompt,
                        userPromptTemplate: titleUserPrompt,
                    },
                },
            ]

            const res = await fetch('/api/config', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates),
            })

            const json = await res.json()
            if (json.success) {
                toast.success('AI settings saved successfully')
            } else {
                toast.error(json.error || 'Failed to save settings')
            }
        } catch (error) {
            console.error('Failed to save AI config:', error)
            toast.error('Failed to save AI settings')
        } finally {
            setSaving(false)
        }
    }, [
        selectedModelId,
        platformSystemPrompt,
        platformUserPrompt,
        titleSystemPrompt,
        titleUserPrompt,
    ])

    // ── Split models into free / paid ───────────────────────────────────

    const freeModels = models.filter(isModelFree)
    const paidModels = models.filter((m) => !isModelFree(m))

    // ── Loading state ───────────────────────────────────────────────────

    if (configLoading) {
        return (
            <div className='flex items-center justify-center py-12'>
                <Loader2 className='w-6 h-6 animate-spin text-gray-400' />
                <span className='ml-2 text-gray-500'>
                    Loading AI settings...
                </span>
            </div>
        )
    }

    return (
        <div className='space-y-8'>
            {/* ── Model Selection ─────────────────────────────────── */}
            <section className='space-y-4'>
                <div className='flex items-center justify-between'>
                    <div>
                        <h3 className='text-lg font-semibold'>AI Model</h3>
                        <p className='text-sm text-gray-500 dark:text-gray-400'>
                            Select the OpenRouter model used for AI operations.
                            Only models supporting tool calling are shown.
                        </p>
                    </div>
                    <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => setSelectedModelId(DEFAULT_MODEL_ID)}
                        title='Reset to default model'
                    >
                        <RotateCcw className='w-4 h-4 mr-1' />
                        Reset
                    </Button>
                </div>

                <Popover open={modelOpen} onOpenChange={setModelOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant='outline'
                            aria-expanded={modelOpen}
                            className='w-full justify-between font-mono text-sm h-auto py-2'
                        >
                            <span className='truncate'>{selectedModelId}</span>
                            <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent
                        className='w-[var(--radix-popover-trigger-width)] p-0'
                        align='start'
                    >
                        <Command>
                            <CommandInput placeholder='Search models...' />
                            <CommandList className='max-h-[400px]'>
                                {modelsLoading ? (
                                    <div className='flex items-center justify-center py-6'>
                                        <Loader2 className='w-4 h-4 animate-spin text-gray-400' />
                                        <span className='ml-2 text-sm text-gray-500'>
                                            Loading models...
                                        </span>
                                    </div>
                                ) : (
                                    <>
                                        <CommandEmpty>
                                            No models found.
                                        </CommandEmpty>

                                        {freeModels.length > 0 && (
                                            <CommandGroup heading='Free Models'>
                                                {freeModels.map((model) => (
                                                    <CommandItem
                                                        key={model.id}
                                                        value={`${model.id} ${model.name}`}
                                                        onSelect={() => {
                                                            setSelectedModelId(
                                                                model.id,
                                                            )
                                                            setModelOpen(false)
                                                        }}
                                                        className='flex flex-col items-start gap-0.5 py-2'
                                                    >
                                                        <div className='flex items-center w-full'>
                                                            <Check
                                                                className={cn(
                                                                    'mr-2 h-4 w-4 shrink-0',
                                                                    selectedModelId ===
                                                                        model.id
                                                                        ? 'opacity-100'
                                                                        : 'opacity-0',
                                                                )}
                                                            />
                                                            <span className='font-mono text-sm truncate'>
                                                                {model.id}
                                                            </span>
                                                        </div>
                                                        <div className='ml-6 flex items-center gap-2 text-xs text-gray-500'>
                                                            <span>
                                                                Context:{' '}
                                                                {formatContextLength(
                                                                    model.contextLength,
                                                                )}
                                                            </span>
                                                            <Badge
                                                                variant='secondary'
                                                                className='text-xs px-1.5 py-0'
                                                            >
                                                                Free
                                                            </Badge>
                                                        </div>
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        )}

                                        {paidModels.length > 0 && (
                                            <CommandGroup heading='Paid Models'>
                                                {paidModels.map((model) => (
                                                    <CommandItem
                                                        key={model.id}
                                                        value={`${model.id} ${model.name}`}
                                                        onSelect={() => {
                                                            setSelectedModelId(
                                                                model.id,
                                                            )
                                                            setModelOpen(false)
                                                        }}
                                                        className='flex flex-col items-start gap-0.5 py-2'
                                                    >
                                                        <div className='flex items-center w-full'>
                                                            <Check
                                                                className={cn(
                                                                    'mr-2 h-4 w-4 shrink-0',
                                                                    selectedModelId ===
                                                                        model.id
                                                                        ? 'opacity-100'
                                                                        : 'opacity-0',
                                                                )}
                                                            />
                                                            <span className='font-mono text-sm truncate'>
                                                                {model.id}
                                                            </span>
                                                        </div>
                                                        <div className='ml-6 text-xs text-gray-500'>
                                                            <span>
                                                                Context:{' '}
                                                                {formatContextLength(
                                                                    model.contextLength,
                                                                )}
                                                            </span>
                                                            <span className='mx-1'>
                                                                &middot;
                                                            </span>
                                                            <span>
                                                                {formatPricing(
                                                                    model,
                                                                )}
                                                            </span>
                                                        </div>
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        )}
                                    </>
                                )}
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            </section>

            {/* ── Platform Detection Prompts ──────────────────────── */}
            <section className='space-y-4'>
                <div className='flex items-center justify-between'>
                    <div>
                        <h3 className='text-lg font-semibold'>
                            Platform Detection Prompts
                        </h3>
                        <p className='text-sm text-gray-500 dark:text-gray-400'>
                            Prompts used when detecting the platform from a
                            video URL.
                        </p>
                    </div>
                    <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => {
                            setPlatformSystemPrompt(
                                DEFAULT_PLATFORM_DETECTION_SYSTEM_PROMPT,
                            )
                            setPlatformUserPrompt(
                                DEFAULT_PLATFORM_DETECTION_USER_PROMPT_TEMPLATE,
                            )
                        }}
                        title='Reset platform detection prompts to defaults'
                    >
                        <RotateCcw className='w-4 h-4 mr-1' />
                        Reset
                    </Button>
                </div>

                <div className='space-y-3'>
                    <div className='space-y-1.5'>
                        <Label htmlFor='platform-system-prompt'>
                            System Prompt
                        </Label>
                        <textarea
                            id='platform-system-prompt'
                            value={platformSystemPrompt}
                            onChange={(e) =>
                                setPlatformSystemPrompt(e.target.value)
                            }
                            rows={4}
                            className='flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono'
                        />
                    </div>
                    <div className='space-y-1.5'>
                        <Label htmlFor='platform-user-prompt'>
                            User Prompt Template
                        </Label>
                        <textarea
                            id='platform-user-prompt'
                            value={platformUserPrompt}
                            onChange={(e) =>
                                setPlatformUserPrompt(e.target.value)
                            }
                            rows={3}
                            className='flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono'
                        />
                        <p className='text-xs text-gray-500 dark:text-gray-400'>
                            Available variable:{' '}
                            <code className='px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-800'>
                                {'{url}'}
                            </code>{' '}
                            — replaced with the video URL at runtime.
                        </p>
                    </div>
                </div>
            </section>

            {/* ── Title Suggestion Prompts ────────────────────────── */}
            <section className='space-y-4'>
                <div className='flex items-center justify-between'>
                    <div>
                        <h3 className='text-lg font-semibold'>
                            Title Suggestion Prompts
                        </h3>
                        <p className='text-sm text-gray-500 dark:text-gray-400'>
                            Prompts used when extracting video titles from
                            metadata and agent-provided search context.
                        </p>
                    </div>
                    <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => {
                            setTitleSystemPrompt(
                                DEFAULT_TITLE_SUGGESTION_SYSTEM_PROMPT,
                            )
                            setTitleUserPrompt(
                                DEFAULT_TITLE_SUGGESTION_USER_PROMPT_TEMPLATE,
                            )
                        }}
                        title='Reset title suggestion prompts to defaults'
                    >
                        <RotateCcw className='w-4 h-4 mr-1' />
                        Reset
                    </Button>
                </div>

                <div className='space-y-3'>
                    <div className='space-y-1.5'>
                        <Label htmlFor='title-system-prompt'>
                            System Prompt
                        </Label>
                        <textarea
                            id='title-system-prompt'
                            value={titleSystemPrompt}
                            onChange={(e) =>
                                setTitleSystemPrompt(e.target.value)
                            }
                            rows={6}
                            className='flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono'
                        />
                    </div>
                    <div className='space-y-1.5'>
                        <Label htmlFor='title-user-prompt'>
                            User Prompt Template
                        </Label>
                        <textarea
                            id='title-user-prompt'
                            value={titleUserPrompt}
                            onChange={(e) => setTitleUserPrompt(e.target.value)}
                            rows={10}
                            className='flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono'
                        />
                        <p className='text-xs text-gray-500 dark:text-gray-400'>
                            Available variable:{' '}
                            <code className='px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-800'>
                                {'{context}'}
                            </code>{' '}
                            — replaced with the JSON metadata context at
                            runtime.
                        </p>
                    </div>
                </div>
            </section>

            {/* ── Save Button ─────────────────────────────────────── */}
            <div className='flex justify-end pt-4 border-t border-gray-200 dark:border-gray-800'>
                <Button onClick={handleSave} disabled={saving}>
                    {saving ? (
                        <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                    ) : (
                        <Save className='w-4 h-4 mr-2' />
                    )}
                    Save Settings
                </Button>
            </div>
        </div>
    )
}
