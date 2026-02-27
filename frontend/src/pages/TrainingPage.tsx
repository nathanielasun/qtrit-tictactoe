import { useState, useEffect, useCallback } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { AIConfig, AIStats, BoardSize, TrainingStats } from '../types';
import * as api from '../api';
import './TrainingPage.css';

export function TrainingPage() {
  const [config, setConfig] = useState<AIConfig>({
    learningRate: 0.1,
    explorationRate: 0.3,
    discountFactor: 0.9,
    batchSize: 100,
  });
  const [stats, setStats] = useState<AIStats>({
    gamesPlayed: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    trainingHistory: [],
  });
  const [trainingSize, setTrainingSize] = useState<BoardSize>(3);
  const [numGames, setNumGames] = useState(100);
  const [training, setTraining] = useState(false);
  const [configLoading, setConfigLoading] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const data = await api.getAIStats();
      setStats(data);
    } catch {
      // Stats may not be available
    }
  }, []);

  const fetchConfig = useCallback(async () => {
    try {
      const data = await api.getAIConfig();
      setConfig(data);
    } catch {
      // Config may not be available
    }
  }, []);

  useEffect(() => {
    fetchConfig();
    fetchStats();
  }, [fetchConfig, fetchStats]);

  // Auto-refresh stats every 10 seconds
  useEffect(() => {
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  const handleConfigChange = async (
    field: keyof AIConfig,
    value: number
  ) => {
    const newConfig = { ...config, [field]: value };
    setConfig(newConfig);
    setConfigLoading(true);
    try {
      const updated = await api.updateAIConfig({ [field]: value });
      setConfig(updated);
    } catch {
      // Revert on failure
      setConfig(config);
    } finally {
      setConfigLoading(false);
    }
  };

  const handleTrain = async () => {
    setTraining(true);
    setStatusMessage('Training in progress...');
    try {
      const result = await api.runTraining(numGames, trainingSize);
      setStats(result.stats);
      setStatusMessage(result.message);
    } catch (err) {
      setStatusMessage(
        err instanceof Error ? err.message : 'Training failed'
      );
    } finally {
      setTraining(false);
    }
  };

  const handleReset = async () => {
    try {
      const result = await api.resetAI();
      setStatusMessage(result.message);
      setShowResetConfirm(false);
      fetchStats();
    } catch (err) {
      setStatusMessage(
        err instanceof Error ? err.message : 'Reset failed'
      );
    }
  };

  const winRate =
    stats.gamesPlayed > 0
      ? ((stats.wins / stats.gamesPlayed) * 100).toFixed(1)
      : '0.0';
  const lossRate =
    stats.gamesPlayed > 0
      ? ((stats.losses / stats.gamesPlayed) * 100).toFixed(1)
      : '0.0';
  const drawRate =
    stats.gamesPlayed > 0
      ? ((stats.draws / stats.gamesPlayed) * 100).toFixed(1)
      : '0.0';

  const sizes: BoardSize[] = [2, 3, 4];

  return (
    <div className="training-page">
      <h1 className="tp-page-title">AI Training Dashboard</h1>

      {statusMessage && (
        <div className="tp-status fade-in">
          <span>{statusMessage}</span>
          <button
            className="tp-status-close"
            onClick={() => setStatusMessage(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="tp-layout">
        {/* Left panel: Configuration */}
        <div className="tp-col tp-col--config">
          <div className="card">
            <h2 className="tp-section-title">AI Configuration</h2>

            <div className="tp-slider-group">
              <label className="tp-slider-label">
                Learning Rate
                <span className="tp-slider-value">
                  {config.learningRate.toFixed(3)}
                </span>
              </label>
              <input
                type="range"
                min={0.001}
                max={1}
                step={0.001}
                value={config.learningRate}
                onChange={(e) =>
                  handleConfigChange('learningRate', parseFloat(e.target.value))
                }
                disabled={configLoading}
              />
            </div>

            <div className="tp-slider-group">
              <label className="tp-slider-label">
                Exploration Rate
                <span className="tp-slider-value">
                  {config.explorationRate.toFixed(3)}
                </span>
              </label>
              <input
                type="range"
                min={0}
                max={1}
                step={0.001}
                value={config.explorationRate}
                onChange={(e) =>
                  handleConfigChange(
                    'explorationRate',
                    parseFloat(e.target.value)
                  )
                }
                disabled={configLoading}
              />
            </div>

            <div className="tp-slider-group">
              <label className="tp-slider-label">
                Discount Factor
                <span className="tp-slider-value">
                  {config.discountFactor.toFixed(3)}
                </span>
              </label>
              <input
                type="range"
                min={0}
                max={1}
                step={0.001}
                value={config.discountFactor}
                onChange={(e) =>
                  handleConfigChange(
                    'discountFactor',
                    parseFloat(e.target.value)
                  )
                }
                disabled={configLoading}
              />
            </div>

            <div className="tp-slider-group">
              <label className="tp-slider-label">
                Batch Size
                <span className="tp-slider-value">{config.batchSize}</span>
              </label>
              <input
                type="range"
                min={10}
                max={1000}
                step={10}
                value={config.batchSize}
                onChange={(e) =>
                  handleConfigChange('batchSize', parseInt(e.target.value, 10))
                }
                disabled={configLoading}
              />
            </div>
          </div>

          <div className="card">
            <h2 className="tp-section-title">Run Training</h2>

            <div className="tp-train-row">
              <label className="tp-slider-label">Board Size</label>
              <div className="tp-chips">
                {sizes.map((s) => (
                  <button
                    key={s}
                    className={`tp-chip ${trainingSize === s ? 'tp-chip--active' : ''}`}
                    onClick={() => setTrainingSize(s)}
                  >
                    {s}x{s}
                  </button>
                ))}
              </div>
            </div>

            <div className="tp-train-row">
              <label className="tp-slider-label">Number of Games</label>
              <input
                type="number"
                className="tp-num-input"
                min={1}
                max={10000}
                value={numGames}
                onChange={(e) =>
                  setNumGames(
                    Math.max(1, Math.min(10000, parseInt(e.target.value, 10) || 1))
                  )
                }
              />
            </div>

            <button
              className="btn btn-primary tp-train-btn"
              onClick={handleTrain}
              disabled={training}
            >
              {training ? 'Training...' : `Train ${numGames} Games`}
            </button>

            <div className="tp-reset-section">
              {!showResetConfirm ? (
                <button
                  className="btn btn-danger tp-reset-btn"
                  onClick={() => setShowResetConfirm(true)}
                >
                  Reset AI
                </button>
              ) : (
                <div className="tp-reset-confirm fade-in">
                  <span className="tp-reset-warn">
                    This will erase all training data. Are you sure?
                  </span>
                  <div className="tp-reset-actions">
                    <button
                      className="btn btn-danger"
                      onClick={handleReset}
                    >
                      Confirm Reset
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={() => setShowResetConfirm(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Center panel: Statistics + Charts */}
        <div className="tp-col tp-col--stats">
          <div className="card">
            <h2 className="tp-section-title">Training Statistics</h2>
            <div className="tp-stat-cards">
              <div className="tp-stat-card">
                <span className="tp-stat-label">Total Games</span>
                <span className="tp-stat-value">{stats.gamesPlayed}</span>
              </div>
              <div className="tp-stat-card tp-stat-card--x">
                <span className="tp-stat-label">Wins</span>
                <span className="tp-stat-value">{stats.wins}</span>
                <span className="tp-stat-pct">{winRate}%</span>
              </div>
              <div className="tp-stat-card tp-stat-card--o">
                <span className="tp-stat-label">Losses</span>
                <span className="tp-stat-value">{stats.losses}</span>
                <span className="tp-stat-pct">{lossRate}%</span>
              </div>
              <div className="tp-stat-card tp-stat-card--draw">
                <span className="tp-stat-label">Draws</span>
                <span className="tp-stat-value">{stats.draws}</span>
                <span className="tp-stat-pct">{drawRate}%</span>
              </div>
            </div>
          </div>

          {stats.trainingHistory.length > 0 && (
            <>
              <div className="card">
                <h3 className="tp-chart-title">Win Rate Over Epochs</h3>
                <div className="tp-chart-container">
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={stats.trainingHistory}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(108, 92, 231, 0.1)"
                      />
                      <XAxis
                        dataKey="epoch"
                        stroke="#8888aa"
                        fontSize={11}
                        tickLine={false}
                      />
                      <YAxis
                        stroke="#8888aa"
                        fontSize={11}
                        tickLine={false}
                        domain={[0, 1]}
                        tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`}
                      />
                      <Tooltip
                        contentStyle={{
                          background: '#1a1a2e',
                          border: '1px solid rgba(108, 92, 231, 0.3)',
                          borderRadius: 8,
                          color: '#e0e0ff',
                          fontSize: 12,
                        }}
                        formatter={(value: number) => [
                          `${(value * 100).toFixed(1)}%`,
                          'Win Rate',
                        ]}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: 11, color: '#8888aa' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="winRate"
                        name="Win Rate"
                        stroke="#4a9eff"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="card">
                <h3 className="tp-chart-title">Average Reward Over Epochs</h3>
                <div className="tp-chart-container">
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={stats.trainingHistory}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(108, 92, 231, 0.1)"
                      />
                      <XAxis
                        dataKey="epoch"
                        stroke="#8888aa"
                        fontSize={11}
                        tickLine={false}
                      />
                      <YAxis
                        stroke="#8888aa"
                        fontSize={11}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          background: '#1a1a2e',
                          border: '1px solid rgba(108, 92, 231, 0.3)',
                          borderRadius: 8,
                          color: '#e0e0ff',
                          fontSize: 12,
                        }}
                        formatter={(value: number) => [
                          value.toFixed(3),
                          'Avg Reward',
                        ]}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: 11, color: '#8888aa' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="avgReward"
                        name="Avg Reward"
                        stroke="#6c5ce7"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="card">
                <h3 className="tp-chart-title">
                  Exploration Rate Over Epochs
                </h3>
                <div className="tp-chart-container">
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={stats.trainingHistory}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(108, 92, 231, 0.1)"
                      />
                      <XAxis
                        dataKey="epoch"
                        stroke="#8888aa"
                        fontSize={11}
                        tickLine={false}
                      />
                      <YAxis
                        stroke="#8888aa"
                        fontSize={11}
                        tickLine={false}
                        domain={[0, 1]}
                        tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`}
                      />
                      <Tooltip
                        contentStyle={{
                          background: '#1a1a2e',
                          border: '1px solid rgba(108, 92, 231, 0.3)',
                          borderRadius: 8,
                          color: '#e0e0ff',
                          fontSize: 12,
                        }}
                        formatter={(value: number) => [
                          `${(value * 100).toFixed(1)}%`,
                          'Exploration Rate',
                        ]}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: 11, color: '#8888aa' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="explorationRate"
                        name="Exploration Rate"
                        stroke="#ff4a6a"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Right panel: Training Log */}
        <div className="tp-col tp-col--log">
          <div className="card">
            <h2 className="tp-section-title">Training Log</h2>
            {stats.trainingHistory.length === 0 ? (
              <p className="tp-log-empty">
                No training data yet. Run some training sessions to see
                results here.
              </p>
            ) : (
              <div className="tp-log-list">
                {[...stats.trainingHistory]
                  .reverse()
                  .map((entry: TrainingStats) => (
                    <div key={entry.epoch} className="tp-log-item">
                      <div className="tp-log-item-header">
                        <span className="tp-log-epoch">
                          Epoch {entry.epoch}
                        </span>
                        <span className="tp-log-games">
                          {entry.gamesThisEpoch} games
                        </span>
                      </div>
                      <div className="tp-log-item-stats">
                        <span className="tp-log-stat">
                          Win: {(entry.winRate * 100).toFixed(1)}%
                        </span>
                        <span className="tp-log-stat">
                          Reward: {entry.avgReward.toFixed(3)}
                        </span>
                        <span className="tp-log-stat">
                          Explore: {(entry.explorationRate * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
