// QueryBee Standalone Widget - Can be embedded on any website
(function() {
    'use strict';
    
    // Widget Configuration
    const CONFIG = {
        API_BASE: 'https://query-bee-mauve.vercel.app',
        WIDGET_ID: 'querybee-widget-standalone',
        TOGGLE_ID: 'querybee-toggle-standalone',
        CONTAINER_ID: 'querybee-container-standalone'
    };
    
    // Widget HTML Structure
    const WIDGET_HTML = `
        <div id="${CONFIG.WIDGET_ID}" class="querybee-widget" style="position: fixed; bottom: 20px; right: 20px; z-index: 9999;">
            <!-- Chat Toggle Button -->
            <div id="${CONFIG.TOGGLE_ID}" class="querybee-toggle" style="
                width: 60px; 
                height: 60px; 
                background: linear-gradient(135deg, #00a8cc, #0077be);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                box-shadow: 0 4px 12px rgba(0, 168, 204, 0.3);
                transition: all 0.3s ease;
            ">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
            </div>
            
            <!-- Chat Container -->
            <div id="${CONFIG.CONTAINER_ID}" class="querybee-container" style="
                position: absolute;
                bottom: 80px;
                right: 0;
                width: 380px;
                height: 500px;
                background: white;
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
                display: none;
                flex-direction: column;
                overflow: hidden;
                border: 1px solid #e1e5e9;
            ">
                <!-- Chat Header -->
                <div class="querybee-header" style="
                    background: linear-gradient(135deg, #00a8cc, #0077be);
                    color: white;
                    padding: 16px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                ">
                    <div>
                        <h3 style="margin: 0; font-size: 16px; font-weight: 600;">QueryBee</h3>
                        <p style="margin: 0; font-size: 12px; opacity: 0.9;">College Assistant</p>
                    </div>
                    <button class="querybee-close" style="
                        background: none;
                        border: none;
                        color: white;
                        cursor: pointer;
                        font-size: 20px;
                        padding: 0;
                        width: 24px;
                        height: 24px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    ">×</button>
                </div>
                
                <!-- Chat Messages -->
                <div class="querybee-messages" style="
                    flex: 1;
                    padding: 16px;
                    overflow-y: auto;
                    background: #f8f9fa;
                ">
                    <div class="querybee-message bot" style="
                        background: white;
                        padding: 12px;
                        border-radius: 8px;
                        margin-bottom: 12px;
                        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
                    ">
                        <strong>QueryBee:</strong> Hello! I'm your college assistant. How can I help you today?
                    </div>
                </div>
                
                <!-- Chat Input -->
                <div class="querybee-input" style="
                    padding: 16px;
                    border-top: 1px solid #e1e5e9;
                    background: white;
                ">
                    <div style="display: flex; gap: 8px;">
                        <input type="text" class="querybee-input-field" placeholder="Type your message..." style="
                            flex: 1;
                            padding: 12px;
                            border: 1px solid #e1e5e9;
                            border-radius: 6px;
                            font-size: 14px;
                            outline: none;
                        ">
                        <button class="querybee-send" style="
                            background: linear-gradient(135deg, #00a8cc, #0077be);
                            color: white;
                            border: none;
                            border-radius: 6px;
                            padding: 12px 16px;
                            cursor: pointer;
                            font-size: 14px;
                            font-weight: 500;
                        ">Send</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Inject Widget CSS
    const WIDGET_CSS = `
        .querybee-toggle:hover {
            transform: scale(1.1);
            box-shadow: 0 6px 20px rgba(0, 168, 204, 0.4);
        }
        
        .querybee-container {
            animation: slideUp 0.3s ease;
        }
        
        @keyframes slideUp {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .querybee-message.user {
            background: linear-gradient(135deg, #00a8cc, #0077be);
            color: white;
            margin-left: auto;
            text-align: right;
        }
        
        .querybee-message.typing {
            opacity: 0.7;
        }
        
        .querybee-message.typing::after {
            content: '...';
            animation: typing 1.5s infinite;
        }
        
        @keyframes typing {
            0%, 60%, 100% { opacity: 1; }
            30% { opacity: 0.3; }
        }
    `;
    
    // Initialize Widget
    function initWidget() {
        // Check if widget already exists
        if (document.getElementById(CONFIG.WIDGET_ID)) {
            return;
        }
        
        // Add CSS
        const style = document.createElement('style');
        style.textContent = WIDGET_CSS;
        document.head.appendChild(style);
        
        // Add HTML
        const widgetContainer = document.createElement('div');
        widgetContainer.innerHTML = WIDGET_HTML;
        document.body.appendChild(widgetContainer);
        
        // Get elements
        const widget = document.getElementById(CONFIG.WIDGET_ID);
        const toggle = document.getElementById(CONFIG.TOGGLE_ID);
        const container = document.getElementById(CONFIG.CONTAINER_ID);
        const closeBtn = container.querySelector('.querybee-close');
        const input = container.querySelector('.querybee-input-field');
        const sendBtn = container.querySelector('.querybee-send');
        const messagesContainer = container.querySelector('.querybee-messages');
        
        let isOpen = false;
        
        // Toggle chat
        toggle.addEventListener('click', () => {
            isOpen = !isOpen;
            container.style.display = isOpen ? 'flex' : 'none';
            if (isOpen) {
                input.focus();
            }
        });
        
        // Close chat
        closeBtn.addEventListener('click', () => {
            isOpen = false;
            container.style.display = 'none';
        });
        
        // Send message
        async function sendMessage() {
            const message = input.value.trim();
            if (!message) return;
            
            // Add user message
            addMessage(message, 'user');
            input.value = '';
            
            // Add typing indicator
            const typingMsg = addMessage('Typing...', 'bot', true);
            
            try {
                // Call API
                const response = await fetch(`${CONFIG.API_BASE}/api/dialogflow`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        query: message,
                        sessionId: 'standalone-' + Date.now()
                    })
                });
                
                const data = await response.json();
                
                // Remove typing indicator
                typingMsg.remove();
                
                // Add bot response
                addMessage(data.response || 'Sorry, I could not process your request.', 'bot');
                
            } catch (error) {
                // Remove typing indicator
                typingMsg.remove();
                
                // Add error message
                addMessage('Sorry, I\'m having trouble connecting. Please try again later.', 'bot');
            }
        }
        
        function addMessage(text, sender, isTyping = false) {
            const messageDiv = document.createElement('div');
            messageDiv.className = `querybee-message ${sender}`;
            if (isTyping) messageDiv.classList.add('typing');
            
            messageDiv.innerHTML = `<strong>${sender === 'user' ? 'You' : 'QueryBee'}:</strong> ${text}`;
            messageDiv.style.cssText = `
                background: ${sender === 'user' ? 'linear-gradient(135deg, #00a8cc, #0077be)' : 'white'};
                color: ${sender === 'user' ? 'white' : '#333'};
                padding: 12px;
                border-radius: 8px;
                margin-bottom: 12px;
                box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
                ${sender === 'user' ? 'margin-left: auto; text-align: right;' : ''}
            `;
            
            messagesContainer.appendChild(messageDiv);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
            
            return messageDiv;
        }
        
        // Send on button click
        sendBtn.addEventListener('click', sendMessage);
        
        // Send on Enter key
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initWidget);
    } else {
        initWidget();
    }
})();
