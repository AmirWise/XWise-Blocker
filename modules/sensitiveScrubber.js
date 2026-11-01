'use strict';

/**
 * XWise Blocker — Native Sensitive Media Scrubber (MAIN World)
 * Patches JSON.parse, Response.prototype.json, and XMLHttpRequest
 * so Twitter's React client receives sensitive media unflagged,
 * rendering clean media tiles and videos with full autoplay.
 */
(function () {
  if (typeof window === 'undefined' || window.__xwiseScrubberInstalled) return;
  window.__xwiseScrubberInstalled = true;

  const MARKER_RE = /possibly_sensitive|sensitive_media_warning|mediaVisibilityResults|display_sensitive_media|ext_sensitive_media_warning/;

  function scrub(node, depth = 0) {
    if (!node || typeof node !== 'object' || depth > 60) return;
    if (Array.isArray(node)) {
      for (let i = 0; i < node.length; i++) scrub(node[i], depth + 1);
      return;
    }

    if (node.possibly_sensitive === true) node.possibly_sensitive = false;
    if (node.has_sensitive_media === true) node.has_sensitive_media = false;
    if (node.is_sensitive === true) node.is_sensitive = false;
    if (node.display_sensitive_media === false) node.display_sensitive_media = true;
    if ('sensitive_media_warning' in node) delete node.sensitive_media_warning;
    if ('ext_sensitive_media_warning' in node) delete node.ext_sensitive_media_warning;
    if ('mediaVisibilityResults' in node) delete node.mediaVisibilityResults;

    for (const k in node) {
      const v = node[k];
      if (v && typeof v === 'object') scrub(v, depth + 1);
    }
  }

  function safeScrub(data) {
    try {
      scrub(data);
    } catch {}
    return data;
  }

  // 1. Hook JSON.parse
  const origParse = JSON.parse;
  JSON.parse = function (text, reviver) {
    const data = origParse.apply(this, arguments);
    if (typeof text === 'string' && text.length > 20 && MARKER_RE.test(text)) {
      safeScrub(data);
    }
    return data;
  };

  // 2. Hook Response.prototype.json
  if (typeof Response !== 'undefined' && Response.prototype.json) {
    const origJson = Response.prototype.json;
    Response.prototype.json = function () {
      return origJson.apply(this, arguments).then((data) => safeScrub(data));
    };
  }

  // 3. Hook XMLHttpRequest.prototype.response
  const scrubbedXhrs = new WeakSet();
  const respDesc = Object.getOwnPropertyDescriptor(XMLHttpRequest.prototype, 'response');
  if (respDesc && respDesc.get) {
    Object.defineProperty(XMLHttpRequest.prototype, 'response', {
      configurable: true,
      enumerable: respDesc.enumerable,
      get() {
        const value = respDesc.get.call(this);
        if (this.responseType === 'json' && value && typeof value === 'object' && !scrubbedXhrs.has(this)) {
          scrubbedXhrs.add(this);
          safeScrub(value);
        }
        return value;
      },
    });
  }
})();
