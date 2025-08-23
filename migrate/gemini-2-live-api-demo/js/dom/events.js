import elements from './elements.js';
import settingsManager from '../settings/settings-manager.js';

/**
 * Updates UI to show disconnect button and hide connect button
 */
const showDisconnectButton = () => {
    elements.connectBtn.style.display = 'none';
    elements.disconnectBtn.style.display = 'block';
};

/**
 * Updates UI to show connect button and hide disconnect button
 */
const showConnectButton = () => {
    elements.disconnectBtn.style.display = 'none';
    elements.connectBtn.style.display = 'block';
};

let isCameraActive = false;

/**
 * Ensures the agent is connected and initialized
 * @param {GeminiAgent} agent - The main application agent instance
 * @returns {Promise<void>}
 */
const ensureAgentReady = async (agent) => {
    if (!agent.connected) {
        await agent.connect();
        showDisconnectButton();
    }
    if (!agent.initialized) {
        await agent.initialize();
    }
};

/**
 * Sets up event listeners for the application's UI elements
 * @param {GeminiAgent} agent - The main application agent instance
 */
export function setupEventListeners(agent) {
    // Disconnect handler
    elements.disconnectBtn.addEventListener('click', async () => {
        try {
            await agent.disconnect();
            showConnectButton();
            [elements.cameraBtn, elements.screenBtn, elements.micBtn].forEach(btn => btn.classList.remove('active'));
            isCameraActive = false;
        } catch (error) {
            console.error('Error disconnecting:', error);
        }
    });

    // Connect handler
    elements.connectBtn.addEventListener('click', async () => {
        try {
            await ensureAgentReady(agent);
        } catch (error) {
            console.error('Error connecting:', error);
        }
    });

    // Microphone toggle handler
    elements.micBtn.addEventListener('click', async () => {
        try {
            await ensureAgentReady(agent);
            await agent.toggleMic();
            elements.micBtn.classList.toggle('active');
        } catch (error) {
            console.error('Error toggling microphone:', error);
            elements.micBtn.classList.remove('active');
        }
    });

    // Camera toggle handler
    elements.cameraBtn.addEventListener('click', async () => {
        try {
            await ensureAgentReady(agent);
            
            if (!isCameraActive) {
                await agent.startCameraCapture();
                elements.cameraBtn.classList.add('active');
            } else {
                await agent.stopCameraCapture();
                elements.cameraBtn.classList.remove('active');
            }
            isCameraActive = !isCameraActive;
        } catch (error) {
            console.error('Error toggling camera:', error);
            elements.cameraBtn.classList.remove('active');
            isCameraActive = false;
        }
    });

    // Screen sharing handler
    let isScreenShareActive = false;
    
    // Listen for screen share stopped events (from native browser controls)
    agent.on('screenshare_stopped', () => {
        elements.screenBtn.classList.remove('active');
        isScreenShareActive = false;
        console.info('Screen share stopped');
    });

    elements.screenBtn.addEventListener('click', async () => {
        try {
            await ensureAgentReady(agent);
            
            if (!isScreenShareActive) {
                await agent.startScreenShare();
                elements.screenBtn.classList.add('active');
            } else {
                await agent.stopScreenShare();
                elements.screenBtn.classList.remove('active');
            }
            isScreenShareActive = !isScreenShareActive;
        } catch (error) {
            console.error('Error toggling screen share:', error);
            elements.screenBtn.classList.remove('active');
            isScreenShareActive = false;
        }
    });

    // Message sending handlers
    const sendMessage = async () => {
        try {
            await ensureAgentReady(agent);
            const text = elements.messageInput.value.trim();
            await agent.sendText(text);
            elements.messageInput.value = '';
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    elements.sendBtn.addEventListener('click', sendMessage);
    elements.messageInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            sendMessage();
        }
    });

    // Settings button click
    elements.settingsBtn.addEventListener('click', () => settingsManager.show());

    const apiKeyInput = document.getElementById('apiKey');
    const deepgramApiKeyInput = document.getElementById('deepgramApiKey');
    const elevenLabsApiKeyInput = document.getElementById('elevenLabsApiKey');
    const saveKeysButton = document.getElementById('saveKeys');
    const startCallButton = document.getElementById('startCallButton');

    // Initial UI state: disable message input and send button
    elements.messageInput.disabled = true;
    elements.sendBtn.disabled = true;
    if (startCallButton) startCallButton.disabled = false;

    // Event listener for Start Call button
    if (startCallButton) {
        startCallButton.addEventListener('click', () => {
            console.log("Start Call button clicked");
            agent.initiateGreeting();
            // Optionally manage button states here, or listen to 'greeting_initiated' from agent
            // For example:
            // startCallButton.disabled = true;
            // elements.messageInput.disabled = false;
            // elements.sendBtn.disabled = false;
        });
    }

    // Listen to agent events to manage UI state
    agent.on('greeting_initiated', () => {
        console.log("[DOM Events] Greeting initiated by agent.");
        if (startCallButton) startCallButton.disabled = true;
        elements.messageInput.disabled = false;
        elements.sendBtn.disabled = false;
        elements.messageInput.focus(); // Focus on the input field
    });

    agent.on('error', (errorData) => {
        console.error("[DOM Events] Agent emitted error:", errorData);
        // Potentially re-enable startCallButton if a connection error occurs during greeting initiation
        if (errorData && (errorData.type === 'connection_failed' || errorData.type === 'connection_error' || errorData.type === 'greeting_failed')) {
            if (startCallButton) startCallButton.disabled = false;
            elements.messageInput.disabled = true;
            elements.sendBtn.disabled = true;
            // Display a user-friendly error message in the chat or a status area
            const chatManager = new ChatManager(); // This is not ideal, should have a shared instance or a way to access it.
            chatManager.startModelMessage();
            chatManager.updateStreamingMessage(`Error: ${errorData.message || 'Could not start the call.'}`);
            chatManager.finalizeStreamingMessage();
        }
    });
}

// Initialize settings
settingsManager;
