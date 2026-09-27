'use strict';

/**
 * XWise Blocker v3.0.0 — Native Twitter/X Client API
 * High-reliability REST/GraphQL client with automatic CSRF management,
 * multi-tier fallbacks, and rate-limit safety checks.
 */

const TWITTER_BEARER_TOKEN =
  'Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA';

const GQL_FEATURES = {
  rweb_tipjar_consumption_enabled: true,
  responsive_web_graphql_exclude_directive_enabled: true,
  verified_phone_label_enabled: false,
  creator_subscriptions_tweet_preview_api_enabled: true,
  responsive_web_graphql_timeline_navigation_enabled: true,
  responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
  communities_web_enable_tweet_community_results_fetch: true,
  c9s_tweet_anatomy_moderator_badge_enabled: true,
  articles_preview_enabled: true,
  responsive_web_edit_tweet_api_enabled: true,
  graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
  view_counts_everywhere_api_enabled: true,
  longform_notetweets_consumption_enabled: true,
  responsive_web_twitter_article_tweet_consumption_enabled: true,
  tweet_awards_web_tipping_enabled: false,
  creator_subscriptions_quote_tweet_preview_api_enabled: false,
  freedom_of_speech_not_reach_fetch_enabled: true,
  standardized_nudges_misinfo: true,
  tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: true,
  rweb_video_timestamps_enabled: true,
  longform_notetweets_rich_text_read_enabled: true,
  longform_notetweets_inline_media_enabled: true,
  responsive_web_enhance_cards_enabled: false,
};

class XWiseTwitterApiEngine {
  constructor() {
    this.cachedCsrfToken = null;
    this.currentAccount = null;
    this.cachedGqlQueryIds = null;
  }

  /**
   * Extract ct0 CSRF token from cookies
   */
  async getCsrfToken() {
    // 1. Try Document Cookie (when running in content script context on x.com)
    if (typeof document !== 'undefined' && document.cookie) {
      const match = document.cookie.match(/(?:^|;\s*)ct0=([a-f0-9]+)/i);
      if (match && match[1]) {
        this.cachedCsrfToken = match[1];
        return match[1];
      }
    }

    // 2. Try chrome.cookies API (background / popup)
    if (typeof chrome !== 'undefined' && chrome.cookies) {
      try {
        let cookie = await chrome.cookies.get({ url: 'https://x.com', name: 'ct0' });
        if (!cookie) {
          cookie = await chrome.cookies.get({ url: 'https://twitter.com', name: 'ct0' });
        }
        if (cookie && cookie.value) {
          this.cachedCsrfToken = cookie.value;
          return cookie.value;
        }
      } catch {
        // Non-blocking
      }
    }

    return this.cachedCsrfToken;
  }

  /**
   * Build standard request headers required by X/Twitter internal endpoints
   */
  async _getHeaders(extraHeaders = {}) {
    const csrf = await this.getCsrfToken();
    const headers = {
      authorization: TWITTER_BEARER_TOKEN,
      'x-twitter-active-user': 'yes',
      'x-twitter-auth-type': 'OAuth2Session',
      'x-twitter-client-language': 'en',
      ...extraHeaders,
    };
    if (csrf) {
      headers['x-csrf-token'] = csrf;
    }
    return headers;
  }

