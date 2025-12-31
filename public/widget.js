/**
 * AI Voice Platform - Embeddable Widget Loader
 *
 * Usage:
 * <script src="https://your-domain.com/widget.js" data-embed-id="your-embed-id"></script>
 *
 * Options (data attributes):
 * - data-embed-id: Required. Your unique embed ID
 * - data-position: "bottom-right" (default) or "bottom-left"
 * - data-theme: "auto" (default), "light", or "dark"
 * - data-primary-color: Hex color for accent (default: #6366f1)
 * - data-lazy: "true" to load on first interaction
 */
(function() {
  'use strict';

  // Prevent multiple initializations
  if (window.__aiVoiceWidgetLoaded) return;
  window.__aiVoiceWidgetLoaded = true;

  // Get script tag and config
  var script = document.currentScript || (function() {
    var scripts = document.getElementsByTagName('script');
    for (var i = scripts.length - 1; i >= 0; i--) {
      if (scripts[i].src.indexOf('widget.js') !== -1) return scripts[i];
    }
  })();

  if (!script) {
    console.error('[AI Voice Widget] Script tag not found');
    return;
  }

  var embedId = script.getAttribute('data-embed-id');
  if (!embedId) {
    console.error('[AI Voice Widget] Missing data-embed-id attribute');
    return;
  }

  // Configuration
  var config = {
    embedId: embedId,
    position: script.getAttribute('data-position') || 'bottom-right',
    theme: script.getAttribute('data-theme') || 'auto',
    primaryColor: script.getAttribute('data-primary-color') || '#6366f1',
    lazy: script.getAttribute('data-lazy') === 'true',
    baseUrl: script.src.replace('/widget.js', '')
  };

  // Styles
  var styles = document.createElement('style');
  styles.textContent = [
    '.ai-voice-widget-container {',
    '  position: fixed;',
    '  bottom: 20px;',
    '  ' + (config.position === 'bottom-left' ? 'left' : 'right') + ': 20px;',
    '  z-index: 2147483647;',
    '  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;',
    '}',
    '.ai-voice-widget-button {',
    '  width: 60px;',
    '  height: 60px;',
    '  border-radius: 50%;',
    '  background: ' + config.primaryColor + ';',
    '  border: none;',
    '  cursor: pointer;',
    '  display: flex;',
    '  align-items: center;',
    '  justify-content: center;',
    '  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);',
    '  transition: transform 0.2s, box-shadow 0.2s;',
    '}',
    '.ai-voice-widget-button:hover {',
    '  transform: scale(1.05);',
    '  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);',
    '}',
    '.ai-voice-widget-button svg {',
    '  width: 28px;',
    '  height: 28px;',
    '  fill: white;',
    '}',
    '.ai-voice-widget-iframe-container {',
    '  position: absolute;',
    '  bottom: 70px;',
    '  ' + (config.position === 'bottom-left' ? 'left' : 'right') + ': 0;',
    '  width: 380px;',
    '  height: 600px;',
    '  max-height: calc(100vh - 100px);',
    '  border-radius: 16px;',
    '  overflow: hidden;',
    '  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);',
    '  opacity: 0;',
    '  transform: translateY(10px) scale(0.95);',
    '  transition: opacity 0.2s, transform 0.2s;',
    '  pointer-events: none;',
    '}',
    '.ai-voice-widget-iframe-container.open {',
    '  opacity: 1;',
    '  transform: translateY(0) scale(1);',
    '  pointer-events: auto;',
    '}',
    '.ai-voice-widget-iframe {',
    '  width: 100%;',
    '  height: 100%;',
    '  border: none;',
    '}',
    '@media (max-width: 440px) {',
    '  .ai-voice-widget-iframe-container {',
    '    width: calc(100vw - 40px);',
    '    height: calc(100vh - 100px);',
    '    bottom: 70px;',
    '    ' + (config.position === 'bottom-left' ? 'left' : 'right') + ': 0;',
    '  }',
    '}'
  ].join('\n');
  document.head.appendChild(styles);

  // Create container
  var container = document.createElement('div');
  container.className = 'ai-voice-widget-container';

  // Create toggle button
  var button = document.createElement('button');
  button.className = 'ai-voice-widget-button';
  button.setAttribute('aria-label', 'Open chat');
  button.innerHTML = '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg>';

  // Create iframe container
  var iframeContainer = document.createElement('div');
  iframeContainer.className = 'ai-voice-widget-iframe-container';

  // State
  var isOpen = false;
  var iframeLoaded = false;
  var iframe = null;

  function createIframe() {
    if (iframe) return;

    iframe = document.createElement('iframe');
    iframe.className = 'ai-voice-widget-iframe';
    iframe.src = config.baseUrl + '/widget/' + config.embedId +
      '?theme=' + config.theme +
      '&color=' + encodeURIComponent(config.primaryColor) +
      '&origin=' + encodeURIComponent(window.location.origin);
    iframe.setAttribute('allow', 'microphone');
    iframe.setAttribute('title', 'AI Chat Widget');

    iframeContainer.appendChild(iframe);
    iframeLoaded = true;
  }

  function toggle() {
    isOpen = !isOpen;

    if (isOpen && !iframeLoaded) {
      createIframe();
    }

    iframeContainer.classList.toggle('open', isOpen);
    button.setAttribute('aria-label', isOpen ? 'Close chat' : 'Open chat');
    button.innerHTML = isOpen
      ? '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>'
      : '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg>';
  }

  button.addEventListener('click', toggle);

  // Listen for messages from iframe
  window.addEventListener('message', function(event) {
    if (event.origin !== config.baseUrl) return;

    var data = event.data;
    if (data.type === 'ai-voice-widget-close') {
      if (isOpen) toggle();
    } else if (data.type === 'ai-voice-widget-ready') {
      // Widget is ready, can send config
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage({
          type: 'ai-voice-widget-config',
          config: config
        }, config.baseUrl);
      }
    }
  });

  // Assemble widget
  container.appendChild(iframeContainer);
  container.appendChild(button);

  // Initialize
  if (config.lazy) {
    // Wait for first interaction to load iframe
  } else {
    // Preload iframe after page load
    if (document.readyState === 'complete') {
      setTimeout(createIframe, 1000);
    } else {
      window.addEventListener('load', function() {
        setTimeout(createIframe, 1000);
      });
    }
  }

  // Add to page
  if (document.body) {
    document.body.appendChild(container);
  } else {
    document.addEventListener('DOMContentLoaded', function() {
      document.body.appendChild(container);
    });
  }

  // Expose API
  window.AIVoiceWidget = {
    open: function() { if (!isOpen) toggle(); },
    close: function() { if (isOpen) toggle(); },
    toggle: toggle,
    isOpen: function() { return isOpen; }
  };
})();
