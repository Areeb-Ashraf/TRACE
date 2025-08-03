# TRACE Academic Integrity Monitor - Browser Extension

This Chrome extension enhances the TRACE system's ability to monitor academic integrity during online assessments by providing real-time tab monitoring and AI tool detection.

## 🚀 **Features**

### **Enhanced Monitoring Capabilities**
- **Real-time Tab Monitoring**: Detects when students navigate to other tabs during assessments
- **AI Tool Detection**: Automatically flags visits to ChatGPT, Claude, Perplexity, Grammarly, and 20+ other AI tools
- **Suspicious Search Detection**: Monitors Google/Bing searches for academic assistance keywords
- **Tab Creation Tracking**: Logs when new tabs are opened during assessments
- **Seamless Integration**: Works automatically with the TRACE web application

### **Privacy & Security**
- Only monitors during active TRACE assessments
- No data collection outside of assessment periods
- All monitoring data stays within your institution's TRACE system
- Transparent operation with clear status indicators

## 📦 **Installation**

### **Method 1: Chrome Web Store (Recommended)**
*Coming soon - extension will be published to Chrome Web Store*

### **Method 2: Developer Mode (Current)**

1. **Download Extension Files**
   ```bash
   # Clone or download the TRACE repository
   git clone <your-trace-repo>
   cd trace/browser-extension
   ```

2. **Open Chrome Extensions**
   - Open Chrome browser
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right)

3. **Load Extension**
   - Click "Load unpacked"
   - Select the `browser-extension` folder
   - Extension should appear in your extensions list

4. **Pin Extension (Optional)**
   - Click the puzzle piece icon in Chrome toolbar
   - Pin the "TRACE Academic Integrity Monitor" extension

## 🔧 **Usage**

### **For Students**

1. **Install Extension** (one-time setup)
2. **Start Assessment** in TRACE as normal
3. **Extension Activates Automatically** when you begin an assignment
4. **Monitor Status** - Look for "Enhanced" status in the Screen Activity Monitor
5. **Complete Assessment** - Extension stops monitoring when you submit

### **Status Indicators**
- 🟢 **Enhanced**: Extension active, full monitoring enabled
- 🟡 **Basic**: Extension not available, limited monitoring only

### **What Gets Monitored**
- ✅ Tab switches during assessments
- ✅ Visits to AI tools (ChatGPT, Claude, etc.)
- ✅ Suspicious search queries
- ✅ New tab creation
- ✅ Window focus/blur events
- ✅ Clipboard activity

## 🛡️ **Privacy Information**

### **What We Monitor**
- Browser tab URLs and titles **only during active TRACE assessments**
- Tab switching behavior during assessments
- Search queries on major search engines during assessments

### **What We DON'T Monitor**
- Browsing activity outside of TRACE assessments
- Personal data or login credentials
- Content of web pages (only URLs and titles)
- Activity when TRACE is not running

### **Data Handling**
- All monitoring data is sent directly to your institution's TRACE system
- No data is stored locally in the extension
- No data is sent to third parties
- Monitoring automatically stops when assessments end

## 🔧 **Technical Details**

### **Permissions Required**
- `tabs`: Monitor tab changes and URLs during assessments
- `activeTab`: Detect active tab switches
- `storage`: Store monitoring preferences
- `background`: Run monitoring service

### **Supported Browsers**
- Chrome (recommended)
- Edge (Chromium-based)
- Other Chromium browsers

### **System Requirements**
- Chrome 88+ or equivalent Chromium browser
- Active internet connection
- Access to TRACE assessment system

## 🚨 **Troubleshooting**

### **Extension Not Working**
1. Check that extension is enabled in `chrome://extensions/`
2. Refresh the TRACE page
3. Look for "Enhanced" status in Screen Activity Monitor
4. Check browser console for error messages

### **"Basic" Mode Only**
- Extension may not be installed or enabled
- Try refreshing the TRACE page
- Reinstall extension if needed

### **False Positives**
- Extension may flag legitimate research tabs
- Review flagged activities in the analysis dashboard
- Contact your instructor if you believe monitoring was incorrect

## 📞 **Support**

For technical support or questions:
- Contact your institution's IT support
- Check TRACE system documentation
- Report issues through your institution's support channels

## 🔄 **Updates**

The extension will automatically update when new versions are available through the Chrome Web Store. For developer installations, you'll need to manually update the files and reload the extension.

---

**Note**: This extension is designed to work exclusively with the TRACE Academic Integrity System and will only activate during official assessments. 