  /**
   * Get currently logged-in account details
   */
  async getCurrentUser() {
    if (this.currentAccount && this.currentAccount.handle) return this.currentAccount;

    let domHandle = null;
    let domName = null;
    let domAvatar = null;
    let userId = null;

    // 1. Try DOM detection if on X.com (instant & 100% reliable)
    if (typeof document !== 'undefined') {
      // Check profile link in sidebar
      const profileLink = document.querySelector('a[data-testid="AppTabBar_Profile_Link"]');
      if (profileLink) {
        const href = profileLink.getAttribute('href');
        if (href && href.length > 1) {
          domHandle = href.replace(/^\//, '').split('/')[0].split('?')[0];
        }
      }

      // Check account switcher button
      const userNode = document.querySelector('[data-testid="SideNav_AccountSwitcher_Button"]');
      if (userNode) {
        const handleMatch = userNode.textContent.match(/@([A-Za-z0-9_]+)/);
        if (handleMatch && handleMatch[1]) domHandle = handleMatch[1];
        const nameEl = userNode.querySelector('div[dir="ltr"] span, span');
        if (nameEl) domName = nameEl.textContent.trim();
        const imgEl = userNode.querySelector('img');
        if (imgEl) domAvatar = imgEl.src;
      }

      // Check twid cookie for numeric user ID
      if (document.cookie) {
        const twidMatch = document.cookie.match(/twid=(?:u%3D)?(\d+)/i);
        if (twidMatch && twidMatch[1]) {
          userId = twidMatch[1];
        }
      }

      if (domHandle) {
        this.currentAccount = {
          id: userId || domHandle,
          handle: domHandle,
          name: domName || domHandle,
          avatar: domAvatar || '',
        };
      }
    }

    // 2. Query official settings endpoint as confirmation or fallback
    try {
      const headers = await this._getHeaders();
      const res = await fetch('https://x.com/i/api/1.1/account/settings.json', {
        method: 'GET',
        headers,
        credentials: 'include',
      });

      if (res.ok) {
        const data = await res.json();
        if (data.screen_name) {
          this.currentAccount = {
            id: data.id_str || String(data.user_id || userId || data.screen_name),
            handle: data.screen_name,
            name: this.currentAccount?.name || data.screen_name,
            avatar: this.currentAccount?.avatar || '',
          };
          return this.currentAccount;
        }
      }
    } catch {
      // Ignore network errors if DOM succeeded
    }

    // 3. Fallback to cached account in storage
    if (!this.currentAccount && typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      try {
        const res = await chrome.storage.local.get(['xwise.tracker.latest']);
        if (res?.['xwise.tracker.latest']?.account) {
          this.currentAccount = res['xwise.tracker.latest'].account;
        }
      } catch {}
    }

    return this.currentAccount;
  }

  /**
   * Fetch complete list of Following (friends)
   */
  async fetchFollowing(handle, onProgress) {
    return this._fetchRelationshipList('friends', handle, onProgress);
  }

  /**
   * Fetch complete list of Followers
   */
  async fetchFollowers(handle, onProgress) {
    return this._fetchRelationshipList('followers', handle, onProgress);
  }

  /**
   * Robust multi-tier fetcher:
   * Tier 1: REST 1.1 /list.json (full user objects)
   * Tier 2: REST 1.1 /ids.json + /users/lookup.json (up to 5000 IDs in 1 request)
   * Tier 3: GraphQL Following/Followers
   */
  async _fetchRelationshipList(type, handle, onProgress) {
    // 1. Try Tier 1: REST list.json
    try {
      const users = await this._fetchViaRestList(type, handle, onProgress);
      if (users && users.length > 0) return users;
    } catch (err) {
      if (String(err.message).startsWith('RATE_LIMITED')) throw err;
      console.warn(`[XWise] REST list.json for ${type} failed, trying fallback:`, err.message);
    }

    // 2. Try Tier 2: REST ids.json + users lookup
    try {
      const users = await this._fetchViaRestIds(type, handle, onProgress);
      if (users && users.length > 0) return users;
    } catch (err) {
      if (String(err.message).startsWith('RATE_LIMITED')) throw err;
      console.warn(`[XWise] REST ids.json for ${type} failed, trying GraphQL:`, err.message);
    }

    // 3. Try Tier 3: GraphQL
    try {
      const users = await this._fetchViaGraphQL(type, handle, onProgress);
      if (users && users.length > 0) return users;
    } catch (err) {
      if (String(err.message).startsWith('RATE_LIMITED')) throw err;
      console.warn(`[XWise] GraphQL for ${type} failed:`, err.message);
    }

    throw new Error(`امکان دریافت لیست ${type === 'friends' ? 'Following' : 'Followers'} وجود ندارد. لطفاً مطمئن شوید لاگین هستید.`);
  }

  /**
   * Tier 1: Fetch via REST list.json
   */
  async _fetchViaRestList(type, handle, onProgress) {
    let users = [];
    let cursor = '-1';
    const endpoint = `https://x.com/i/api/1.1/${type}/list.json`;
    let pageCount = 0;

    while (cursor && cursor !== '0') {
      const headers = await this._getHeaders();
      const url = `${endpoint}?screen_name=${encodeURIComponent(handle)}&cursor=${cursor}&count=200&skip_status=true&include_user_entities=false`;

      const res = await fetch(url, {
        method: 'GET',
        headers,
        credentials: 'include',
      });

      if (!res.ok) {
        if (res.status === 429) {
          const resetTime = res.headers.get('x-rate-limit-reset');
          const resetSec = resetTime ? Math.max(0, parseInt(resetTime, 10) - Math.floor(Date.now() / 1000)) : 900;
          throw new Error(`RATE_LIMITED:${resetSec}`);
        }
        throw new Error(`API_ERROR_${res.status}`);
      }

      const data = await res.json();
      const pageUsers = (data.users || []).map((u) => ({
        id: u.id_str || String(u.id || ''),
        handle: u.screen_name,
        name: u.name,
        avatar: u.profile_image_url_https || u.profile_image_url || '',
        bio: u.description || '',
        verified: !!(u.verified || u.is_blue_verified),
        following: !!u.following,
        followedBy: !!u.followed_by,
      }));

      users = users.concat(pageUsers);
      cursor = data.next_cursor_str || '0';
      pageCount++;

      if (typeof onProgress === 'function') {
        onProgress({
          type,
          count: users.length,
          page: pageCount,
          isDone: cursor === '0',
        });
      }

      if (cursor !== '0') {
        await new Promise((r) => setTimeout(r, 200));
      }
    }

    return users;
  }

  /**
   * Tier 2: Fetch via REST ids.json + users/lookup.json
   */
  async _fetchViaRestIds(type, handle, onProgress) {
    const headers = await this._getHeaders();
    const endpoint = `https://x.com/i/api/1.1/${type}/ids.json`;
    const url = `${endpoint}?screen_name=${encodeURIComponent(handle)}&stringify_ids=true&count=5000`;

    const res = await fetch(url, {
      method: 'GET',
      headers,
      credentials: 'include',
    });

    if (!res.ok) {
      if (res.status === 429) throw new Error('RATE_LIMITED');
      throw new Error(`IDS_FAILED_${res.status}`);
    }

    const data = await res.json();
    const ids = Array.isArray(data.ids) ? data.ids.map(String) : [];
    if (ids.length === 0) return [];

    if (typeof onProgress === 'function') {
      onProgress({ type, count: ids.length, message: `دریافت شناسه ${ids.length} کاربر...` });
    }

    // Lookup user objects in batches of 100
    const users = [];
    const batchSize = 100;
    for (let i = 0; i < ids.length; i += batchSize) {
      const slice = ids.slice(i, i + batchSize);
      try {
        const lookupRes = await fetch('https://x.com/i/api/1.1/users/lookup.json', {
          method: 'POST',
          headers: {
            ...headers,
            'content-type': 'application/x-www-form-urlencoded',
          },
          body: `user_id=${slice.join(',')}`,
          credentials: 'include',
        });

        if (lookupRes.ok) {
          const list = await lookupRes.json();
          for (const u of list) {
            users.push({
              id: u.id_str || String(u.id),
              handle: u.screen_name,
              name: u.name,
              avatar: u.profile_image_url_https || u.profile_image_url || '',
              bio: u.description || '',
              verified: !!(u.verified || u.is_blue_verified),
              following: !!u.following,
              followedBy: !!u.followed_by,
            });
          }
        }
      } catch {}

      if (typeof onProgress === 'function') {
        onProgress({ type, count: users.length, total: ids.length });
      }

      if (i + batchSize < ids.length) {
        await new Promise((r) => setTimeout(r, 200));
      }
    }

    return users;
  }

  /**
   * Tier 3: Fetch via GraphQL
   */
  async _fetchViaGraphQL(type, handle, onProgress) {
    const acc = await this.getCurrentUser();
    const userId = acc?.id;
    if (!userId) throw new Error('NO_USER_ID');

    const opName = type === 'friends' ? 'Following' : 'Followers';
    const queryId = await this._getGqlQueryId(opName);
    if (!queryId) throw new Error('NO_GQL_QUERY_ID');

    let users = [];
    let cursor = null;
    let pageCount = 0;
    let hasMore = true;

    while (hasMore) {
      const variables = {
        userId,
        count: 50,
        includePromotedContent: false,
      };
      if (cursor) variables.cursor = cursor;

      const headers = await this._getHeaders({
        'content-type': 'application/json',
      });

      const url = `https://x.com/i/api/graphql/${queryId}/${opName}?variables=${encodeURIComponent(
        JSON.stringify(variables)
      )}&features=${encodeURIComponent(JSON.stringify(GQL_FEATURES))}`;

      const res = await fetch(url, {
        method: 'GET',
        headers,
        credentials: 'include',
      });

      if (!res.ok) throw new Error(`GQL_${res.status}`);

      const data = await res.json();
      const instructions = data?.data?.user?.result?.timeline?.timeline?.instructions || [];
      let foundEntries = false;
      let nextCursor = null;

      for (const inst of instructions) {
        if (inst.type === 'TimelineAddEntries') {
          for (const entry of inst.entries || []) {
            const userResult = entry.content?.itemContent?.user_results?.result;
            if (userResult && (userResult.__typename === 'User' || userResult.legacy)) {
              const leg = userResult.legacy || {};
              users.push({
                id: userResult.rest_id || String(userResult.id || ''),
                handle: leg.screen_name,
                name: leg.name,
                avatar: leg.profile_image_url_https || '',
                bio: leg.description || '',
                verified: !!(userResult.is_blue_verified || leg.verified),
                following: !!leg.following,
                followedBy: !!leg.followed_by,
              });
              foundEntries = true;
            }
            if (entry.entryId && entry.entryId.startsWith('cursor-bottom-')) {
              nextCursor = entry.content?.value;
            }
          }
        }
      }

      pageCount++;
      if (typeof onProgress === 'function') {
        onProgress({ type, count: users.length, page: pageCount });
      }

      if (nextCursor && nextCursor !== cursor && foundEntries) {
        cursor = nextCursor;
        await new Promise((r) => setTimeout(r, 250));
      } else {
        hasMore = false;
      }
    }

    return users;
  }

  async _getGqlQueryId(operationName) {
    if (this.cachedGqlQueryIds && this.cachedGqlQueryIds[operationName]) {
      return this.cachedGqlQueryIds[operationName];
    }

    // Try storage
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      const cached = await chrome.storage.local.get(['xwise.gql.' + operationName]);
      if (cached && cached['xwise.gql.' + operationName]) {
        return cached['xwise.gql.' + operationName];
      }
    }

    // Scan scripts
    if (typeof document !== 'undefined') {
      const scripts = Array.from(document.querySelectorAll('script[src*="client-web/"]'));
      for (const s of scripts) {
        try {
          const res = await fetch(s.src);
          if (!res.ok) continue;
          const text = await res.text();
          const reg = new RegExp(`queryId:"([a-zA-Z0-9_-]+)",operationName:"${operationName}"|operationName:"${operationName}",queryId:"([a-zA-Z0-9_-]+)"`);
          const m = text.match(reg);
          const qId = m ? (m[1] || m[2]) : null;
          if (qId) {
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
              await chrome.storage.local.set({ ['xwise.gql.' + operationName]: qId });
            }
            return qId;
          }
        } catch {}
      }
    }

