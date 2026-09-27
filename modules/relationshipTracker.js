'use strict';

/**
 * XWise Blocker v3.0.0 — Relationship Tracker & Safety Action Queue
 * Computes follower/following diffs (Non-followers, Fans, Mutuals, Unfollowers, New followers)
 * and executes account actions with strict jittered rate-limiting to prevent Twitter bans.
 */

class XWiseRelationshipTrackerEngine {
  constructor() {
    this.latestSnapshot = null;
    this.previousSnapshot = null;
    this.unfollowerHistory = [];
    this.categories = {
      nonFollowers: [],
      fans: [],
      mutuals: [],
      unfollowers: [],
      newFollowers: [],
    };

    // Safety Queue State
    this.queueState = 'idle'; // 'idle' | 'running' | 'paused' | 'stopped'
    this.abortController = null;
  }

  /**
   * Initialize and load saved snapshots
   */
  async init() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        const res = await chrome.storage.local.get([
          'xwise.tracker.latest',
          'xwise.tracker.previous',
          'xwise.tracker.history',
        ]);
        this.latestSnapshot = res['xwise.tracker.latest'] || null;
        this.previousSnapshot = res['xwise.tracker.previous'] || null;
        this.unfollowerHistory = res['xwise.tracker.history'] || [];

        if (this.latestSnapshot) {
          this._computeCategories();
        }
      }
    } catch {
      // Storage unavailable
    }
    return this.categories;
  }

  /**
   * Run full relationship sync
   */
  async sync(onProgress) {
    if (typeof XWiseTwitterApi === 'undefined') {
      throw new Error('TWITTER_API_NOT_LOADED');
    }

    // 1. Get current logged in account
    if (typeof onProgress === 'function') {
      onProgress({ stage: 'account', message: 'در حال شناسایی اکانت لاگین‌شده...' });
    }
    const account = await XWiseTwitterApi.getCurrentUser();
    if (!account || !account.handle) {
      throw new Error('NOT_LOGGED_IN');
    }

    // 2. Fetch Following list
    if (typeof onProgress === 'function') {
      onProgress({ stage: 'following', message: 'در حال دریافت لیست دنبال‌شدگان (Following)...' });
    }
    const following = await XWiseTwitterApi.fetchFollowing(account.handle, (p) => {
      if (typeof onProgress === 'function') {
        onProgress({ stage: 'following', message: `دریافت دنبال‌شدگان: ${p.count} نفر`, count: p.count });
      }
    });

    // 3. Fetch Followers list
    if (typeof onProgress === 'function') {
      onProgress({ stage: 'followers', message: 'در حال دریافت لیست دنبال‌کنندگان (Followers)...' });
    }
    const followers = await XWiseTwitterApi.fetchFollowers(account.handle, (p) => {
      if (typeof onProgress === 'function') {
        onProgress({ stage: 'followers', message: `دریافت دنبال‌کنندگان: ${p.count} نفر`, count: p.count });
      }
    });

    // 4. Archive previous snapshot and save new
    this.previousSnapshot = this.latestSnapshot;
    this.latestSnapshot = {
      timestamp: Date.now(),
      account,
      followerCount: followers.length,
      followingCount: following.length,
      followers,
      following,
    };

    // 5. Compute diffs
    this._computeCategories();

    // 6. Persist to storage
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      await chrome.storage.local.set({
        'xwise.tracker.latest': this.latestSnapshot,
        'xwise.tracker.previous': this.previousSnapshot,
        'xwise.tracker.history': this.unfollowerHistory,
      });

      // Update badge if unfollowers detected
      if (typeof chrome.action !== 'undefined' && chrome.action.setBadgeText) {
        const unfollowCount = this.categories.unfollowers.length;
        if (unfollowCount > 0) {
          chrome.action.setBadgeText({ text: `-${unfollowCount}` });
          chrome.action.setBadgeBackgroundColor({ color: '#f4212e' });
        } else {
          chrome.action.setBadgeText({ text: '' });
        }
      }
    }

    if (typeof onProgress === 'function') {
      onProgress({ stage: 'complete', message: 'همگام‌سازی با موفقیت انجام شد.', categories: this.categories });
    }

    return this.categories;
  }

  /**
   * Calculate diffs between followers and following
   */
  _computeCategories() {
    if (!this.latestSnapshot) return;

    const currentFollowers = this.latestSnapshot.followers || [];
    const currentFollowing = this.latestSnapshot.following || [];

    const followerMap = new Map(currentFollowers.map((u) => [u.id || u.handle.toLowerCase(), u]));
    const followingMap = new Map(currentFollowing.map((u) => [u.id || u.handle.toLowerCase(), u]));

    // 1. Non-Followers: You follow them, they don't follow you
    const nonFollowers = [];
    for (const [id, user] of followingMap.entries()) {
      if (!followerMap.has(id)) {
        nonFollowers.push(user);
      }
    }

    // 2. Fans: They follow you, you don't follow them
    const fans = [];
    for (const [id, user] of followerMap.entries()) {
      if (!followingMap.has(id)) {
        fans.push(user);
      }
    }

    // 3. Mutuals: Both follow each other
    const mutuals = [];
    for (const [id, user] of followingMap.entries()) {
      if (followerMap.has(id)) {
        mutuals.push(user);
      }
    }

    // 4. Lost followers (Unfollowers since previous snapshot)
    const unfollowers = [];
    if (this.previousSnapshot && Array.isArray(this.previousSnapshot.followers)) {
      const prevFollowerMap = new Map(this.previousSnapshot.followers.map((u) => [u.id || u.handle.toLowerCase(), u]));
      for (const [id, prevUser] of prevFollowerMap.entries()) {
        if (!followerMap.has(id)) {
          unfollowers.push({
            ...prevUser,
            lostAt: Date.now(),
          });
        }
      }

      // Merge into historical log without duplicates
      const existingHistoryIds = new Set((this.unfollowerHistory || []).map((u) => u.id));
      for (const lostUser of unfollowers) {
        if (!existingHistoryIds.has(lostUser.id)) {
          this.unfollowerHistory.unshift(lostUser);
        }
      }
      if (this.unfollowerHistory.length > 500) {
        this.unfollowerHistory = this.unfollowerHistory.slice(0, 500);
      }
    }

    // 5. New followers since previous snapshot
    const newFollowers = [];
    if (this.previousSnapshot && Array.isArray(this.previousSnapshot.followers)) {
      const prevFollowerMap = new Map(this.previousSnapshot.followers.map((u) => [u.id || u.handle.toLowerCase(), u]));
      for (const [id, currUser] of followerMap.entries()) {
        if (!prevFollowerMap.has(id)) {
          newFollowers.push({
            ...currUser,
            gainedAt: Date.now(),
          });
        }
      }
    }

    const isInitialScan = !this.previousSnapshot || !Array.isArray(this.previousSnapshot.followers) || this.previousSnapshot.followers.length === 0;

    this.categories = {
      nonFollowers,
      fans,
      mutuals,
      unfollowers: unfollowers.length > 0 ? unfollowers : (this.unfollowerHistory || []),
      newFollowers,
      isInitialScan,
    };
  }

  /**
   * Execute safe rate-limited batch queue for actions (Unfollow or Remove Follower)
   */
  async executeBatchAction(targets, actionType, callbacks = {}) {
    if (!targets || targets.length === 0) return { successful: 0, failed: 0 };
    if (typeof XWiseTwitterApi === 'undefined') throw new Error('TWITTER_API_NOT_LOADED');

    this.queueState = 'running';
    this.abortController = new AbortController();

    const { onProgress, onSuccess, onError, onComplete } = callbacks;
    let successful = 0;
    let failed = 0;

    for (let i = 0; i < targets.length; i++) {
      if (this.queueState === 'stopped') break;

      while (this.queueState === 'paused') {
        await new Promise((r) => setTimeout(r, 500));
        if (this.queueState === 'stopped') break;
      }
      if (this.queueState === 'stopped') break;

      const user = targets[i];

      // Jittered delay (3500ms + random 1000-2500ms) = 4.5s to 6s
      const jitterMs = 3500 + Math.floor(Math.random() * 2000);

      if (typeof onProgress === 'function') {
        onProgress({
          current: i + 1,
          total: targets.length,
          user,
          delayMs: jitterMs,
          actionType,
        });
      }

      // Execute action
      try {
        if (actionType === 'unfollow') {
          await XWiseTwitterApi.unfollowUser(user.id, user.handle);
        } else if (actionType === 'remove_follower') {
          await XWiseTwitterApi.removeFollower(user.id, user.handle);
        }
        successful++;

        // Remove from local categories
        this._removeUserFromCategories(user.id, actionType);

        if (typeof onSuccess === 'function') {
          onSuccess({ user, index: i, actionType });
        }
      } catch (err) {
        failed++;
        if (typeof onError === 'function') {
          onError({ user, error: err.message, index: i });
        }
        // If rate limited, pause queue automatically
        if (String(err.message).includes('RATE_LIMITED')) {
          this.queueState = 'paused';
          break;
        }
      }

      // Wait safety interval if not last item
      if (i < targets.length - 1 && this.queueState === 'running') {
        await new Promise((r) => setTimeout(r, jitterMs));
      }
    }

    this.queueState = 'idle';

    if (typeof onComplete === 'function') {
      onComplete({ successful, failed, total: targets.length });
    }

    // Persist updated categories to storage
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      await chrome.storage.local.set({
        'xwise.tracker.latest': this.latestSnapshot,
      });
    }

    return { successful, failed };
  }

  _removeUserFromCategories(userId, actionType) {
    if (!this.latestSnapshot) return;

    if (actionType === 'unfollow') {
      this.latestSnapshot.following = (this.latestSnapshot.following || []).filter((u) => u.id !== userId);
    } else if (actionType === 'remove_follower') {
      this.latestSnapshot.followers = (this.latestSnapshot.followers || []).filter((u) => u.id !== userId);
    }
    this._computeCategories();
  }

  pauseQueue() {
    if (this.queueState === 'running') {
      this.queueState = 'paused';
    }
  }

  resumeQueue() {
    if (this.queueState === 'paused') {
      this.queueState = 'running';
    }
  }

  stopQueue() {
    this.queueState = 'stopped';
    if (this.abortController) {
      this.abortController.abort();
    }
  }
}

// Global Singleton Instance
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
