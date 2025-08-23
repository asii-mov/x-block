/**
 * Background script for X-Block
 */

// Simplified API client implementation for debugging
class SimpleAPIClient {
  constructor() {
    this.BEARER_TOKEN = 'AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA';
    // Whitelist of allowed hosts to prevent DNS rebinding
    this.ALLOWED_HOSTS = ['x.com', 'twitter.com'];
  }

  /**
   * Validate URL to prevent DNS rebinding and SSRF attacks
   * @param {string} url - URL to validate
   * @returns {boolean} - Whether URL is safe
   */
  validateURL(url) {
    try {
      const urlObj = new URL(url);
      
      // Only allow HTTPS protocol
      if (urlObj.protocol !== 'https:') {
        console.error('SimpleAPIClient: Invalid protocol, only HTTPS allowed:', urlObj.protocol);
        return false;
      }
      
      // Check if hostname is in whitelist
      if (!this.ALLOWED_HOSTS.includes(urlObj.hostname)) {
        console.error('SimpleAPIClient: Host not in whitelist:', urlObj.hostname);
        return false;
      }
      
      // Reject URLs with authentication info to prevent credential leakage
      if (urlObj.username || urlObj.password) {
        console.error('SimpleAPIClient: URLs with credentials not allowed');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('SimpleAPIClient: Invalid URL format:', error);
      return false;
    }
  }

  /**
   * Get authentication tokens from the user's browser
   */
  async getAuthTokens() {
    try {
      console.log('SimpleAPIClient: Getting auth tokens from cookies');
      // Get cookies from x.com
      const cookies = await chrome.cookies.getAll({ domain: '.x.com' });
      console.log(`SimpleAPIClient: Retrieved ${cookies.length} cookies from .x.com`);
      
      // Log all cookie names for debugging
      console.log('SimpleAPIClient: Cookie names:', cookies.map(c => c.name));
      
      // Extract necessary tokens
      const csrfTokenCookie = cookies.find(cookie => cookie.name === 'ct0');
      const authTokenCookie = cookies.find(cookie => cookie.name === 'auth_token');
      const guestIdCookie = cookies.find(cookie => cookie.name === 'guest_id');
      
      const csrfToken = csrfTokenCookie ? csrfTokenCookie.value : '';
      const authToken = authTokenCookie ? authTokenCookie.value : '';
      const guestId = guestIdCookie ? guestIdCookie.value : '';
      
      console.log('SimpleAPIClient: Retrieved tokens', {
        hasBearerToken: !!this.BEARER_TOKEN,
        hasCsrfToken: !!csrfToken,
        hasAuthToken: !!authToken,
        hasGuestId: !!guestId
      });
      
      return {
        bearerToken: this.BEARER_TOKEN,
        csrfToken: csrfToken,
        authToken: authToken,
        guestId: guestId
      };
    } catch (error) {
      console.error('SimpleAPIClient: Failed to get auth tokens:', error);
      throw error;
    }
  }

  /**
   * Validate list ID format to prevent injection attacks
   * @param {string} listId - The list ID to validate
   * @returns {boolean} - Whether the list ID is valid
   */
  validateListId(listId) {
    if (typeof listId !== 'string') return false;
    // Twitter list IDs are numeric strings, typically 18-19 digits
    return /^\d{10,20}$/.test(listId);
  }

  /**
   * Validate user ID format to prevent injection attacks
   * @param {string} userId - The user ID to validate
   * @returns {boolean} - Whether the user ID is valid
   */
  validateUserId(userId) {
    if (typeof userId !== 'string') return false;
    // Twitter user IDs are numeric strings
    return /^\d{1,20}$/.test(userId);
  }

  /**
   * Get members of a list
   * @param {string} listId - The ID of the list
   */
  async getListMembers(listId) {
    try {
      console.log(`SimpleAPIClient: Getting members for list ${listId}`);
      
      // Validate list ID format
      if (!this.validateListId(listId)) {
        throw new Error(`Invalid list ID format: ${listId}`);
      }
      
      const tokens = await this.getAuthTokens();
      
      // Check if we have all necessary tokens
      if (!tokens.csrfToken || !tokens.authToken || !tokens.guestId) {
        throw new Error('Missing authentication tokens');
      }
      
      // Create cookie string
      const cookieString = [
        `guest_id=${tokens.guestId}`,
        `auth_token=${tokens.authToken}`,
        `ct0=${tokens.csrfToken}`
      ].join('; ');
      console.log('SimpleAPIClient: Created cookie string for list members request');

      // Create headers
      const headers = new Headers();
      headers.append('Authorization', `Bearer ${tokens.bearerToken}`);
      headers.append('X-Csrf-Token', tokens.csrfToken);
      headers.append('X-Twitter-Client-Language', 'en');
      headers.append('Cookie', cookieString);
      console.log('SimpleAPIClient: Created headers for list members request');

      // Create URL with parameters
      const variables = JSON.stringify({
        listId: listId,
        count: 20000000 // A large number to get all members
      });
      
      const features = JSON.stringify({
        "rweb_video_screen_enabled": false,
        "payments_enabled": false,
        "rweb_xchat_enabled": false,
        "profile_label_improvements_pcf_label_in_post_enabled": false,
        "rweb_tipjar_consumption_enabled": false,
        "verified_phone_label_enabled": false,
        "creator_subscriptions_tweet_preview_api_enabled": false,
        "responsive_web_graphql_timeline_navigation_enabled": false,
        "responsive_web_graphql_skip_user_profile_image_extensions_enabled": false,
        "premium_content_api_read_enabled": false,
        "communities_web_enable_tweet_community_results_fetch": false,
        "c9s_tweet_anatomy_moderator_badge_enabled": false,
        "responsive_web_grok_analyze_button_fetch_trends_enabled": false,
        "responsive_web_grok_analyze_post_followups_enabled": false,
        "responsive_web_jetfuel_frame": false,
        "responsive_web_grok_share_attachment_enabled": false,
        "articles_preview_enabled": false,
        "responsive_web_edit_tweet_api_enabled": false,
        "graphql_is_translatable_rweb_tweet_is_translatable_enabled": false,
        "view_counts_everywhere_api_enabled": false,
        "longform_notetweets_consumption_enabled": false,
        "responsive_web_twitter_article_tweet_consumption_enabled": false,
        "tweet_awards_web_tipping_enabled": false,
        "responsive_web_grok_show_grok_translated_post": false,
        "responsive_web_grok_analysis_button_from_backend": false,
        "creator_subscriptions_quote_tweet_preview_enabled": false,
        "freedom_of_speech_not_reach_fetch_enabled": false,
        "standardized_nudges_misinfo": false,
        "tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled": false,
        "longform_notetweets_rich_text_read_enabled": false,
        "longform_notetweets_inline_media_enabled": false,
        "responsive_web_grok_image_annotation_enabled": false,
        // Additional required features from the error message
        "responsive_web_enhance_cards_enabled": false,
        "responsive_web_grok_community_note_auto_translation_is_enabled": false,
        "responsive_web_grok_imagine_annotation_enabled": false
      });

      const url = `https://x.com/i/api/graphql/naea_MSad4pOb-D6_oVv_g/ListMembers?variables=${encodeURIComponent(variables)}&features=${encodeURIComponent(features)}`;
      console.log(`SimpleAPIClient: Created URL for list members request: ${url}`);

      // Validate URL before making request
      if (!this.validateURL(url)) {
        throw new Error('Invalid or unsafe URL');
      }

      // Make the request
      console.log(`SimpleAPIClient: Making request to get list members for list ${listId}`);
      const response = await fetch(url, {
        method: 'GET',
        headers: headers,
        credentials: 'include'
      });

      console.log(`SimpleAPIClient: List members response status: ${response.status}`);
      
      // Log response headers for debugging
      console.log('SimpleAPIClient: Response headers:');
      for (const [key, value] of response.headers.entries()) {
        console.log(`  ${key}: ${value}`);
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`SimpleAPIClient: HTTP error! status: ${response.status}, body: ${errorText}`);
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('SimpleAPIClient: Response is not JSON:', text);
        throw new Error('Response is not JSON');
      }

      const data = await response.json();
      console.log(`SimpleAPIClient: Fetched list members for list ${listId}`, JSON.stringify(data, null, 2));
      return data;
    } catch (error) {
      console.error(`SimpleAPIClient: Failed to fetch list members for list ${listId}:`, error);
      throw error;
    }
  }

