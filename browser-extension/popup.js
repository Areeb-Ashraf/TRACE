// Popup script for TRACE Academic Integrity Monitor
document.addEventListener('DOMContentLoaded', async () => {
  const statusElement = document.getElementById('status');
  const statusTextElement = document.getElementById('status-text');
  const activityCountElement = document.getElementById('activity-count');

  try {
    // Get current monitoring status from background script
    const response = await chrome.runtime.sendMessage({ action: 'getStatus' });
    
    if (response) {
      updateStatus(response.isMonitoring, response.activities || []);
    } else {
      updateStatus(false, []);
    }
  } catch (error) {
    console.error('Error getting status:', error);
    updateStatus(false, []);
  }

  function updateStatus(isMonitoring, activities) {
    if (isMonitoring) {
      statusElement.className = 'status active';
      statusTextElement.textContent = 'Monitoring Active';
    } else {
      statusElement.className = 'status inactive';
      statusTextElement.textContent = 'Monitoring Inactive';
    }
    
    activityCountElement.textContent = activities.length;
  }

  // Update status every 2 seconds while popup is open
  setInterval(async () => {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getStatus' });
      if (response) {
        updateStatus(response.isMonitoring, response.activities || []);
      }
    } catch (error) {
      // Background script might not be ready
    }
  }, 2000);
}); 