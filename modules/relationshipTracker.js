'use strict';

/**
 * XWise Blocker v3.2.1 - Relationship tracker and rate-limited action queue
 * Computes follower/following diffs and executes account actions with jittered delays.
 */

const XWISE_HISTORY_LIMIT = 500;
const XWISE_ACTION_DELAY_MIN_MS = 3500;
const XWISE_ACTION_DELAY_JITTER_MS = 2000;
const XWISE_BIO_MAX_LENGTH = 160;

const xwiseUserKey = (user) => (user && (user.id || String(user.handle || '').toLowerCase())) || '';

function xwiseEmptyCategories() {
  return {
    nonFollowers: [],
    fans: [],
    mutuals: [],
    unfollowers: [],
    newFollowers: [],
    newUnfollowerCount: 0,
    isInitialScan: true,
  };
}

function xwiseTrimUser(user) {
  return { ...user, bio: String(user.bio || '').slice(0, XWISE_BIO_MAX_LENGTH) };
}

class XWiseRelationshipTrackerEngine {
  constructor() {
    this.latestSnapshot = null;
    this.previousSnapshot = null;
    this.unfollowerHistory = [];
    this.categories = xwiseEmptyCategories();

    this.queueState = 'idle'; // 'idle' | 'running' | 'paused' | 'stopped'
    this.batchProgress = null;
    this.syncPromise = null;
  }

  _hasStorage() {
    return typeof chrome !== 'undefined' && !!chrome.storage && !!chrome.storage.local;
  }

  async init() {
    if (this._hasStorage()) {
      try {
        const res = await chrome.storage.local.get([
          'xwise.tracker.latest',
          'xwise.tracker.previous',
          'xwise.tracker.history',
        ]);
        this.latestSnapshot = res['xwise.tracker.latest'] || null;
        this.previousSnapshot = res['xwise.tracker.previous'] || null;
        this.unfollowerHistory = res['xwise.tracker.history'] || [];
      } catch {
        // Storage unavailable
      }
    }
    this._computeCategories();
    return this.categories;
  }

  async _persist() {
    if (!this.latestSnapshot || !this._hasStorage()) return;
    await chrome.storage.local.set({
      'xwise.tracker.latest': this.latestSnapshot,
      'xwise.tracker.previous': this.previousSnapshot,
      'xwise.tracker.history': this.unfollowerHistory,
    });
  }

  sync(onProgress) {
    if (!this.syncPromise) {
      this.syncPromise = this._runSync(onProgress).finally(() => {
        this.syncPromise = null;
      });
    }
    return this.syncPromise;
  }

  async _runSync(onProgress) {
    if (typeof XWiseTwitterApi === 'undefined') {
      throw new Error('TWITTER_API_NOT_LOADED');
    }
    const report = (payload) => {
      if (typeof onProgress === 'function') onProgress(payload);
    };

    report({ stage: 'account' });
    const account = await XWiseTwitterApi.getCurrentUser();
    if (!account || !account.handle) {
      throw new Error('NOT_LOGGED_IN');
    }

    report({ stage: 'following', count: 0 });
    const following = await XWiseTwitterApi.fetchFollowing(account.handle, (p) => {
      report({ stage: 'following', count: p.count });
    });

    report({ stage: 'followers', count: 0 });
    const followers = await XWiseTwitterApi.fetchFollowers(account.handle, (p) => {
      report({ stage: 'followers', count: p.count });
    });

    const handleOf = (acc) => String(acc?.handle || '').toLowerCase();
    const sameAccount = !!this.latestSnapshot && handleOf(this.latestSnapshot.account) === handleOf(account);

    if (followers.length === 0 && sameAccount && (this.latestSnapshot.followerCount || 0) > 0) {
      throw new Error('EMPTY_RESULT');
    }

    if (!sameAccount) {
      this.unfollowerHistory = [];
    }
    this.previousSnapshot = sameAccount ? this.latestSnapshot : null;
    this.latestSnapshot = {
      timestamp: Date.now(),
      account,
      followerCount: followers.length,
      followingCount: following.length,
      followers: followers.map(xwiseTrimUser),
      following: following.map(xwiseTrimUser),
    };

    this._computeCategories();
    await this._persist();

    report({ stage: 'complete' });
    return this.categories;
  }