  /**
   * Block a user by ID
   * @param {string} userId - The ID of the user to block
   */
  async blockUser(userId) {
    try {
      console.log(`SimpleAPIClient: Blocking user ${userId}`);
      
      // Validate user ID format
      if (!this.validateUserId(userId)) {
        throw new Error(`Invalid user ID format: ${userId}`);
      }
      
      const tokens = await this.getAuthTokens();
      
      // Check if we have all necessary tokens
      if (!tokens.csrfToken || !tokens.authToken || !tokens.guestId) {
        throw new Error('Missing authentication tokens');
      }
      
      // Create cookie string
      const cookieString = [
        `guest_id=${tokens.guestId}`,
        `auth_token=${tokens.authToken}`,
        `ct0=${tokens.csrfToken}`
      ].join('; ');
      console.log('SimpleAPIClient: Created cookie string for blocking request');

      // Create headers
      const headers = new Headers();
      headers.append('Authorization', `Bearer ${tokens.bearerToken}`);
      headers.append('X-Csrf-Token', tokens.csrfToken);
      headers.append('X-Twitter-Client-Language', 'en');
      headers.append('Content-Type', 'application/x-www-form-urlencoded');
      headers.append('Cookie', cookieString);
      console.log('SimpleAPIClient: Created headers for blocking request');

      // Create request body
      const body = new URLSearchParams();
      body.append('user_id', userId);
      console.log('SimpleAPIClient: Created request body for blocking request');

      const blockUrl = 'https://x.com/i/api/1.1/blocks/create.json';
      
      // Validate URL before making request
      if (!this.validateURL(blockUrl)) {
        throw new Error('Invalid or unsafe URL');
      }

      // Make the request
      console.log(`SimpleAPIClient: Making request to block user ${userId}`);
      const response = await fetch(blockUrl, {
        method: 'POST',
        headers: headers,
        body: body,
        credentials: 'include'
      });

      console.log(`SimpleAPIClient: Block user response status: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`SimpleAPIClient: HTTP error! status: ${response.status}, body: ${errorText}`);
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      const data = await response.json();
      console.log(`SimpleAPIClient: Blocked user ${userId}`, data);
      return data;
    } catch (error) {
      console.error(`SimpleAPIClient: Failed to block user ${userId}:`, error);
      throw error;
    }
  }
}

// Simplified list processor implementation for debugging
class SimpleListProcessor {
  /**
   * Validate list URL format and extract list ID safely
   * @param {string} url - The URL of the list
   * @returns {string|null} - The list ID or null if not found/invalid
   */
  extractListId(url) {
    try {
      console.log('SimpleListProcessor: Extracting list ID from URL:', url);
      
      // Validate URL format first
      if (typeof url !== 'string' || url.length > 2048) {
        console.error('SimpleListProcessor: Invalid URL format or too long');
        return null;
      }
      
      // Parse URL to validate structure
      const urlObj = new URL(url);
      
      // Only allow x.com and twitter.com
      if (!['x.com', 'twitter.com'].includes(urlObj.hostname)) {
        console.error('SimpleListProcessor: Invalid hostname:', urlObj.hostname);
        return null;
      }
      
      // Only allow HTTPS
      if (urlObj.protocol !== 'https:') {
        console.error('SimpleListProcessor: Only HTTPS URLs allowed');
        return null;
      }
      
      // Match patterns like:
      // https://x.com/i/lists/1959226884484730976/members
      // https://x.com/i/lists/1959226884484730976
      const match = urlObj.pathname.match(/^\/i\/lists\/(\d{10,20})(?:\/.*)?$/);
      const listId = match ? match[1] : null;
      
      console.log('SimpleListProcessor: Extracted list ID:', listId);
      return listId;
    } catch (error) {
      console.error('SimpleListProcessor: Failed to extract list ID from URL:', url, error);
      return null;
    }
  }

  /**
   * Process a list URL to get user IDs
   * @param {string} listUrl - The URL of the list
   * @returns {Promise<Array<string>>} - Array of user IDs
   */
  async processListUrl(listUrl) {
    try {
      console.log('SimpleListProcessor: Processing list URL:', listUrl);
      const listId = this.extractListId(listUrl);
      if (!listId) {
        throw new Error(`Invalid list URL: ${listUrl}`);
      }

      console.log(`SimpleListProcessor: Processing list URL ${listUrl} with ID ${listId}`);
      
      // Create API client instance
      const apiClient = new SimpleAPIClient();
      
      // Get list members
      const listData = await apiClient.getListMembers(listId);
      console.log('SimpleListProcessor: Received list data:', JSON.stringify(listData, null, 2));
      
      const userIds = this.extractUserIdsFromListData(listData);
      console.log(`SimpleListProcessor: Extracted ${userIds.length} user IDs from list data`);
      return userIds;
    } catch (error) {
      console.error('SimpleListProcessor: Failed to process list URL:', listUrl, error);
      throw error;
    }
  }

  /**
   * Extract user IDs from list data
   * @param {Object} listData - The data returned from the list members API
   * @returns {Array<string>} - Array of user IDs
   */
  extractUserIdsFromListData(listData) {
    try {
      console.log('SimpleListProcessor: Extracting user IDs from list data');
      const userIds = [];
      
      // Log the structure of the received data
      console.log('SimpleListProcessor: List data structure:', Object.keys(listData || {}));
      
      // Navigate the GraphQL response structure to find user IDs
      // This is a simplified example - the actual structure might be different
      if (listData && listData.data) {
        console.log('SimpleListProcessor: Found data property in response');
        
        // Log the structure of data
        console.log('SimpleListProcessor: Data structure:', Object.keys(listData.data));
        
        if (listData.data.list) {
          console.log('SimpleListProcessor: Found list property in data');
          
          // Log the structure of list
          console.log('SimpleListProcessor: List structure:', Object.keys(listData.data.list));
          
          if (listData.data.list.members_timeline) {
            console.log('SimpleListProcessor: Found members_timeline property in list');
            
            // Log the structure of members_timeline
            console.log('SimpleListProcessor: Members timeline structure:', Object.keys(listData.data.list.members_timeline));
            
            if (listData.data.list.members_timeline.timeline) {
              console.log('SimpleListProcessor: Found timeline property in members_timeline');
              
              // Log the structure of timeline
              console.log('SimpleListProcessor: Timeline structure:', Object.keys(listData.data.list.members_timeline.timeline));
              
              if (listData.data.list.members_timeline.timeline.instructions) {
                console.log('SimpleListProcessor: Found instructions property in timeline');
                
                const instructions = listData.data.list.members_timeline.timeline.instructions;
                console.log(`SimpleListProcessor: Found ${instructions.length} instructions`);
                
                for (const instruction of instructions) {
                  if (instruction.type === 'TimelineAddEntries' && instruction.entries) {
                    console.log(`SimpleListProcessor: Found TimelineAddEntries instruction with ${instruction.entries.length} entries`);
                    
                    for (const entry of instruction.entries) {
                      if (entry.entryId && entry.entryId.startsWith('user-')) {
                        // Extract the user ID from entryId (e.g., "user-12345" -> "12345")
                        const userId = entry.entryId.replace('user-', '');
                        if (userId) {
                          userIds.push(userId);
                          console.log(`SimpleListProcessor: Found user ID ${userId} from entry ${entry.entryId}`);
                        }
                      }
                    }
                  }
                }
              } else {
                console.warn('SimpleListProcessor: No instructions found in timeline');
              }
            } else {
              console.warn('SimpleListProcessor: No timeline found in members_timeline');
            }
          } else {
            console.warn('SimpleListProcessor: No members_timeline found in list');
          }
        } else {
          console.warn('SimpleListProcessor: No list found in data');
        }
      } else {
        console.warn('SimpleListProcessor: No data found in listData or listData is null');
      }
      
      console.log(`SimpleListProcessor: Extracted ${userIds.length} user IDs from list data`);
      return userIds;
    } catch (error) {
      console.error('SimpleListProcessor: Failed to extract user IDs from list data:', error);
      return [];
    }
  }
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background script received message:', message);
  
  // Handle processing a list URL
  if (message.action === 'processListUrl') {
    console.log('Background script: Processing list URLs', message.listUrls);
    
    // Process the list URLs
    processListUrls(message.listUrls)
      .then(result => {
        console.log('Background script: Process list URLs result', result);
        sendResponse(result);
      })
      .catch(error => {
        console.error('Background script: Error processing list URLs', error);
        sendResponse({
          success: false,
          error: error.message
        });
      });
    
    // Return true to indicate we'll send a response asynchronously
    return true;
  }
  
  // Handle blocking users
  if (message.action === 'blockUsers') {
    console.log('Background script: Blocking users', message.userIds, 'with timing', message.minDelay, '-', message.maxDelay, 'ms');
    
    // Block the users with custom timing parameters
    blockUsers(message.userIds, message.minDelay, message.maxDelay)
      .then(result => {
        console.log('Background script: Block users result', result);
        sendResponse(result);
      })
      .catch(error => {
        console.error('Background script: Error blocking users', error);
        sendResponse({
          success: false,
          error: error.message
        });
      });
    
    // Return true to indicate we'll send a response asynchronously
    return true;
  }
});

/**
 * Process list URLs to extract user IDs
 * @param {Array<string>} listUrls - Array of list URLs
 * @returns {Promise<Object>} - Result object
 */
async function processListUrls(listUrls) {
  try {
    console.log('Background script: Starting to process list URLs', listUrls);
    
    // Create list processor instance
    const listProcessor = new SimpleListProcessor();
    
    const allUserIds = [];
    
    for (const listUrl of listUrls) {
      try {
        console.log(`Background script: Processing list URL: ${listUrl}`);
        
        // Process the list URL
        const userIds = await listProcessor.processListUrl(listUrl);
        console.log(`Background script: Found ${userIds.length} user IDs in list ${listUrl}`);
        
        // Add to all user IDs
        allUserIds.push(...userIds);
      } catch (error) {
        console.error(`Background script: Error processing list URL ${listUrl}:`, error);
      }
    }
    
    console.log(`Background script: Processed ${listUrls.length} list URLs, found ${allUserIds.length} user IDs`);
    
    return {
      success: true,
      userIds: allUserIds
    };
  } catch (error) {
    console.error('Background script: Error in processListUrls:', error);
    throw error;
  }
}

/**
 * Generate random delay between specified min and max milliseconds
 * @param {number} minDelay - Minimum delay in milliseconds
 * @param {number} maxDelay - Maximum delay in milliseconds  
 * @returns {number} - Random delay in milliseconds
 */
function getRandomDelay(minDelay = 5000, maxDelay = 20000) {
  const delay = Math.random() * (maxDelay - minDelay) + minDelay;
  return Math.floor(delay);
}

/**
 * Block users by ID using the actual X API
 * @param {Array<string>} userIds - Array of user IDs to block
 * @param {number} minDelay - Minimum delay in milliseconds (default: 5000)
 * @param {number} maxDelay - Maximum delay in milliseconds (default: 20000)
 * @returns {Promise<Object>} - Result object
 */
async function blockUsers(userIds, minDelay = 5000, maxDelay = 20000) {
  try {
    console.log('Background script: Starting to block users', userIds);
    
    // Create API client instance
    const apiClient = new SimpleAPIClient();
    
    let blockedCount = 0;
    let failedCount = 0;
    const blockedUsernames = [];
    
    for (let i = 0; i < userIds.length; i++) {
      const userId = userIds[i];
      
      try {
        console.log(`Background script: Blocking user ${userId} (${i + 1}/${userIds.length})`);
        
        // Call the actual API to block the user
        const blockResponse = await apiClient.blockUser(userId);
        blockedCount++;
        
        // Extract username from the response
        if (blockResponse && blockResponse.screen_name) {
          blockedUsernames.push(blockResponse.screen_name);
          console.log(`Background script: Successfully blocked user ${userId} (username: ${blockResponse.screen_name})`);
        } else {
          // Fallback to using the user ID if screen_name is not available
          blockedUsernames.push(userId);
          console.log(`Background script: Successfully blocked user ${userId} (screen_name not found in response)`);
        }
        
        // Add randomized delay between requests (except for the last user)
        if (i < userIds.length - 1) {
          const delay = getRandomDelay(minDelay, maxDelay);
          console.log(`Background script: Waiting ${(delay / 1000).toFixed(1)} seconds before next request (range: ${minDelay/1000}-${maxDelay/1000}s)`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        
      } catch (error) {
        console.error(`Background script: Error blocking user ${userId}:`, error);
        failedCount++;
      }
    }
    
    console.log(`Background script: Blocking completed - ${blockedCount} successful, ${failedCount} failed out of ${userIds.length} total`);
    console.log(`Background script: Successfully blocked usernames:`, blockedUsernames);
    
    return {
      success: true,
      blockedCount: blockedCount,
      failedCount: failedCount,
      totalCount: userIds.length,
      blockedUsernames: blockedUsernames
    };
  } catch (error) {
    console.error('Background script: Error in blockUsers:', error);
    throw error;
  }
}