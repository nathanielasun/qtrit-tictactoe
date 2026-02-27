import type {
  GameState,
  GameOutcome,
  ClassicalMove,
  SplitMove,
  BoardSize,
  GameMode,
  Player,
  AIConfig,
  AIStats,
} from './types';

const headers = { 'Content-Type': 'application/json' };

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, { headers, ...options });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API error ${res.status}: ${body}`);
  }
  return res.json() as Promise<T>;
}

export async function createGame(
  size: BoardSize,
  gameMode: GameMode,
  aiPlayer?: Player
): Promise<GameState> {
  return request<GameState>('/api/game/new', {
    method: 'POST',
    body: JSON.stringify({ size, gameMode, aiPlayer }),
  });
}

type MoveWithoutPlayer =
  | Omit<ClassicalMove, 'player'>
  | Omit<SplitMove, 'player'>;

export async function makeMove(
  gameId: string,
  move: MoveWithoutPlayer
): Promise<GameState> {
  return request<GameState>(`/api/game/${gameId}/move`, {
    method: 'POST',
    body: JSON.stringify({ move }),
  });
}

export async function collapseGame(gameId: string): Promise<GameState> {
  return request<GameState>(`/api/game/${gameId}/collapse`, {
    method: 'POST',
  });
}

export async function getGame(gameId: string): Promise<GameState> {
  return request<GameState>(`/api/game/${gameId}`);
}

export async function getOutcomes(gameId: string): Promise<GameOutcome[]> {
  const data = await request<{ outcomes: GameOutcome[] }>(`/api/game/${gameId}/outcomes`);
  return data.outcomes;
}

export async function getAIConfig(): Promise<AIConfig> {
  return request<AIConfig>('/api/ai/config');
}

export async function updateAIConfig(
  config: Partial<AIConfig>
): Promise<AIConfig> {
  return request<AIConfig>('/api/ai/config', {
    method: 'POST',
    body: JSON.stringify(config),
  });
}

export async function runTraining(
  numGames: number,
  size?: BoardSize
): Promise<{ message: string; stats: AIStats }> {
  return request<{ message: string; stats: AIStats }>('/api/ai/train', {
    method: 'POST',
    body: JSON.stringify({ numGames, size }),
  });
}

export async function getAIStats(): Promise<AIStats> {
  return request<AIStats>('/api/ai/stats');
}

export async function resetAI(): Promise<{ message: string }> {
  return request<{ message: string }>('/api/ai/reset', {
    method: 'POST',
  });
}
