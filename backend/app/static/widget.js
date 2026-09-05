(function () {
  'use strict';

  // 1. Detect site_key from current script tag attributes
  const currentScript = document.currentScript || (function () {
    const scripts = document.getElementsByTagName('script');
    return scripts[scripts.length - 1];
  })();

  const siteKey = currentScript ? currentScript.getAttribute('data-site-key') : window.AISalesBotSiteKey;

  if (!siteKey) {
    console.error('[AI Sales Bot] Error: Missing data-site-key attribute on script tag.');
    return;
  }

  // Determine base API URL from script src domain
  let apiBaseUrl = 'http://localhost:8000';
  if (currentScript && currentScript.src) {
    try {
      const url = new URL(currentScript.src);
      apiBaseUrl = `${url.protocol}//${url.host}`;
    } catch (e) {
      // fallback
    }
  }

  // Unique session per website visitor
  const storageKey = `ai_sales_bot_session_${siteKey}`;
  let sessionId = localStorage.getItem(storageKey);
  if (!sessionId) {
    sessionId = 'sess_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem(storageKey, sessionId);
  }

  // Global Widget State
  let config = {
    bot_title: 'Sales Assistant',
    greeting_message: 'Hello! How can I help you today?',
    primary_color: '#4F46E5',
    widget_icon: 'Bot',
    company_name: 'AI Sales Bot',
    is_enabled: true
  };

  let isOpen = false;

  // Icon SVG Map for 10 Default Icons
  const iconSvgMap = {
    Bot: `<path d="M12 2a2 2 0 0 1 2 2v2h2a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2V4a2 2 0 0 1 2-2zm-4 8v4h8v-4H8zm2 1.5a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm4 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>`,
    MessageSquare: `<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10z"/>`,
    Sparkles: `<path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3z"/>`,
    Headphones: `<path d="M3 14v3a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3v-3M3 14a9 9 0 0 1 18 0v3h-3v-3M3 14h3v3H3v-3z"/>`,
    Zap: `<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>`,
    HelpCircle: `<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>`,
    PhoneCall: `<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>`,
    Smile: `<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>`,
    Flame: `<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3.5z"/>`,
    Briefcase: `<rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>`
  };

  function getIconSvg(iconName) {
    const body = iconSvgMap[iconName] || iconSvgMap['Bot'];
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
  }

  // Inject Styles into Document
  function injectStyles(themeColor) {
    const styleId = 'ai-sales-bot-widget-styles';
    let styleEl = document.getElementById(styleId);
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }

    styleEl.innerHTML = `
      .ai-bot-fab {
        position: fixed;
        bottom: 24px;
        right: 24px;
        width: 60px;
        height: 60px;
        border-radius: 30px;
        background-color: ${themeColor};
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 999999;
        transition: transform 0.25s ease, box-shadow 0.25s ease;
        border: none;
        outline: none;
        color: #ffffff;
      }
      .ai-bot-fab:hover {
        transform: scale(1.08);
        box-shadow: 0 6px 24px rgba(0, 0, 0, 0.35);
      }
      .ai-bot-fab svg {
        width: 28px;
        height: 28px;
      }

      .ai-bot-container {
        position: fixed;
        bottom: 96px;
        right: 24px;
        width: 380px;
        max-width: calc(100vw - 32px);
        height: 580px;
        max-height: calc(100vh - 120px);
        background: #ffffff;
        border-radius: 16px;
        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
        display: flex;
        flex-direction: column;
        z-index: 999999;
        overflow: hidden;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        opacity: 0;
        transform: translateY(20px) scale(0.95);
        pointer-events: none;
        transition: opacity 0.25s ease, transform 0.25s ease;
      }
      .ai-bot-container.open {
        opacity: 1;
        transform: translateY(0) scale(1);
        pointer-events: auto;
      }

      .ai-bot-header {
        background-color: ${themeColor};
        color: #ffffff;
        padding: 16px 20px;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .ai-bot-header-info {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .ai-bot-header-info svg {
        width: 22px;
        height: 22px;
      }
      .ai-bot-header-title {
        font-size: 16px;
        font-weight: 600;
        margin: 0;
      }
      .ai-bot-header-status {
        font-size: 12px;
        opacity: 0.85;
        display: flex;
        align-items: center;
        gap: 6px;
        margin-top: 2px;
      }
      .ai-bot-status-dot {
        width: 8px;
        height: 8px;
        background-color: #10B981;
        border-radius: 50%;
        display: inline-block;
      }
      .ai-bot-close-btn {
        background: transparent;
        border: none;
        color: #ffffff;
        cursor: pointer;
        font-size: 20px;
        line-height: 1;
        opacity: 0.8;
        padding: 4px;
      }
      .ai-bot-close-btn:hover {
        opacity: 1;
      }

      .ai-bot-messages {
        flex: 1;
        padding: 16px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 12px;
        background-color: #F9FAFB;
      }

      .ai-bot-msg {
        max-width: 80%;
        padding: 10px 14px;
        border-radius: 14px;
        font-size: 14px;
        line-height: 1.45;
        word-break: break-word;
      }
      .ai-bot-msg.bot {
        align-self: flex-start;
        background-color: #E5E7EB;
        color: #1F2937;
        border-bottom-left-radius: 2px;
      }
      .ai-bot-msg.user {
        align-self: flex-end;
        background-color: ${themeColor};
        color: #ffffff;
        border-bottom-right-radius: 2px;
      }

      .ai-bot-typing {
        align-self: flex-start;
        background-color: #E5E7EB;
        padding: 10px 14px;
        border-radius: 14px;
        display: none;
        gap: 4px;
      }
      .ai-bot-typing span {
        width: 6px;
        height: 6px;
        background-color: #6B7280;
        border-radius: 50%;
        animation: aiBotBounce 1.4s infinite ease-in-out both;
      }
      .ai-bot-typing span:nth-child(1) { animation-delay: -0.32s; }
      .ai-bot-typing span:nth-child(2) { animation-delay: -0.16s; }
      @keyframes aiBotBounce {
        0%, 80%, 100% { transform: scale(0); }
        40% { transform: scale(1); }
      }

      .ai-bot-footer {
        padding: 12px 16px;
        background-color: #ffffff;
        border-top: 1px solid #E5E7EB;
        display: flex;
        gap: 8px;
      }
      .ai-bot-input {
        flex: 1;
        border: 1px solid #D1D5DB;
        border-radius: 20px;
        padding: 8px 14px;
        font-size: 14px;
        outline: none;
      }
      .ai-bot-input:focus {
        border-color: ${themeColor};
      }
      .ai-bot-send-btn {
        background-color: ${themeColor};
        color: #ffffff;
        border: none;
        border-radius: 50%;
        width: 36px;
        height: 36px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      .ai-bot-send-btn svg {
        width: 16px;
        height: 16px;
        fill: #ffffff;
      }
    `;
  }

  // Create Widget DOM Elements
  function createWidgetDOM() {
    // Floating Action Button
    const fab = document.createElement('button');
    fab.className = 'ai-bot-fab';
    fab.id = 'ai-bot-fab-btn';
    fab.innerHTML = getIconSvg(config.widget_icon);

    // Chat Container Window
    const container = document.createElement('div');
    container.className = 'ai-bot-container';
    container.innerHTML = `
      <div class="ai-bot-header">
        <div class="ai-bot-header-info">
          <div id="ai-bot-header-icon">${getIconSvg(config.widget_icon)}</div>
          <div>
            <div class="ai-bot-header-title" id="ai-bot-header-title">${config.bot_title}</div>
            <div class="ai-bot-header-status">
              <span class="ai-bot-status-dot"></span> Online
            </div>
          </div>
        </div>
        <button class="ai-bot-close-btn" id="ai-bot-close-btn">&times;</button>
      </div>

      <div class="ai-bot-messages" id="ai-bot-messages">
        <div class="ai-bot-typing" id="ai-bot-typing">
          <span></span><span></span><span></span>
        </div>
      </div>

      <div class="ai-bot-footer">
        <input type="text" class="ai-bot-input" id="ai-bot-input" placeholder="Type your message..." />
        <button class="ai-bot-send-btn" id="ai-bot-send-btn">
          <svg viewBox="0 0 24 24">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        </button>
      </div>
    `;

    document.body.appendChild(fab);
    document.body.appendChild(container);

    fab.addEventListener('click', toggleWidget);
    document.getElementById('ai-bot-close-btn').addEventListener('click', toggleWidget);

    const input = document.getElementById('ai-bot-input');
    const sendBtn = document.getElementById('ai-bot-send-btn');

    sendBtn.addEventListener('click', () => handleSend());
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        handleSend();
      }
    });
  }

  function toggleWidget() {
    isOpen = !isOpen;
    const container = document.querySelector('.ai-bot-container');
    if (isOpen) {
      container.classList.add('open');
      document.getElementById('ai-bot-input').focus();
    } else {
      container.classList.remove('open');
    }
  }

  function appendMessage(text, role) {
    const messagesEl = document.getElementById('ai-bot-messages');
    const typingEl = document.getElementById('ai-bot-typing');

    const msgEl = document.createElement('div');
    msgEl.className = `ai-bot-msg ${role}`;
    msgEl.textContent = text;

    messagesEl.insertBefore(msgEl, typingEl);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function showTyping(show) {
    const typingEl = document.getElementById('ai-bot-typing');
    typingEl.style.display = show ? 'flex' : 'none';
    const messagesEl = document.getElementById('ai-bot-messages');
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  async function fetchConfig() {
    try {
      const res = await fetch(`${apiBaseUrl}/api/v1/widget/public/config/${siteKey}`);
      if (res.ok) {
        const data = await res.json();
        config = { ...config, ...data };
        injectStyles(config.primary_color);
        document.getElementById('ai-bot-header-title').textContent = config.bot_title;
        
        // Update Icons
        const svg = getIconSvg(config.widget_icon);
        const fabBtn = document.getElementById('ai-bot-fab-btn');
        if (fabBtn) fabBtn.innerHTML = svg;

        const headerIcon = document.getElementById('ai-bot-header-icon');
        if (headerIcon) headerIcon.innerHTML = svg;

        appendMessage(config.greeting_message, 'bot');
      }
    } catch (e) {
      console.error('[AI Sales Bot] Error fetching widget config:', e);
    }
  }

  async function handleSend() {
    const input = document.getElementById('ai-bot-input');
    const text = input.value.trim();
    if (!text) return;

    input.value = '';
    appendMessage(text, 'user');
    showTyping(true);

    try {
      const res = await fetch(`${apiBaseUrl}/api/v1/widget/public/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          site_key: siteKey,
          session_id: sessionId,
          message: text
        })
      });

      showTyping(false);

      if (res.ok) {
        const data = await res.json();
        appendMessage(data.answer, 'bot');
      } else {
        appendMessage("Sorry, I couldn't process your message right now.", 'bot');
      }
    } catch (e) {
      showTyping(false);
      appendMessage("Network connection error. Please try again.", 'bot');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      injectStyles(config.primary_color);
      createWidgetDOM();
      fetchConfig();
    });
  } else {
    injectStyles(config.primary_color);
    createWidgetDOM();
    fetchConfig();
  }
})();