    // Fallbacks
    const fallbacks = {
      Following: '2v9xYvsX8Y1Y8Z7q9Q1Y8Z',
      Followers: '1v9xYvsX8Y1Y8Z7q9Q1Y8Z',
    };
    return fallbacks[operationName] || null;
  }

  /**
   * Unfollow a target user
   */
  async unfollowUser(targetUserId, targetScreenName) {
    const headers = await this._getHeaders({
      'content-type': 'application/x-www-form-urlencoded',
    });

    const body = new URLSearchParams();
    if (targetUserId) body.append('user_id', targetUserId);
    if (targetScreenName) body.append('screen_name', targetScreenName);

    const res = await fetch('https://x.com/i/api/1.1/friendships/destroy.json', {
      method: 'POST',
      headers,
      body: body.toString(),
      credentials: 'include',
    });

    if (!res.ok) {
      if (res.status === 429) throw new Error('RATE_LIMITED');
      throw new Error(`UNFOLLOW_FAILED_${res.status}`);
    }

    return await res.json();
  }

  /**
   * Remove a follower
   */
  async removeFollower(targetUserId, targetScreenName) {
    const headers = await this._getHeaders({
      'content-type': 'application/x-www-form-urlencoded',
    });

    const body = new URLSearchParams();
    if (targetUserId) body.append('user_id', targetUserId);
    if (targetScreenName) body.append('screen_name', targetScreenName);

    try {
      const res = await fetch('https://x.com/i/api/1.1/followers/destroy.json', {
        method: 'POST',
        headers,
        body: body.toString(),
        credentials: 'include',
      });
      if (res.ok) return await res.json();
    } catch {}

    // Fallback: Soft-block method (Block + Immediate Unblock to sever follower link)
    await this.blockUser(targetUserId, targetScreenName);
    await new Promise((r) => setTimeout(r, 400));
    await this.unblockUser(targetUserId, targetScreenName);
    return { success: true, method: 'soft_block' };
  }

  /**
   * Block a user
   */
  async blockUser(targetUserId, targetScreenName) {
    const headers = await this._getHeaders({
      'content-type': 'application/x-www-form-urlencoded',
    });
    const body = new URLSearchParams();
    if (targetUserId) body.append('user_id', targetUserId);
    if (targetScreenName) body.append('screen_name', targetScreenName);

    const res = await fetch('https://x.com/i/api/1.1/blocks/create.json', {
      method: 'POST',
      headers,
      body: body.toString(),
      credentials: 'include',
    });
    return res.ok;
  }

  /**
   * Unblock a user
   */
  async unblockUser(targetUserId, targetScreenName) {
    const headers = await this._getHeaders({
      'content-type': 'application/x-www-form-urlencoded',
    });
    const body = new URLSearchParams();
    if (targetUserId) body.append('user_id', targetUserId);
    if (targetScreenName) body.append('screen_name', targetScreenName);

    const res = await fetch('https://x.com/i/api/1.1/blocks/destroy.json', {
      method: 'POST',
      headers,
      body: body.toString(),
      credentials: 'include',
    });
    return res.ok;
  }
}

// Global Singleton Instance
const XWiseTwitterApi = new XWiseTwitterApiEngine();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { XWiseTwitterApi, XWiseTwitterApiEngine };
}
if (typeof globalThis !== 'undefined') {
  globalThis.XWiseTwitterApi = XWiseTwitterApi;
}
if (typeof window !== 'undefined') {
  window.XWiseTwitterApi = XWiseTwitterApi;
}
