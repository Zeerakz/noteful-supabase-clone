
export type ChannelState = 
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'error'
  | 'closed';

export type ChannelEvent =
  | { type: 'CONNECT' }
  | { type: 'CONNECTION_SUCCESS' }
  | { type: 'CONNECTION_FAILED'; error: string }
  | { type: 'DISCONNECT' }
  | { type: 'RECONNECT' }
  | { type: 'CLOSE' }
  | { type: 'ERROR'; error: string };

export interface ChannelContext {
  reconnectAttempts: number;
  maxReconnectAttempts: number;
  baseDelay: number;
  maxDelay: number;
  lastError?: string;
  autoReconnect: boolean;
}

export interface ChannelStateValue {
  state: ChannelState;
  context: ChannelContext;
}

const initialContext: ChannelContext = {
  reconnectAttempts: 0,
  maxReconnectAttempts: 5,
  baseDelay: 1000, // Start with 1 second
  maxDelay: 30000, // Max 30 seconds
  autoReconnect: true,
};

export function createChannelStateMachine(config?: Partial<ChannelContext>): ChannelStateValue {
  return {
    state: 'idle',
    context: { ...initialContext, ...config },
  };
}

export function channelStateReducer(
  current: ChannelStateValue,
  event: ChannelEvent
): ChannelStateValue {
  const { state, context } = current;

  switch (state) {
    case 'idle':
      switch (event.type) {
        case 'CONNECT':
          return {
            state: 'connecting',
            context: { ...context, reconnectAttempts: 0, lastError: undefined },
          };
        default:
          return current;
      }

    case 'connecting':
      switch (event.type) {
        case 'CONNECTION_SUCCESS':
          return {
            state: 'connected',
            context: { ...context, reconnectAttempts: 0, lastError: undefined },
          };
        case 'CONNECTION_FAILED':
          if (context.autoReconnect && context.reconnectAttempts < context.maxReconnectAttempts) {
            return {
              state: 'reconnecting',
              context: {
                ...context,
                reconnectAttempts: context.reconnectAttempts + 1,
                lastError: event.error,
              },
            };
          }
          return {
            state: 'error',
            context: { ...context, lastError: event.error },
          };
        case 'CLOSE':
          return {
            state: 'closed',
            context,
          };
        default:
          return current;
      }

    case 'connected':
      switch (event.type) {
        case 'DISCONNECT':
          if (context.autoReconnect) {
            return {
              state: 'reconnecting',
              context: { ...context, reconnectAttempts: 0 },
            };
          }
          return {
            state: 'idle',
            context,
          };
        case 'CONNECTION_FAILED':
        case 'ERROR':
          if (context.autoReconnect && context.reconnectAttempts < context.maxReconnectAttempts) {
            return {
              state: 'reconnecting',
              context: {
                ...context,
                reconnectAttempts: context.reconnectAttempts + 1,
                lastError: 'error' in event ? event.error : event.error,
              },
            };
          }
          return {
            state: 'error',
            context: { ...context, lastError: 'error' in event ? event.error : event.error },
          };
        case 'CLOSE':
          return {
            state: 'closed',
            context,
          };
        default:
          return current;
      }

    case 'reconnecting':
      switch (event.type) {
        case 'CONNECTION_SUCCESS':
          return {
            state: 'connected',
            context: { ...context, reconnectAttempts: 0, lastError: undefined },
          };
        case 'CONNECTION_FAILED':
          if (context.reconnectAttempts < context.maxReconnectAttempts) {
            return {
              state: 'reconnecting',
              context: {
                ...context,
                reconnectAttempts: context.reconnectAttempts + 1,
                lastError: event.error,
              },
            };
          }
          return {
            state: 'error',
            context: { ...context, lastError: event.error },
          };
        case 'CLOSE':
          return {
            state: 'closed',
            context,
          };
        default:
          return current;
      }

    case 'error':
      switch (event.type) {
        case 'RECONNECT':
          return {
            state: 'connecting',
            context: { ...context, reconnectAttempts: 0, lastError: undefined },
          };
        case 'CLOSE':
          return {
            state: 'closed',
            context,
          };
        default:
          return current;
      }

    case 'closed':
      switch (event.type) {
        case 'CONNECT':
          return {
            state: 'connecting',
            context: { ...context, reconnectAttempts: 0, lastError: undefined },
          };
        default:
          return current;
      }

    default:
      return current;
  }
}

export function calculateReconnectDelay(context: ChannelContext): number {
  // Exponential backoff: baseDelay * 2^attempts + random jitter
  const exponentialDelay = context.baseDelay * Math.pow(2, context.reconnectAttempts);
  const jitter = Math.random() * 1000; // Add up to 1 second of jitter
  const delay = Math.min(exponentialDelay + jitter, context.maxDelay);
  
  return Math.floor(delay);
}

export function canReconnect(context: ChannelContext): boolean {
  return context.autoReconnect && context.reconnectAttempts < context.maxReconnectAttempts;
}

export function isConnectedState(state: ChannelState): boolean {
  return state === 'connected';
}

export function isConnectingState(state: ChannelState): boolean {
  return state === 'connecting' || state === 'reconnecting';
}

export function isErrorState(state: ChannelState): boolean {
  return state === 'error';
}

export function isClosedState(state: ChannelState): boolean {
  return state === 'closed';
}
