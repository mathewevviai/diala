/**
 * Example of how to use the Hunter search API with automatic cancellation
 * 
 * This demonstrates:
 * 1. Starting a search
 * 2. Monitoring progress with WebSocket
 * 3. Auto-cancelling on page unload/refresh
 * 4. Manual cancellation
 */

class HunterSearchClient {
  constructor(apiUrl = 'http://localhost:8000') {
    this.apiUrl = apiUrl;
    this.currentSearchId = null;
    this.websocket = null;
  }

  /**
   * Start a new lead search
   */
  async startSearch(searchConfig) {
    // Generate unique search ID
    const searchId = `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.currentSearchId = searchId;

    try {
      // Start the search
      const response = await fetch(`${this.apiUrl}/api/public/hunter/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          search_id: searchId,
          user_id: 'user123', // Your user ID
          search_config: searchConfig
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Search started:', result);

      // Connect WebSocket for monitoring
      this.connectWebSocket(searchId);

      return searchId;
    } catch (error) {
      console.error('Error starting search:', error);
      throw error;
    }
  }

  /**
   * Connect WebSocket for real-time monitoring and auto-cancellation
   */
  connectWebSocket(searchId) {
    const wsUrl = this.apiUrl.replace('http', 'ws');
    this.websocket = new WebSocket(`${wsUrl}/api/public/hunter/ws/${searchId}`);

    this.websocket.onopen = () => {
      console.log('WebSocket connected for search:', searchId);
      
      // Send heartbeat every 30 seconds
      this.heartbeatInterval = setInterval(() => {
        if (this.websocket.readyState === WebSocket.OPEN) {
          this.websocket.send('ping');
        }
      }, 30000);
    };

    this.websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('WebSocket message:', data);
      
      // Handle different message types
      if (data.type === 'status') {
        this.onSearchProgress(data);
      }
    };

    this.websocket.onclose = () => {
      console.log('WebSocket disconnected');
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval);
      }
    };

    this.websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  /**
   * Handle search progress updates
   */
  onSearchProgress(data) {
    // Override this method to handle progress updates
    console.log(`Search progress: ${data.progress}%, Leads found: ${data.leads_found}`);
  }

  /**
   * Manually cancel the current search
   */
  async cancelSearch() {
    if (!this.currentSearchId) {
      console.log('No active search to cancel');
      return;
    }

    try {
      const response = await fetch(
        `${this.apiUrl}/api/public/hunter/search/${this.currentSearchId}/cancel`,
        {
          method: 'POST',
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Search cancelled:', result);

      // Close WebSocket
      if (this.websocket) {
        this.websocket.close();
      }

      this.currentSearchId = null;
      return result;
    } catch (error) {
      console.error('Error cancelling search:', error);
      throw error;
    }
  }

  /**
   * Clean up on page unload
   */
  cleanup() {
    // Close WebSocket connection (this will trigger auto-cancellation)
    if (this.websocket) {
      this.websocket.close();
    }
  }
}

// Example usage
const searchConfig = {
  searchName: "Belfast Roofing Contractors",
  searchObjective: "Find roofing contractors in Belfast",
  selectedSources: ["web"],
  industry: "Roofing & Construction",
  location: "Belfast, Northern Ireland",
  companySize: "1-10",
  keywords: "roofing, roof repair, Belfast",
  includeEmails: true,
  includePhones: true,
  validationCriteria: {
    mustHaveWebsite: true,
    mustHaveContactInfo: true,
    mustHaveSpecificKeywords: ["roofing", "contractor", "Belfast"],
    mustBeInIndustry: true
  }
};

// Initialize client
const client = new HunterSearchClient();

// Set up auto-cancellation on page unload
window.addEventListener('beforeunload', () => {
  client.cleanup();
});

// Start search
async function runSearch() {
  try {
    const searchId = await client.startSearch(searchConfig);
    console.log('Search started with ID:', searchId);
    
    // Example: Cancel after 30 seconds
    setTimeout(async () => {
      console.log('Cancelling search after 30 seconds...');
      await client.cancelSearch();
    }, 30000);
    
  } catch (error) {
    console.error('Search failed:', error);
  }
}

// Add cancel button handler
document.getElementById('cancelButton')?.addEventListener('click', async () => {
  await client.cancelSearch();
});

// Export for use in other modules
export default HunterSearchClient;