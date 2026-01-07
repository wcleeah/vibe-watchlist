export interface ComponentSize {
    width?: number
    height?: number
    minWidth?: number
    minHeight?: number
    maxWidth?: number
    maxHeight?: number
}

export interface ComponentSpacing {
    margin?: string | number
    padding?: string | number
    gap?: string | number
}

export interface AnimationConfig {
    duration?: number
    delay?: number
    easing?: string
    direction?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse'
}

export interface ThemeColors {
    primary: string
    secondary: string
    accent: string
    background: string
    foreground: string
    muted: string
    border: string
}
