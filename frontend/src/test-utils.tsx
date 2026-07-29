import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'

// Mock the providers
jest.mock('@/lib/websocket', () => ({
    WebSocketProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    useWebSocket: () => ({
        socket: null,
        sendMessage: jest.fn(),
        lastMessage: null,
        isConnected: true,
    }),
}))

jest.mock('@/lib/spotify-sdk', () => ({
    SpotifyProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    useSpotify: () => ({
        player: null,
        deviceId: 'test-device-id',
        token: 'test-token',
    }),
}))

jest.mock('@/lib/radio-station', () => ({
    RadioProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    useRadio: () => ({
        currentStation: null,
        isBroadcasting: false,
        isListening: false,
        startBroadcasting: jest.fn(),
        stopBroadcasting: jest.fn(),
        joinStation: jest.fn(),
        leaveStation: jest.fn(),
    }),
}))

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
    return (
        <>
            {children}
        </>
    )
}

const customRender = (
    ui: ReactElement,
    options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }
