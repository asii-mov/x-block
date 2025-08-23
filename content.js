class XBlockContent {
  constructor() {
    this.blockedUsers = new Set();
    this.isEnabled = true;
    this.observer = null;
    this.blockedTweets = new Set();
    this.init();
  }

  async init() {
    await this.loadSettings();
    this.setupMessageListener();
    this.startBlocking();
  }

  async loadSettings() {
    try {
      const result = await chrome.storage.sync.get(['blockedUsers', 'extensionEnabled']);
      this.blockedUsers = new Set((result.blockedUsers || []).map(user => user.toLowerCase()));
      this.isEnabled = result.extensionEnabled !== false;
    } catch (error) {
      console.error('XBlock: Failed to load settings:', error);
    }
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === 'updateBlockedUsers') {
        this.blockedUsers = new Set((message.blockedUsers || []).map(user => user.toLowerCase()));
        this.isEnabled = message.enabled !== false;
        this.processPage();
        sendResponse({ success: true });
      }
      return true;
    });
  }

  startBlocking() {
    if (!this.isEnabled) return;

    this.processPage();
    this.setupObserver();
  }

  setupObserver() {
    if (this.observer) {
      this.observer.disconnect();
    }

    this.observer = new MutationObserver((mutations) => {
      if (!this.isEnabled) return;
      
      let shouldProcess = false;
      
      for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          for (const node of mutation.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              if (this.isTweetElement(node) || node.querySelector('[data-testid="tweet"]')) {
                shouldProcess = true;
                break;
              }
            }
          }
        }
      }
      
      if (shouldProcess) {
        setTimeout(() => this.processPage(), 100);
      }
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  processPage() {
    if (!this.isEnabled || this.blockedUsers.size === 0) return;

    const tweets = this.findTweets();
    const profiles = this.findProfiles();
    const userCells = this.findUserCells();

    tweets.forEach(tweet => this.processTweet(tweet));
    profiles.forEach(profile => this.processProfile(profile));
    userCells.forEach(cell => this.processUserCell(cell));
  }

  findTweets() {
    return document.querySelectorAll('[data-testid="tweet"]');
  }

  findProfiles() {
    const selectors = [
      '[data-testid="UserCell"]',
      '[data-testid="user-recommendation"]',
      '[data-testid="userFollowIndicator"]'
    ];
    
    const profiles = [];
    selectors.forEach(selector => {
      profiles.push(...document.querySelectorAll(selector));
    });
    
    return profiles;
  }

  findUserCells() {
    return document.querySelectorAll('[data-testid="UserCell"], [data-testid="user-recommendation"]');
  }

  processTweet(tweet) {
    if (this.blockedTweets.has(tweet)) return;

    const username = this.extractUsernameFromTweet(tweet);
    if (username && this.blockedUsers.has(username.toLowerCase())) {
      this.hideTweet(tweet);
      this.blockedTweets.add(tweet);
    }
  }

  processProfile(profile) {
    const username = this.extractUsernameFromProfile(profile);
    if (username && this.blockedUsers.has(username.toLowerCase())) {
      this.hideElement(profile);
    }
  }

  processUserCell(cell) {
    const username = this.extractUsernameFromUserCell(cell);
    if (username && this.blockedUsers.has(username.toLowerCase())) {
      this.hideElement(cell);
    }
  }

  extractUsernameFromTweet(tweet) {
    const usernameSelectors = [
      '[data-testid="User-Name"] a[href*="/"]',
      'a[href*="/"][role="link"] span',
      '[data-testid="User-Names"] a'
    ];

    for (const selector of usernameSelectors) {
      const element = tweet.querySelector(selector);
      if (element) {
        const href = element.getAttribute('href');
        if (href) {
          const match = href.match(/\/([a-zA-Z0-9_]+)$/);
          if (match && match[1]) {
            return match[1];
          }
        }

        const textContent = element.textContent;
        if (textContent && textContent.startsWith('@')) {
          return textContent.substring(1);
        }
      }
    }

    const links = tweet.querySelectorAll('a[href*="/"]');
    for (const link of links) {
      const href = link.getAttribute('href');
      if (href && href.startsWith('/') && !href.includes('/status/') && !href.includes('/i/')) {
        const match = href.match(/\/([a-zA-Z0-9_]+)$/);
        if (match && match[1] && this.isValidUsername(match[1])) {
          return match[1];
        }
      }
    }

    return null;
  }

  extractUsernameFromProfile(profile) {
    const selectors = [
      'a[href*="/"][role="link"]',
      '[data-testid="User-Name"] a',
      'a[href^="/"]'
    ];

    for (const selector of selectors) {
      const element = profile.querySelector(selector);
      if (element) {
        const href = element.getAttribute('href');
        if (href) {
          const match = href.match(/\/([a-zA-Z0-9_]+)$/);
          if (match && match[1] && this.isValidUsername(match[1])) {
            return match[1];
          }
        }
      }
    }

    return null;
  }

  extractUsernameFromUserCell(cell) {
    const links = cell.querySelectorAll('a[href^="/"]');
    for (const link of links) {
      const href = link.getAttribute('href');
      if (href) {
        const match = href.match(/\/([a-zA-Z0-9_]+)$/);
        if (match && match[1] && this.isValidUsername(match[1])) {
          return match[1];
        }
      }
    }

    return null;
  }

  isValidUsername(username) {
    return /^[a-zA-Z0-9_]{1,15}$/.test(username) && 
           !['home', 'explore', 'notifications', 'messages', 'bookmarks', 'lists', 'profile', 'settings', 'help'].includes(username.toLowerCase());
  }

  isTweetElement(element) {
    return element.getAttribute && element.getAttribute('data-testid') === 'tweet';
  }

  hideTweet(tweet) {
    if (tweet.style.display !== 'none') {
      tweet.style.display = 'none';
      tweet.setAttribute('data-xblock-hidden', 'true');
      
      const wrapper = tweet.closest('div[data-testid="cellInnerDiv"]') || tweet.closest('article');
      if (wrapper && wrapper !== tweet) {
        wrapper.style.display = 'none';
        wrapper.setAttribute('data-xblock-hidden', 'true');
      }
    }
  }

  hideElement(element) {
    if (element.style.display !== 'none') {
      element.style.display = 'none';
      element.setAttribute('data-xblock-hidden', 'true');
    }
  }

  showHiddenElements() {
    const hiddenElements = document.querySelectorAll('[data-xblock-hidden="true"]');
    hiddenElements.forEach(element => {
      element.style.display = '';
      element.removeAttribute('data-xblock-hidden');
    });
    this.blockedTweets.clear();
  }

  stop() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.showHiddenElements();
  }

  restart() {
    this.stop();
    if (this.isEnabled) {
      this.startBlocking();
    }
  }
}

let xBlockContent;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    xBlockContent = new XBlockContent();
  });
} else {
  xBlockContent = new XBlockContent();
}

window.addEventListener('beforeunload', () => {
  if (xBlockContent) {
    xBlockContent.stop();
  }
});