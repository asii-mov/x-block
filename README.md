# X-Block

X-Block is a browser extension that helps you filter content on X (formerly Twitter) by blocking users from lists. It allows you to paste in X list URLs and automatically blocks everyone in that list, helping you avoid scammers and unwanted content.

![X-Block Demo](demo.gif)

## Features

- **Automated List Processing**: Paste X/Twitter list URLs and automatically fetch all members
- **Configurable Timing**: Set custom delays between blocking requests (5-60 seconds)
- **Real-time Content Filtering**: Hide tweets and profiles from blocked users on X.com
- **Username Display**: View actual usernames (e.g., @johndoe) instead of cryptic user IDs
- **Export Functionality**: Export your blocked users list to a text file
- **Secure Design**: Built with modern security practices to prevent attacks

## Installation

### Chrome/Edge/Chromium-based browsers

1. Download or clone this repository to your local machine.
2. Open your browser and navigate to `chrome://extensions`.
3. Enable "Developer mode" (usually a toggle in the top right corner).
4. Click "Load unpacked" (or "Load extension" in some browsers).
5. Select the directory where you downloaded/cloned this repository.
6. The X-Block extension should now appear in your toolbar.

### Firefox

Firefox has limited support for Manifest V3 extensions, which this extension uses. For the best experience, we recommend using Chrome, Edge, or another Chromium-based browser.

If you'd like to try it in Firefox:

1. Download or clone this repository to your local machine.
2. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`.
3. Click "Load Temporary Add-on".
4. Select the `manifest.json` file from the directory where you downloaded/cloned this repository.
5. The X-Block extension should now appear in your toolbar.

Note: As a temporary add-on, it will be removed when you restart Firefox.

## Usage

### Step-by-Step Guide

1. **Open the Extension**: Click the X-Block icon (🚫X) in your browser toolbar.

2. **Process X Lists**:
   - Paste X/Twitter list URLs into the text area (e.g., `https://x.com/i/lists/1959226884484730976/members`)
   - Click **"Process Lists"** to fetch all members from those lists
   - Status will show: *"Queued X users for blocking"*

3. **Configure Timing** (Optional):
   - Use the sliders to set minimum and maximum delay between blocks (5-60 seconds)
   - Default: 5-20 seconds (recommended to avoid rate limiting)

4. **Block Users**:
   - Click **"Block Users"** (button will show how many users are queued)
   - Extension will block users via X's API with randomized delays
   - **"Blocked Users"** section will populate with actual usernames as they're blocked

5. **Content Filtering**:
   - Navigate to X.com - content from blocked users is automatically hidden
   - Toggle the extension on/off using the switch in the popup

6. **Manage Your List**:
   - **View**: See actually blocked users (with real usernames like @johndoe)
   - **Export**: Download your blocked users list as a text file
   - **Remove**: Click "Remove" next to any user to unblock them
   - **Clear All**: Remove all queued and blocked users

### Important Notes

- **"Blocked Users" section only shows users actually blocked via API** (not just queued)
- Users must be logged into X.com for the extension to work
- Large lists may take time to process due to rate limiting

## Development

This extension is built with:
- JavaScript
- HTML/CSS
- Chrome Extension APIs (Manifest V3)

To modify the extension:
1. Make your changes to the files in this directory.
2. In `chrome://extensions`, click the refresh icon on the X-Block extension card to reload it.

### Project Structure

- `manifest.json`: Extension configuration and permissions
- `popup.html/css/js`: The extension popup UI with timing controls
- `content.js`: Content script that runs on X.com to hide blocked content
- `background.js`: Background script for processing lists and blocking users via API
- `apiClient.js`: Handles authenticated API interactions with X/Twitter
- `listProcessor.js`: Processes list URLs and extracts user IDs safely
- `icons/`: Extension icons with X + prohibition symbol design
- `QWEN.md`: Project overview and architecture documentation

### Troubleshooting

**Common Issues:**

1. **"No users queued for blocking"**
   - You need to process lists first before blocking
   - Make sure list URLs are valid X/Twitter list URLs

2. **"Successfully processed lists. Queued 0 users"**
   - Make sure you're logged into X.com
   - The extension needs access to your X.com cookies
   - List might be private or empty
   - Check if the list URL format is correct

3. **Extension not blocking users**
   - Verify you're logged into X.com
   - Check that the extension toggle is enabled
   - Try reloading the extension in `chrome://extensions`

4. **Users not showing in "Blocked Users" section**
   - Only users successfully blocked via API appear here
   - Users are queued first, then moved to blocked after API success

**Debug Console Logs:**
- **Popup logs**: Right-click extension icon → "Inspect popup"
- **Background logs**: `chrome://extensions` → "Inspect views" → "background.js"
- **Content logs**: Open DevTools on X.com page

This app was barely tested, open an issue if you face an issue.

## Privacy

- **Local Processing**: All data is processed locally in your browser
- **No Data Collection**: The extension doesn't collect or send your data to external servers
- **Cookie Access**: Uses your X.com authentication cookies only for API requests

## Limitations

- **Rate Limiting**: Blocking large lists takes time due to API rate limits and safety delays
- **Login Required**: You must be logged into X.com for the extension to work
- **API Dependencies**: X may change their API endpoints which could affect functionality
- **Browser Support**: Optimized for Chrome/Edge (limited Firefox support due to Manifest V3)

## Disclaimer

**Important**: This extension is not affiliated with, endorsed by, or connected to X (Twitter). 

- Use at your own risk and responsibility
- Automated blocking of large numbers of users might violate X's Terms of Service
- The extension is provided "as-is" without warranties
- Users are responsible for compliance with X's platform rules
