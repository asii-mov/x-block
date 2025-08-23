/**
 * API Client for X/Twitter
 */

class XAPIClient {
  constructor() {
    // These are example tokens. In practice, we'll get them from the user's browser.
    this.BEARER_TOKEN = 'AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA';
    this.CSRF_TOKEN = '';
    this.AUTH_TOKEN = '';
    this.GUEST_ID = '';
  }

  /**
   * Get authentication tokens from the user's browser
   */
  async getAuthTokens() {
    try {
      console.log('XAPIClient: Getting auth tokens from cookies');
      // Get cookies from x.com
      const cookies = await chrome.cookies.getAll({ domain: '.x.com' });
      console.log(`XAPIClient: Retrieved ${cookies.length} cookies from .x.com`);
      
      // Log all cookie names for debugging
      console.log('XAPIClient: Cookie names:', cookies.map(c => c.name));
      
      // Extract necessary tokens
      const csrfTokenCookie = cookies.find(cookie => cookie.name === 'ct0');
      const authTokenCookie = cookies.find(cookie => cookie.name === 'auth_token');
      const guestIdCookie = cookies.find(cookie => cookie.name === 'guest_id');
      
      if (csrfTokenCookie) {
        this.CSRF_TOKEN = csrfTokenCookie.value;
        console.log('XAPIClient: Found CSRF token');
      } else {
        console.warn('XAPIClient: CSRF token (ct0) not found in cookies');
      }
      
      if (authTokenCookie) {
        this.AUTH_TOKEN = authTokenCookie.value;
        console.log('XAPIClient: Found auth token');
      } else {
        console.warn('XAPIClient: Auth token (auth_token) not found in cookies');
      }
      
      if (guestIdCookie) {
        this.GUEST_ID = guestIdCookie.value;
        console.log('XAPIClient: Found guest ID');
      } else {
        console.warn('XAPIClient: Guest ID (guest_id) not found in cookies');
      }
      
      console.log('XAPIClient: Retrieved tokens', {
        hasBearerToken: !!this.BEARER_TOKEN,
        hasCsrfToken: !!this.CSRF_TOKEN,
        hasAuthToken: !!this.AUTH_TOKEN,
        hasGuestId: !!this.GUEST_ID
      });
      
      return {
        bearerToken: this.BEARER_TOKEN,
        csrfToken: this.CSRF_TOKEN,
        authToken: this.AUTH_TOKEN,
        guestId: this.GUEST_ID
      };
    } catch (error) {
      console.error('XAPIClient: Failed to get auth tokens:', error);
      throw error;
    }
  }

  /**
   * Block a user by ID
   * @param {string} userId - The ID of the user to block
   */
  async blockUser(userId) {
    try {
      console.log(`XAPIClient: Blocking user ${userId}`);
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
      console.log('XAPIClient: Created cookie string');

      // Create headers
      const headers = new Headers();
      headers.append('Authorization', `Bearer ${tokens.bearerToken}`);
      headers.append('X-Csrf-Token', tokens.csrfToken);
      headers.append('X-Twitter-Client-Language', 'en');
      headers.append('Content-Type', 'application/x-www-form-urlencoded');
      headers.append('Cookie', cookieString);
      console.log('XAPIClient: Created headers');

      // Create request body
      const body = new URLSearchParams();
      body.append('user_id', userId);
      console.log('XAPIClient: Created request body');

      // Make the request
      console.log(`XAPIClient: Making request to block user ${userId}`);
      const response = await fetch('https://x.com/i/api/1.1/blocks/create.json', {
        method: 'POST',
        headers: headers,
        body: body,
        credentials: 'include'
      });

      console.log(`XAPIClient: Block user response status: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`XAPIClient: HTTP error! status: ${response.status}, body: ${errorText}`);
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      const data = await response.json();
      console.log(`XAPIClient: Blocked user ${userId}`, data);
      return data;
    } catch (error) {
      console.error(`XAPIClient: Failed to block user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get members of a list
   * @param {string} listId - The ID of the list
   */
  async getListMembers(listId) {
    try {
      console.log(`XAPIClient: Getting members for list ${listId}`);
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
      console.log('XAPIClient: Created cookie string for list members request');

      // Create headers
      const headers = new Headers();
      headers.append('Authorization', `Bearer ${tokens.bearerToken}`);
      headers.append('X-Csrf-Token', tokens.csrfToken);
      headers.append('X-Twitter-Client-Language', 'en');
      headers.append('Cookie', cookieString);
      console.log('XAPIClient: Created headers for list members request');

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
      console.log(`XAPIClient: Created URL for list members request: ${url}`);

      // Make the request
      console.log(`XAPIClient: Making request to get list members for list ${listId}`);
      const response = await fetch(url, {
        method: 'GET',
        headers: headers,
        credentials: 'include'
      });

      console.log(`XAPIClient: List members response status: ${response.status}`);
      
      // Log response headers for debugging
      console.log('XAPIClient: Response headers:');
      for (const [key, value] of response.headers.entries()) {
        console.log(`  ${key}: ${value}`);
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`XAPIClient: HTTP error! status: ${response.status}, body: ${errorText}`);
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('XAPIClient: Response is not JSON:', text);
        throw new Error('Response is not JSON');
      }

      const data = await response.json();
      console.log(`XAPIClient: Fetched list members for list ${listId}`, JSON.stringify(data, null, 2));
      return data;
    } catch (error) {
      console.error(`XAPIClient: Failed to fetch list members for list ${listId}:`, error);
      throw error;
    }
  }
}

// Export the class
const xApiClient = new XAPIClient();