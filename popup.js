class XBlockPopup {
  constructor() {
    this.queuedUsers = new Set(); // User IDs from processed lists (not blocked yet)
    this.blockedUsers = new Set(); // Actually blocked users (with usernames)
    this.isEnabled = true;
    this.minDelay = 5;
    this.maxDelay = 20;
    this.init();
  }

  async init() {
    console.log('XBlockPopup: Initializing');
    await this.loadSettings();
    this.bindEvents();
    await this.updateUI();
  }

  async loadSettings() {
    try {
      console.log('XBlockPopup: Loading settings');
      const result = await chrome.storage.sync.get(['queuedUsers', 'blockedUsers', 'extensionEnabled', 'minDelay', 'maxDelay']);
      this.queuedUsers = new Set(result.queuedUsers || []);
      this.blockedUsers = new Set(result.blockedUsers || []);
      this.isEnabled = result.extensionEnabled !== false;
      this.minDelay = result.minDelay || 5;
      this.maxDelay = result.maxDelay || 20;
      console.log('XBlockPopup: Loaded settings', {
        queuedUsersCount: this.queuedUsers.size,
        blockedUsersCount: this.blockedUsers.size,
        extensionEnabled: this.isEnabled,
        minDelay: this.minDelay,
        maxDelay: this.maxDelay
      });
    } catch (error) {
      console.error('XBlockPopup: Failed to load settings:', error);
      this.showStatus('Failed to load settings', 'error');
    }
  }

  async saveSettings() {
    try {
      console.log('XBlockPopup: Saving settings', {
        queuedUsersCount: this.queuedUsers.size,
        blockedUsersCount: this.blockedUsers.size,
        extensionEnabled: this.isEnabled,
        minDelay: this.minDelay,
        maxDelay: this.maxDelay
      });
      await chrome.storage.sync.set({
        queuedUsers: Array.from(this.queuedUsers),
        blockedUsers: Array.from(this.blockedUsers),
        extensionEnabled: this.isEnabled,
        minDelay: this.minDelay,
        maxDelay: this.maxDelay
      });
      console.log('XBlockPopup: Settings saved');
    } catch (error) {
      console.error('XBlockPopup: Failed to save settings:', error);
      this.showStatus('Failed to save settings', 'error');
    }
  }

  bindEvents() {
    console.log('XBlockPopup: Binding events');
    document.getElementById('blockUsers').addEventListener('click', () => this.handleBlockUsers());
    document.getElementById('clearList').addEventListener('click', () => this.handleClearList());
    document.getElementById('clearAll').addEventListener('click', () => this.handleClearAll());
    document.getElementById('exportList').addEventListener('click', () => this.handleExportList());
    document.getElementById('extensionEnabled').addEventListener('change', (e) => this.handleToggleEnabled(e));
    document.getElementById('processLists').addEventListener('click', () => this.handleProcessLists());
    
    // Bind timing slider events
    document.getElementById('minDelay').addEventListener('input', (e) => this.handleMinDelayChange(e));
    document.getElementById('maxDelay').addEventListener('input', (e) => this.handleMaxDelayChange(e));
    
    // Add event delegation for remove buttons in blocked users list
    document.getElementById('blockedUsersList').addEventListener('click', (e) => {
      if (e.target.classList.contains('remove-user')) {
        const username = e.target.getAttribute('data-username');
        if (username) {
          this.unblockUser(username);
        }
      }
    });
  }

  async handleBlockUsers() {
    console.log('XBlockPopup: Handling block users');
    
    // Only perform API blocking of users that are queued
    if (this.queuedUsers.size === 0) {
      this.showStatus('No users queued for blocking. Process lists first.', 'error');
      return;
    }
    
    try {
      this.showStatus(`Blocking ${this.queuedUsers.size} queued users via API...`, 'info');
      
      // Send timing parameters along with queued user IDs to background script
      const response = await chrome.runtime.sendMessage({
        action: 'blockUsers',
        userIds: Array.from(this.queuedUsers),
        minDelay: this.minDelay * 1000, // Convert to milliseconds
        maxDelay: this.maxDelay * 1000  // Convert to milliseconds
      });
      
      if (response.success) {
        // Move successfully blocked usernames from queue to blocked users
        if (response.blockedUsernames && response.blockedUsernames.length > 0) {
          // Add blocked usernames to the blocked users list
          response.blockedUsernames.forEach(username => this.blockedUsers.add(username));
          
          // Clear all queued users since we attempted to block them all
          this.queuedUsers.clear();
          
          await this.saveSettings();
          await this.updateUI();
          await this.notifyContentScript();
        }
        
        if (response.failedCount && response.failedCount > 0) {
          this.showStatus(`Blocked ${response.blockedCount}/${response.totalCount} users (${response.failedCount} failed)`, 'warning');
        } else {
          this.showStatus(`Successfully blocked ${response.blockedCount} users via API`, 'success');
        }
      } else {
        this.showStatus('Failed to block users: ' + (response.error || 'Unknown error'), 'error');
      }
    } catch (error) {
      console.error('XBlockPopup: Failed to block users:', error);
      this.showStatus('Failed to block users: ' + error.message, 'error');
    }
  }


  handleMinDelayChange(event) {
    const value = parseInt(event.target.value);
    this.minDelay = value;
    document.getElementById('minDelayValue').textContent = value;
    
    // Ensure min delay doesn't exceed max delay
    const maxSlider = document.getElementById('maxDelay');
    if (value > this.maxDelay) {
      this.maxDelay = value;
      maxSlider.value = value;
      document.getElementById('maxDelayValue').textContent = value;
    }
    
    // Update minimum value of max slider
    maxSlider.min = value;
    
    this.saveSettings();
  }

  handleMaxDelayChange(event) {
    const value = parseInt(event.target.value);
    this.maxDelay = value;
    document.getElementById('maxDelayValue').textContent = value;
    
    // Ensure max delay is at least min delay
    if (value < this.minDelay) {
      this.minDelay = value;
      const minSlider = document.getElementById('minDelay');
      minSlider.value = value;
      document.getElementById('minDelayValue').textContent = value;
      minSlider.max = value;
    }
    
    this.saveSettings();
  }

  handleClearList() {
    console.log('XBlockPopup: Clearing list URLs');
    document.getElementById('listUrls').value = '';
  }

  async handleProcessLists() {
    console.log('XBlockPopup: Handling process lists');
    const textarea = document.getElementById('listUrls');
    const input = textarea.value.trim();

    if (!input) {
      this.showStatus('Please enter list URLs to process', 'error');
      return;
    }

    const listUrls = input.split('\n').filter(url => url.trim() !== '');
    
    if (listUrls.length === 0) {
      this.showStatus('No valid list URLs found', 'error');
      return;
    }

    this.showStatus(`Processing ${listUrls.length} lists...`, 'info');
    
    try {
      console.log('XBlockPopup: Sending message to background script to process lists', listUrls);
      // Send a message to the background script to process the lists
      const response = await chrome.runtime.sendMessage({
        action: 'processListUrl',
        listUrls: listUrls
      });
      
      console.log('XBlockPopup: Received response from background script', response);
      
      if (response.success) {
        // Store user IDs from list processing in the queue (not blocked yet)
        const usersToAdd = response.userIds;
        
        // Add the user IDs to the queued users list (not blocked yet)
        const newUsers = usersToAdd.filter(user => !this.queuedUsers.has(user));
        newUsers.forEach(user => this.queuedUsers.add(user));
        
        // Save the updated list
        await this.saveSettings();
        await this.updateUI();
        
        this.showStatus(`Successfully processed lists. Queued ${newUsers.length} new users for blocking (${usersToAdd.length - newUsers.length} duplicates).`, 'success');
        console.log('XBlockPopup: Added user IDs to the queue:', newUsers);
      } else {
        this.showStatus('Failed to process lists: ' + (response.error || 'Unknown error'), 'error');
      }
    } catch (error) {
      console.error('XBlockPopup: Failed to process lists:', error);
      this.showStatus('Failed to process lists: ' + error.message, 'error');
    }
  }

  async handleClearAll() {
    console.log('XBlockPopup: Handling clear all');
    const totalUsers = this.queuedUsers.size + this.blockedUsers.size;
    
    if (totalUsers === 0) {
      this.showStatus('No users to clear', 'info');
      return;
    }
    
    if (confirm(`Are you sure you want to clear ${this.queuedUsers.size} queued and ${this.blockedUsers.size} blocked users?`)) {
      this.queuedUsers.clear();
      this.blockedUsers.clear();
      await this.saveSettings();
      await this.updateUI();
      await this.notifyContentScript();
      this.showStatus('All queued and blocked users cleared', 'info');
    }
  }

  handleExportList() {
    console.log('XBlockPopup: Handling export list');
    if (this.blockedUsers.size === 0) {
      this.showStatus('No users to export', 'error');
      return;
    }

    const userList = Array.from(this.blockedUsers).map(user => `@${user}`).join('\n');
    const blob = new Blob([userList], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'x-block-users.txt';
    a.click();
    
    URL.revokeObjectURL(url);
    this.showStatus(`Exported ${this.blockedUsers.size} usernames to file`, 'success');
  }

  async handleToggleEnabled(event) {
    console.log('XBlockPopup: Handling toggle enabled', event.target.checked);
    this.isEnabled = event.target.checked;
    await this.saveSettings();
    await this.notifyContentScript();
    
    this.showStatus(
      this.isEnabled ? 'Extension enabled' : 'Extension disabled',
      'info'
    );
  }

  // Sanitize string to prevent XSS attacks
  sanitizeString(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/[<>"'&]/g, function(match) {
      const escapeMap = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;'
      };
      return escapeMap[match];
    });
  }

  // Validate username format to prevent injection attacks
  isValidUsernameFormat(username) {
    if (typeof username !== 'string') return false;
    // Twitter usernames: 1-15 chars, alphanumeric + underscore, no spaces/special chars
    return /^[a-zA-Z0-9_]{1,15}$/.test(username);
  }

  async updateUI() {
    console.log('XBlockPopup: Updating UI');
    document.getElementById('extensionEnabled').checked = this.isEnabled;
    document.getElementById('blockedCount').textContent = this.blockedUsers.size;
    
    // Update Block Users button text to show queued count
    const blockUsersBtn = document.getElementById('blockUsers');
    if (this.queuedUsers.size > 0) {
      blockUsersBtn.textContent = `Block ${this.queuedUsers.size} Users`;
    } else {
      blockUsersBtn.textContent = 'Block Users';
    }
    
    // Update timing sliders
    document.getElementById('minDelay').value = this.minDelay;
    document.getElementById('maxDelay').value = this.maxDelay;
    document.getElementById('minDelayValue').textContent = this.minDelay;
    document.getElementById('maxDelayValue').textContent = this.maxDelay;
    
    // Set slider constraints
    document.getElementById('maxDelay').min = this.minDelay;
    document.getElementById('minDelay').max = this.maxDelay;
    
    const blockedUsersList = document.getElementById('blockedUsersList');
    
    if (this.blockedUsers.size === 0) {
      // Use textContent to prevent XSS
      blockedUsersList.innerHTML = '';
      const emptyDiv = document.createElement('div');
      emptyDiv.className = 'empty-state';
      emptyDiv.textContent = 'No users actually blocked yet';
      blockedUsersList.appendChild(emptyDiv);
      return;
    }

    // Clear existing content
    blockedUsersList.innerHTML = '';
    
    const sortedUsers = Array.from(this.blockedUsers).sort();
    
    // Create DOM elements safely instead of using innerHTML
    sortedUsers.forEach(user => {
      // Validate and sanitize username
      if (!this.isValidUsernameFormat(user)) {
        console.warn('XBlockPopup: Invalid username format, skipping:', user);
        return;
      }
      
      const userDiv = document.createElement('div');
      userDiv.className = 'blocked-user';
      
      const userSpan = document.createElement('span');
      userSpan.textContent = '@' + user; // textContent prevents XSS
      
      const removeButton = document.createElement('button');
      removeButton.className = 'remove-user';
      removeButton.textContent = 'Remove';
      removeButton.setAttribute('data-username', user);
      
      userDiv.appendChild(userSpan);
      userDiv.appendChild(removeButton);
      blockedUsersList.appendChild(userDiv);
    });
  }

  async unblockUser(username) {
    console.log('XBlockPopup: Unblocking user', username);
    this.blockedUsers.delete(username);
    await this.saveSettings();
    await this.updateUI();
    await this.notifyContentScript();
    this.showStatus(`Unblocked @${username}`, 'info');
  }

  async notifyContentScript() {
    try {
      console.log('XBlockPopup: Notifying content script');
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab && (tab.url.includes('x.com') || tab.url.includes('twitter.com'))) {
        await chrome.tabs.sendMessage(tab.id, {
          action: 'updateBlockedUsers',
          blockedUsers: Array.from(this.blockedUsers),
          enabled: this.isEnabled
        });
        console.log('XBlockPopup: Notified content script');
      } else {
        console.log('XBlockPopup: No active X/Twitter tab found');
      }
    } catch (error) {
      console.log('XBlockPopup: No active X/Twitter tab found or content script not loaded');
    }
  }

  showStatus(message, type) {
    console.log(`XBlockPopup: Showing status [${type}]: ${message}`);
    const statusEl = document.getElementById('status');
    statusEl.textContent = message;
    statusEl.className = `status ${type}`;
    statusEl.style.display = 'block';
    
    setTimeout(() => {
      statusEl.style.display = 'none';
    }, 3000);
  }
}

console.log('XBlockPopup: Creating popup instance');
const popup = new XBlockPopup();