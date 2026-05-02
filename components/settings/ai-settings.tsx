'use client'

import { Loader2, RotateCcw, Save } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
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

// ── Component ───────────────────────────────────────────────────────────────

export function AISettings() {
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
                            Enter the OpenRouter model ID used for AI
                            operations.
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

                <div className='space-y-1.5'>
                    <Label htmlFor='ai-model-id'>Model ID</Label>
                    <input
                        id='ai-model-id'
                        type='text'
                        value={selectedModelId}
                        onChange={(e) => setSelectedModelId(e.target.value)}
                        placeholder='openai/gpt-4o-mini'
                        className='flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
                    />
                    <p className='text-xs text-gray-500 dark:text-gray-400'>
                        Example: <code>anthropic/claude-sonnet-4.5</code>
                    </p>
                </div>
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
