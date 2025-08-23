/**
 * List Processor for X/Twitter
 */

// We'll import the API client in a way that works with the extension
// For now, we'll assume it's available globally

class XListProcessor {
  /**
   * Extract list ID from a Twitter/X list URL
   * @param {string} url - The URL of the list
   * @returns {string|null} - The list ID or null if not found
   */
  extractListId(url) {
    try {
      console.log('XListProcessor: Extracting list ID from URL:', url);
      // Match patterns like:
      // https://x.com/i/lists/1959226884484730976/members
      // https://x.com/i/lists/1959226884484730976
      const match = url.match(/\/i\/lists\/(\d+)/);
      const listId = match ? match[1] : null;
      console.log('XListProcessor: Extracted list ID:', listId);
      return listId;
    } catch (error) {
      console.error('XListProcessor: Failed to extract list ID from URL:', url, error);
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
      console.log('XListProcessor: Processing list URL:', listUrl);
      const listId = this.extractListId(listUrl);
      if (!listId) {
        throw new Error(`Invalid list URL: ${listUrl}`);
      }

      console.log(`XListProcessor: Processing list URL ${listUrl} with ID ${listId}`);
      
      // Import the API client
      // In a real implementation, we would do:
      // For now, we'll use a simplified approach since we can't directly import in this context
      console.log('XListProcessor: Would call xApiClient.getListMembers here in a real implementation');
      
      // For now, return an empty array since we can't directly use the API client
      return [];
    } catch (error) {
      console.error('XListProcessor: Failed to process list URL:', listUrl, error);
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
      console.log('XListProcessor: Extracting user IDs from list data');
      const userIds = [];
      
      // Log the structure of the received data
      console.log('XListProcessor: List data structure:', Object.keys(listData || {}));
      
      // Navigate the GraphQL response structure to find user IDs
      // This is a simplified example - the actual structure might be different
      if (listData && listData.data) {
        console.log('XListProcessor: Found data property in response');
        
        // Log the structure of data
        console.log('XListProcessor: Data structure:', Object.keys(listData.data));
        
        if (listData.data.list) {
          console.log('XListProcessor: Found list property in data');
          
          // Log the structure of list
          console.log('XListProcessor: List structure:', Object.keys(listData.data.list));
          
          if (listData.data.list.members_timeline) {
            console.log('XListProcessor: Found members_timeline property in list');
            
            // Log the structure of members_timeline
            console.log('XListProcessor: Members timeline structure:', Object.keys(listData.data.list.members_timeline));
            
            if (listData.data.list.members_timeline.timeline) {
              console.log('XListProcessor: Found timeline property in members_timeline');
              
              // Log the structure of timeline
              console.log('XListProcessor: Timeline structure:', Object.keys(listData.data.list.members_timeline.timeline));
              
              if (listData.data.list.members_timeline.timeline.instructions) {
                console.log('XListProcessor: Found instructions property in timeline');
                
                const instructions = listData.data.list.members_timeline.timeline.instructions;
                console.log(`XListProcessor: Found ${instructions.length} instructions`);
                
                for (const instruction of instructions) {
                  if (instruction.type === 'TimelineAddEntries' && instruction.entries) {
                    console.log(`XListProcessor: Found TimelineAddEntries instruction with ${instruction.entries.length} entries`);
                    
                    for (const entry of instruction.entries) {
                      if (entry.entryId && entry.entryId.startsWith('user-')) {
                        // Extract the user ID from entryId (e.g., "user-12345" -> "12345")
                        const userId = entry.entryId.replace('user-', '');
                        if (userId) {
                          userIds.push(userId);
                          console.log(`XListProcessor: Found user ID ${userId} from entry ${entry.entryId}`);
                        }
                      }
                    }
                  }
                }
              } else {
                console.warn('XListProcessor: No instructions found in timeline');
              }
            } else {
              console.warn('XListProcessor: No timeline found in members_timeline');
            }
          } else {
            console.warn('XListProcessor: No members_timeline found in list');
          }
        } else {
          console.warn('XListProcessor: No list found in data');
        }
      } else {
        console.warn('XListProcessor: No data found in listData or listData is null');
      }
      
      console.log(`XListProcessor: Extracted ${userIds.length} user IDs from list data`);
      return userIds;
    } catch (error) {
      console.error('XListProcessor: Failed to extract user IDs from list data:', error);
      return [];
    }
  }
}

// Export the class
const xListProcessor = new XListProcessor();