class AnalyticsService {
  constructor() {
    this.metrics = {
      totalRelays: 0,
      successfulRelays: 0,
      failedRelays: 0,
      gassSaved: '0',
      byNetwork: {},
      byGame: {},
      hourlyStats: []
    };
  }

  async trackRelay(data) {
    // Update totals
    this.metrics.totalRelays++;
    if (data.success) {
      this.metrics.successfulRelays++;
    } else {
      this.metrics.failedRelays++;
    }

    // Track by network
    if (!this.metrics.byNetwork[data.network]) {
      this.metrics.byNetwork[data.network] = {
        total: 0,
        success: 0,
        failed: 0,
        gasUsed: '0'
      };
    }
    this.metrics.byNetwork[data.network].total++;
    if (data.success) {
      this.metrics.byNetwork[data.network].success++;
      this.metrics.byNetwork[data.network].gasUsed = (
        BigInt(this.metrics.byNetwork[data.network].gasUsed) + 
        BigInt(data.gasUsed || '0')
      ).toString();
    } else {
      this.metrics.byNetwork[data.network].failed++;
    }

    // Track by game
    if (!this.metrics.byGame[data.gameId]) {
      this.metrics.byGame[data.gameId] = {
        total: 0,
        success: 0,
        failed: 0,
        uniqueUsers: new Set()
      };
    }
    this.metrics.byGame[data.gameId].total++;
    if (data.success) {
      this.metrics.byGame[data.gameId].success++;
    } else {
      this.metrics.byGame[data.gameId].failed++;
    }
    if (data.userId) {
      this.metrics.byGame[data.gameId].uniqueUsers.add(data.userId);
    }

    // Track hourly stats
    const hour = new Date().getHours();
    if (!this.metrics.hourlyStats[hour]) {
      this.metrics.hourlyStats[hour] = { relays: 0, failures: 0 };
    }
    this.metrics.hourlyStats[hour].relays++;
    if (!data.success) {
      this.metrics.hourlyStats[hour].failures++;
    }
  }

  getMetrics() {
    // Convert Sets to counts for serialization
    const gameMetrics = {};
    for (const [gameId, stats] of Object.entries(this.metrics.byGame)) {
      gameMetrics[gameId] = {
        ...stats,
        uniqueUsers: stats.uniqueUsers.size
      };
    }

    return {
      ...this.metrics,
      byGame: gameMetrics,
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    };
  }

  getGameMetrics(gameId) {
    const stats = this.metrics.byGame[gameId];
    if (!stats) return null;
    
    return {
      gameId,
      total: stats.total,
      success: stats.success,
      failed: stats.failed,
      uniqueUsers: stats.uniqueUsers.size,
      successRate: ((stats.success / stats.total) * 100).toFixed(2) + '%'
    };
  }
}

module.exports = new AnalyticsService();