  _computeCategories() {
    const snapshot = this.latestSnapshot;
    if (!snapshot) {
      this.categories = xwiseEmptyCategories();
      return;
    }

    const followerMap = new Map((snapshot.followers || []).map((u) => [xwiseUserKey(u), u]));
    const followingMap = new Map((snapshot.following || []).map((u) => [xwiseUserKey(u), u]));

    const nonFollowers = [];
    const mutuals = [];
    for (const [key, user] of followingMap) {
      (followerMap.has(key) ? mutuals : nonFollowers).push(user);
    }

    const fans = [];
    for (const [key, user] of followerMap) {
      if (!followingMap.has(key)) fans.push(user);
    }

    const previous = this.previousSnapshot;
    const hasBaseline = !!previous && Array.isArray(previous.followers) && previous.followers.length > 0;
    const capturedAt = snapshot.timestamp || Date.now();

    let freshlyLost = [];
    let newFollowers = [];

    if (hasBaseline) {
      const previousMap = new Map(previous.followers.map((u) => [xwiseUserKey(u), u]));

      for (const [key, user] of previousMap) {
        if (!followerMap.has(key)) freshlyLost.push({ ...user, lostAt: capturedAt });
      }
      for (const [key, user] of followerMap) {
        if (!previousMap.has(key)) newFollowers.push({ ...user, gainedAt: capturedAt });
      }

      const freshKeys = new Set(freshlyLost.map(xwiseUserKey));
      this.unfollowerHistory = [
        ...freshlyLost,
        ...this.unfollowerHistory.filter((u) => !freshKeys.has(xwiseUserKey(u))),
      ].slice(0, XWISE_HISTORY_LIMIT);
    }

    const unfollowers = this.unfollowerHistory.filter((u) => !followerMap.has(xwiseUserKey(u)));

    this.categories = {
      nonFollowers,
      fans,
      mutuals,
      unfollowers,
      newFollowers,
      newUnfollowerCount: freshlyLost.length,
      isInitialScan: !hasBaseline,
    };
  }

  async executeBatchAction(targets, actionType, callbacks = {}) {
    const result = { successful: 0, failed: 0, errors: [], rateLimited: false, total: 0 };
    if (!Array.isArray(targets) || targets.length === 0) return result;
    if (typeof XWiseTwitterApi === 'undefined') throw new Error('TWITTER_API_NOT_LOADED');
    if (!this.latestSnapshot) await this.init();

    const { onProgress, onSuccess, onError, onComplete } = callbacks;
    result.total = targets.length;
    this.queueState = 'running';

    for (let i = 0; i < targets.length; i++) {
      if (this.queueState === 'stopped') break;
      await this._waitWhilePaused();
      if (this.queueState === 'stopped') break;

      const user = targets[i];
      const delayMs = XWISE_ACTION_DELAY_MIN_MS + Math.floor(Math.random() * XWISE_ACTION_DELAY_JITTER_MS);

      this.batchProgress = { current: i + 1, total: targets.length, user, delayMs, actionType };
      if (typeof onProgress === 'function') onProgress(this.batchProgress);

      try {
        if (actionType === 'unfollow') {
          await XWiseTwitterApi.unfollowUser(user.id, user.handle);
        } else if (actionType === 'remove_follower') {
          await XWiseTwitterApi.removeFollower(user.id, user.handle);
        } else {
          throw new Error('UNKNOWN_ACTION');
        }

        result.successful++;
        this._removeUserFromCategories(user.id, actionType);
        if (typeof onSuccess === 'function') onSuccess({ user, index: i, actionType });
      } catch (err) {
        result.failed++;
        result.errors.push(err.message);
        if (typeof onError === 'function') onError({ user, error: err.message, index: i });

        if (String(err.message).startsWith('RATE_LIMITED')) {
          result.rateLimited = true;
          break;
        }
      }

      if (i < targets.length - 1) {
        await this._sleep(delayMs);
      }
    }

    this.queueState = 'idle';
    this.batchProgress = null;

    try {
      await this._persist();
    } catch {
      // The in-memory state stays consistent; the next sync rewrites the snapshot
    }

    if (typeof onComplete === 'function') onComplete(result);
    return result;
  }

  async _waitWhilePaused() {
    while (this.queueState === 'paused') {
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  async _sleep(ms) {
    const end = Date.now() + ms;
    while (Date.now() < end && this.queueState !== 'stopped') {
      await new Promise((r) => setTimeout(r, Math.min(250, end - Date.now())));
    }
  }

  _removeUserFromCategories(userId, actionType) {
    if (!this.latestSnapshot || !userId) return;

    if (actionType === 'unfollow') {
      this.latestSnapshot.following = (this.latestSnapshot.following || []).filter((u) => u.id !== userId);
    } else if (actionType === 'remove_follower') {
      this.latestSnapshot.followers = (this.latestSnapshot.followers || []).filter((u) => u.id !== userId);
      if (this.previousSnapshot && Array.isArray(this.previousSnapshot.followers)) {
        this.previousSnapshot.followers = this.previousSnapshot.followers.filter((u) => u.id !== userId);
      }
    }
    this._computeCategories();
  }

  getBatchStatus() {
    return { state: this.queueState, progress: this.batchProgress };
  }

  pauseQueue() {
    if (this.queueState === 'running') this.queueState = 'paused';
  }

  resumeQueue() {
    if (this.queueState === 'paused') this.queueState = 'running';
  }

  stopQueue() {
    if (this.queueState === 'running' || this.queueState === 'paused') {
      this.queueState = 'stopped';
    }
  }
}

const XWiseRelationshipTracker = new XWiseRelationshipTrackerEngine();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { XWiseRelationshipTracker, XWiseRelationshipTrackerEngine };
}
if (typeof globalThis !== 'undefined') {
  globalThis.XWiseRelationshipTracker = XWiseRelationshipTracker;
}
if (typeof window !== 'undefined') {
  window.XWiseRelationshipTracker = XWiseRelationshipTracker;
}
