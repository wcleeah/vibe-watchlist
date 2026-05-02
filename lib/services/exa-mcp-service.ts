import { MultiServerMCPClient } from '@langchain/mcp-adapters'

const DEFAULT_EXA_MCP_URL = 'https://mcp.exa.ai/mcp'
const EXA_SERVER_NAME = 'exa'

function getExaMcpUrl(): string {
    return process.env.EXA_MCP_URL || DEFAULT_EXA_MCP_URL
}

function createExaHeaders(): Record<string, string> | undefined {
    if (!process.env.EXA_API_KEY) {
        return undefined
    }

    return {
        Authorization: `Bearer ${process.env.EXA_API_KEY}`,
    }
}

function hasEmbeddedExaApiKey(url: string): boolean {
    return new URL(url).searchParams.has('exaApiKey')
}

async function loadExaTools() {
    const url = getExaMcpUrl()
    const headers = createExaHeaders()

    if (!headers && !hasEmbeddedExaApiKey(url)) {
        throw new Error(
            'EXA_API_KEY environment variable is required for Exa MCP tools',
        )
    }

    const client = new MultiServerMCPClient({
        mcpServers: {
            [EXA_SERVER_NAME]: {
                transport: 'http',
                url,
                ...(headers ? { headers } : {}),
            },
        },
        onConnectionError: 'ignore',
        prefixToolNameWithServerName: false,
        additionalToolNamePrefix: '',
    })

    return client.getTools(EXA_SERVER_NAME)
}

let exaToolsPromise: ReturnType<typeof loadExaTools> | null = null

export function getExaTools() {
    if (!exaToolsPromise) {
        exaToolsPromise = loadExaTools().catch((error: unknown) => {
            exaToolsPromise = null
            throw error
        })
    }

    return exaToolsPromise
}
