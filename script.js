// QueryBee College Assistant JavaScript - Integrated with Dialogflow ES Backend

// QueryBee College Assistant JavaScript - Enhanced Floating Chat with Advanced Features

document.addEventListener("DOMContentLoaded", () => {
  const chatToggle = document.getElementById("chat-toggle");
  const chatContainer = document.getElementById("chat-container");
  const chatWidget = document.getElementById("chat-widget");
  const closeBtn = document.getElementById("close-btn");
  const minimizeBtn = document.getElementById("minimize-btn");
  const fullscreenBtn = document.getElementById("fullscreen-btn");
  const chatHeader = document.querySelector(".chat-header");
  const sendBtn = document.getElementById("send-btn");
  const userInput = document.getElementById("user-input");
  const chatMessages = document.getElementById("chat-messages");
  const quickQuestions = document.getElementById("quick-questions");
  const quickBtns = document.querySelectorAll(".quick-btn");
  const resizeHandle = document.getElementById("resize-handle");
  const clearChatBtn = document.getElementById("clear-chat-btn");
  const voiceBtn = document.getElementById("voice-btn");
  
  // Connection status elements
  const statusDot = document.getElementById('status-dot');
  const statusText = document.getElementById('status-text');
  
  const HISTORY_KEY = "querybee_history";
  const MAX_HISTORY = 200;
  let chatHistory = [];
  let typingIndicator = null; // Will be created dynamically
  const defaultSize = { width: 360, height: 520 };
  let storedSize = { ...defaultSize };
  let currentSize = { ...defaultSize };
  let lastSizeBeforeMax = null;
  let isMaximized = false;
  let isAdjustingSize = false;
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const canSpeak = typeof window.speechSynthesis !== "undefined";
  let currentSpeech = { utterance: null, messageId: null };
  let recognition = null;
  let isListening = false;

  let isDragging = false;
  let isResizing = false;
  let isOpen = false;
  let dragOffset = { x: 0, y: 0 };
  let currentPosition = { x: null, y: null };
  let greetingShown = false;

  // Connection status management
  let isConnected = false;
  let connectionCheckInterval = null;

  // Mobile menu toggle
  window.toggleMobileMenu = function() {
    const mainMenu = document.querySelector('.main-menu');
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    
    if (mainMenu.classList.contains('active')) {
      mainMenu.classList.remove('active');
      mobileToggle.innerHTML = '<i class="fas fa-bars"></i>';
    } else {
      mainMenu.classList.add('active');
      mobileToggle.innerHTML = '<i class="fas fa-times"></i>';
    }
  };

  // Check backend connection status
  async function checkConnectionStatus() {
    try {
      const response = await fetch('http://localhost:3000', {
        method: 'GET',
        timeout: 3000
      });
      
      if (response.ok) {
        isConnected = true;
        statusDot.classList.remove('disconnected');
        statusText.classList.remove('disconnected');
        statusText.textContent = 'Online';
      } else {
        throw new Error('Server not responding');
      }
    } catch (error) {
      isConnected = false;
      statusDot.classList.add('disconnected');
      statusText.classList.add('disconnected');
      statusText.textContent = 'Offline';
    }
  }

  // Initialize connection status checking
  function initializeConnectionCheck() {
    checkConnectionStatus();
    connectionCheckInterval = setInterval(checkConnectionStatus, 10000); // Check every 10 seconds
  }

  // Initialize position and size from localStorage or default
  function initializePosition() {
    const saved = localStorage.getItem("querybee_position");
    if (saved) {
      const pos = JSON.parse(saved);
      chatWidget.style.right = "auto";
      chatWidget.style.bottom = "auto";
      chatWidget.style.left = pos.x + "px";
      chatWidget.style.top = pos.y + "px";
      currentPosition = pos;
    }
    
    // Load saved size
    const savedSizeData = localStorage.getItem("querybee_size");
    if (savedSizeData) {
      storedSize = normalizeSize(JSON.parse(savedSizeData));
    }
    setContainerSize(storedSize, { persist: false });
  }

  initializePosition();
  loadHistory();
  initializeConnectionCheck();

  function normalizeSize(size = defaultSize) {
    const minWidth = 260;
    const minHeight = 300;
    const maxWidth = Math.max(minWidth, window.innerWidth - 20);
    const maxHeight = Math.max(minHeight, window.innerHeight - 40);
    return {
      width: Math.max(minWidth, Math.min(size.width || defaultSize.width, maxWidth)),
      height: Math.max(minHeight, Math.min(size.height || defaultSize.height, maxHeight))
    };
  }

  function setContainerSize(size, { persist = false } = {}) {
    const normalized = normalizeSize(size);
    chatContainer.style.width = normalized.width + "px";
    chatContainer.style.height = normalized.height + "px";
    chatContainer.style.maxWidth = normalized.width + "px";
    chatContainer.style.maxHeight = normalized.height + "px";
    currentSize = normalized;
    if (persist) {
      storedSize = normalized;
      localStorage.setItem("querybee_size", JSON.stringify(storedSize));
    }
    constrainToViewport();
  }

  function constrainToViewport() {
    if (!isOpen || isAdjustingSize) return;
    const padding = 25; // Increased padding for better boundary enforcement
    const availableWidth = window.innerWidth - padding * 2;
    const availableHeight = window.innerHeight - padding * 2;
    let width = currentSize.width;
    let height = currentSize.height;
    let resized = false;

    if (width > availableWidth) {
      width = availableWidth;
      resized = true;
    }
    if (height > availableHeight) {
      height = availableHeight;
      resized = true;
    }

    if (resized) {
      isAdjustingSize = true;
      setContainerSize(
        {
          width: Math.max(320, width),
          height: Math.max(450, height)
        },
        { persist: false }
      );
      isAdjustingSize = false;
    }

    const widgetRect = chatWidget.getBoundingClientRect();
    let left = parseFloat(chatWidget.style.left);
    let top = parseFloat(chatWidget.style.top);
    if (Number.isNaN(left)) {
      left = widgetRect.left;
    }
    if (Number.isNaN(top)) {
      top = widgetRect.top;
    }
    
    // Enhanced boundary enforcement - prevent any overflow
    const maxLeft = window.innerWidth - widgetRect.width - padding;
    const maxTop = window.innerHeight - widgetRect.height - padding;
    
    // Ensure widget stays within strict boundaries
    left = Math.min(Math.max(left, padding), Math.max(padding, maxLeft));
    top = Math.min(Math.max(top, padding), Math.max(padding, maxTop));
    
    chatWidget.style.left = left + "px";
    chatWidget.style.top = top + "px";
    chatWidget.style.right = "auto";
    chatWidget.style.bottom = "auto";
    currentPosition = { x: left, y: top };
  }

  // Save position to localStorage
  function savePosition() {
    if (currentPosition.x !== null && currentPosition.y !== null) {
      localStorage.setItem("querybee_position", JSON.stringify(currentPosition));
    }
  }

  function saveHistory() {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(chatHistory));
  }

  function persistEntry(entry) {
    chatHistory.push(entry);
    if (chatHistory.length > MAX_HISTORY) {
      chatHistory = chatHistory.slice(chatHistory.length - MAX_HISTORY);
    }
    saveHistory();
  }

  function loadHistory() {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return;
      chatHistory = parsed;
      if (chatHistory.length > 0) {
        greetingShown = true;
        if (quickQuestions && parsed.some(msg => msg.type === "user")) {
          quickQuestions.style.display = "none";
        }
      }
      chatHistory.forEach(entry => {
        addMessage(entry.sender, entry.text, entry.type, { skipSave: true, entry });
      });
    } catch (error) {
      console.warn("Unable to load chat history:", error);
      chatHistory = [];
      localStorage.removeItem(HISTORY_KEY);
    }
  }

  function clearChatHistory(showNotice = true) {
    chatHistory = [];
    localStorage.removeItem(HISTORY_KEY);
    chatMessages.innerHTML = "";
    hideTypingIndicator();
    greetingShown = false;
    if (quickQuestions) {
      quickQuestions.style.display = "";
    }
    if (showNotice) {
      addMessage("QueryBee", "Chat history cleared.", "bot", { skipSave: true });
    }
  }

  function generateMessageId() {
    if (window.crypto?.randomUUID) {
      return window.crypto.randomUUID();
    }
    return "msg_" + Date.now() + "_" + Math.random().toString(16).slice(2);
  }

  function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  // Update chat container position relative to toggle
  function updateChatPosition() {
    const toggleRect = chatToggle.getBoundingClientRect();
    const widgetRect = chatWidget.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Enhanced responsive dimensions with strict boundary enforcement
    const defaultWidth = Math.min(380, viewportWidth * 0.85);
    const defaultHeight = Math.min(560, viewportHeight * 0.75);
    const minWidth = 320;
    const minHeight = 450;
    const padding = 25; // Strict padding for chatbox boundaries
    const gap = 15; // Gap between toggle and container
    
    // Calculate available space from toggle position
    const spaceRight = viewportWidth - widgetRect.right;
    const spaceLeft = widgetRect.left;
    const spaceTop = widgetRect.top;
    const spaceBottom = viewportHeight - widgetRect.bottom;
    
    // Determine optimal position and size
    let containerWidth = defaultWidth;
    let containerHeight = defaultHeight;
    let positionRight = true;
    let positionBottom = true;
    
    // Smart positioning based on available space with strict boundaries
    // When icon is at edges, prioritize keeping chatbox within viewport
    if (spaceRight >= defaultWidth + padding) {
      // Position on right side (default)
      containerWidth = Math.min(defaultWidth, spaceRight - padding);
      positionRight = true;
    } else if (spaceLeft >= defaultWidth + padding) {
      // Position on left side
      chatContainer.style.right = "auto";
      chatContainer.style.left = "0";
      containerWidth = Math.min(defaultWidth, spaceLeft - padding);
      positionRight = false;
    } else {
      // Not enough space, adjust width strictly to fit within viewport
      const availableSpace = Math.max(spaceRight, spaceLeft);
      containerWidth = Math.max(minWidth, Math.min(defaultWidth, availableSpace - padding));
      
      // Force positioning to the side with more space
      if (spaceRight > spaceLeft) {
        positionRight = true;
      } else {
        positionRight = false;
        chatContainer.style.right = "auto";
        chatContainer.style.left = "0";
      }
    }
    
    // Vertical positioning with strict boundaries
    if (spaceBottom >= defaultHeight + gap) {
      // Position above toggle
      chatContainer.style.bottom = "auto";
      chatContainer.style.top = (toggleRect.height + gap) + "px";
      positionBottom = false;
    } else {
      // Position below toggle (default)
      containerHeight = Math.min(defaultHeight, spaceBottom - gap);
      positionBottom = true;
    }
    
    // Apply calculated dimensions
    chatContainer.style.width = containerWidth + "px";
    chatContainer.style.height = containerHeight + "px";
    chatContainer.style.maxWidth = containerWidth + "px";
    chatContainer.style.maxHeight = containerHeight + "px";
    
    // Set default positioning if not overridden
    if (positionRight) {
      chatContainer.style.right = "0";
      chatContainer.style.left = "auto";
    }
    
    if (positionBottom) {
      chatContainer.style.bottom = (toggleRect.height + gap) + "px";
      chatContainer.style.top = "auto";
    }
    
    // Strict boundary enforcement - prevent any overflow
    requestAnimationFrame(() => {
      const containerRect = chatContainer.getBoundingClientRect();
      
      // Horizontal bounds check - strict enforcement
      if (containerRect.left < padding) {
        chatContainer.style.left = padding + "px";
        chatContainer.style.right = "auto";
        // Force width adjustment if needed
        const availableWidth = viewportWidth - (padding * 2);
        if (containerWidth > availableWidth) {
          const newWidth = Math.max(minWidth, availableWidth);
          chatContainer.style.width = newWidth + "px";
          chatContainer.style.maxWidth = newWidth + "px";
        }
      } else if (containerRect.right > viewportWidth - padding) {
        const overflow = containerRect.right - (viewportWidth - padding);
        if (chatContainer.style.right) {
          const currentRight = parseInt(chatContainer.style.right) || 0;
          chatContainer.style.right = Math.max(0, currentRight + overflow) + "px";
        } else {
          const currentLeft = parseInt(chatContainer.style.left) || 0;
          chatContainer.style.left = Math.max(padding, currentLeft - overflow) + "px";
        }
        // Force width adjustment if needed
        const availableWidth = viewportWidth - (padding * 2);
        if (containerWidth > availableWidth) {
          const newWidth = Math.max(minWidth, availableWidth);
          chatContainer.style.width = newWidth + "px";
          chatContainer.style.maxWidth = newWidth + "px";
        }
      }
      
      // Vertical bounds check - strict enforcement
      if (containerRect.top < padding) {
        chatContainer.style.top = padding + "px";
        chatContainer.style.bottom = "auto";
        // Force height adjustment if needed
        const availableHeight = viewportHeight - (padding * 2);
        if (containerHeight > availableHeight) {
          const newHeight = Math.max(minHeight, availableHeight);
          chatContainer.style.height = newHeight + "px";
          chatContainer.style.maxHeight = newHeight + "px";
        }
      } else if (containerRect.bottom > viewportHeight - padding) {
        const overflow = containerRect.bottom - (viewportHeight - padding);
        if (chatContainer.style.bottom) {
          const currentBottom = parseInt(chatContainer.style.bottom) || 0;
          chatContainer.style.bottom = Math.max(0, currentBottom + overflow) + "px";
        } else {
          const currentTop = parseInt(chatContainer.style.top) || 0;
          chatContainer.style.top = Math.max(padding, currentTop - overflow) + "px";
        }
        // Force height adjustment if needed
        const availableHeight = viewportHeight - (padding * 2);
        if (containerHeight > availableHeight) {
          const newHeight = Math.max(minHeight, availableHeight);
          chatContainer.style.height = newHeight + "px";
          chatContainer.style.maxHeight = newHeight + "px";
        }
      }
    });
  }

  // Reset container size styles
  function resetContainerSize() {
    chatContainer.style.width = "";
    chatContainer.style.maxWidth = "";
    chatContainer.style.height = "";
    chatContainer.style.maxHeight = "";
    chatContainer.classList.remove("maximized");
    isMaximized = false;
    resizeBtn?.classList.remove("active");
  }

  // Toggle chat open/close
  function toggleChat() {
    if (isDragging) return; // Don't toggle if dragging
    
    isOpen = !isOpen;
    if (isOpen) {
      if (isMaximized) {
        setMaximizedSize();
      } else {
        setContainerSize(storedSize, { persist: false });
      }
      chatContainer.classList.add("open");
      // Small delay to ensure container has rendered
      setTimeout(() => {
        updateChatPosition();
        userInput.focus();
        constrainToViewport();
      }, 50);
      
      // Show greeting on first open
      if (!greetingShown && chatMessages.children.length === 0) {
        greetingShown = true;
        setTimeout(() => {
          addMessage("QueryBee", "Hello there! 👋 It's nice to meet you!", "bot");
          setTimeout(() => {
            addMessage("QueryBee", "What brings you here today? Please, use the quick-questions below or ask me anything about M. L. Dahanukar College.", "bot");
          }, 500);
        }, 300);
      }
    } else {
      chatContainer.classList.remove("open");
      // Reset size when closing
      resetContainerSize();
    }
  }

  // Close chat
  function closeChat() {
    isOpen = false;
    chatContainer.classList.remove("open");
    resetContainerSize();
  }

  // Toggle button click handler
  chatToggle.addEventListener("click", (e) => {
    if (!isDragging && !isResizing) {
      toggleChat();
    }
  });

  // Add touch support for mobile dragging
  chatToggle.addEventListener("touchstart", (e) => {
    if (!isOpen) {
      startWidgetDrag(e.touches[0]);
    }
  }, { passive: true });

  chatWidget.addEventListener("touchmove", (e) => {
    if (!isOpen && isDragging) {
      e.preventDefault();
      const touch = e.touches[0];
      const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
      });
      document.dispatchEvent(mouseEvent);
    }
  }, { passive: false });

  chatWidget.addEventListener("touchend", (e) => {
    if (!isOpen && isDragging) {
      const mouseEvent = new MouseEvent('mouseup');
      document.dispatchEvent(mouseEvent);
    }
  }, { passive: true });

  // Close button handler
  closeBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    closeChat();
  });

  minimizeBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    closeChat();
  });

  fullscreenBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleFullscreen();
  });

  chatHeader?.addEventListener("dblclick", () => {
    toggleFullscreen();
  });

  function setupDragHandle(handle, { requireOpen = false } = {}) {
    if (!handle) return;
    handle.addEventListener("mousedown", (event) => {
      if (event.button !== 0) return;
      if (requireOpen && !isOpen) return;
      if (handle === chatHeader && event.target.closest(".window-controls")) {
        return;
      }
      startWidgetDrag(event);
    });
  }

  function startWidgetDrag(event) {
    isDragging = false;
    const widgetRect = chatWidget.getBoundingClientRect();
    const offsetX = event.clientX - widgetRect.left;
    const offsetY = event.clientY - widgetRect.top;
    const startX = event.clientX;
    const startY = event.clientY;
    const startTime = Date.now();

    const handleMouseMove = (e) => {
      const deltaX = Math.abs(e.clientX - startX);
      const deltaY = Math.abs(e.clientY - startY);
      const deltaTime = Date.now() - startTime;
      if (!isDragging && (deltaX > 5 || deltaY > 5 || deltaTime > 100)) {
        isDragging = true;
        chatToggle.classList.add("dragging");
        chatWidget.classList.add("dragging");
        document.body.classList.add("no-select");
      }
      if (isDragging) {
        let x = e.clientX - offsetX;
        let y = e.clientY - offsetY;
        
        // Allow icon to reach borders but limit padding
        const iconPadding = 5; // Minimal padding for icon
        const maxX = window.innerWidth - chatWidget.offsetWidth - iconPadding;
        const maxY = window.innerHeight - chatWidget.offsetHeight - iconPadding;
        
        x = Math.max(iconPadding, Math.min(x, maxX));
        y = Math.max(iconPadding, Math.min(y, maxY));
        
        chatWidget.style.position = "fixed";
        chatWidget.style.left = x + "px";
        chatWidget.style.top = y + "px";
        chatWidget.style.right = "auto";
        chatWidget.style.bottom = "auto";
        currentPosition = { x, y };
        
        if (isOpen) {
          updateChatPosition();
        }
      }
    };

    const handleMouseUp = () => {
      isDragging = false;
      chatToggle.classList.remove("dragging");
      chatWidget.classList.remove("dragging");
      document.body.classList.remove("no-select");
      savePosition();
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  }

  setupDragHandle(chatToggle, { requireOpen: false });
  setupDragHandle(chatHeader, { requireOpen: true });

  function setMaximizedSize() {
    const width = Math.min(window.innerWidth - 32, 640);
    const height = Math.min(window.innerHeight - 48, 720);
    chatContainer.classList.add("maximized");
    setContainerSize({ width, height }, { persist: false });
  }

  function toggleFullscreen() {
    if (!isOpen) return;
    
    const isFullscreen = chatContainer.classList.contains("fullscreen");
    
    if (isFullscreen) {
      // Exit fullscreen
      chatContainer.classList.remove("fullscreen");
      fullscreenBtn?.classList.remove("active");
      fullscreenBtn.innerHTML = '<i class="fas fa-expand-arrows-alt"></i>';
      fullscreenBtn.title = "Full Display";
      
      // Restore previous size
      const restoreSize = lastSizeBeforeMax && lastSizeBeforeMax.width ? lastSizeBeforeMax : storedSize;
      setContainerSize(restoreSize, { persist: false });
      
      // Restore position
      chatWidget.style.position = "fixed";
      chatWidget.style.left = currentPosition.x + "px";
      chatWidget.style.top = currentPosition.y + "px";
      chatWidget.style.right = "auto";
      chatWidget.style.bottom = "auto";
      
      // Re-enable drag and resize
      chatHeader.style.cursor = "move";
      resizeHandle.style.display = "";
      
    } else {
      // Enter fullscreen
      lastSizeBeforeMax = { ...currentSize };
      currentPosition = { 
        x: chatWidget.offsetLeft || 0, 
        y: chatWidget.offsetTop || 0 
      };
      
      chatContainer.classList.add("fullscreen");
      fullscreenBtn?.classList.add("active");
      fullscreenBtn.innerHTML = '<i class="fas fa-compress-arrows-alt"></i>';
      fullscreenBtn.title = "Exit Full Display";
      
      // Set fullscreen size
      const padding = 10;
      const width = window.innerWidth - (padding * 2);
      const height = window.innerHeight - (padding * 2);
      
      chatContainer.style.width = width + "px";
      chatContainer.style.height = height + "px";
      chatContainer.style.maxWidth = width + "px";
      chatContainer.style.maxHeight = height + "px";
      
      // Center the chat in fullscreen
      chatWidget.style.position = "fixed";
      chatWidget.style.left = padding + "px";
      chatWidget.style.top = padding + "px";
      chatWidget.style.right = "auto";
      chatWidget.style.bottom = "auto";
      
      // Disable drag and resize in fullscreen
      chatHeader.style.cursor = "default";
      resizeHandle.style.display = "none";
    }
  }

  function toggleMaximize(forceState) {
    if (!isOpen) return;
    const targetState = typeof forceState === "boolean" ? forceState : !isMaximized;
    if (targetState === isMaximized) return;

    if (targetState) {
      lastSizeBeforeMax = { ...currentSize };
      setMaximizedSize();
      isMaximized = true;
      resizeBtn?.classList.add("active");
    } else {
      chatContainer.classList.remove("maximized");
      const restoreSize = lastSizeBeforeMax && lastSizeBeforeMax.width ? lastSizeBeforeMax : storedSize;
      setContainerSize(restoreSize, { persist: false });
      isMaximized = false;
      resizeBtn?.classList.remove("active");
    constrainToViewport();
    }
  }

  // Enhanced resize functionality with strict boundary enforcement
  resizeHandle.addEventListener("mousedown", (e) => {
    e.preventDefault();
    e.stopPropagation();
    isResizing = true;
    chatContainer.classList.add("resizing");
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = chatContainer.offsetWidth;
    const startHeight = chatContainer.offsetHeight;
    const startLeft = chatContainer.getBoundingClientRect().left;
    const startTop = chatContainer.getBoundingClientRect().top;
    const widgetRect = chatWidget.getBoundingClientRect();
    
    // Create resize overlay for better UX
    const resizeOverlay = document.createElement('div');
    resizeOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.1);
      z-index: 10000;
      cursor: nwse-resize;
    `;
    document.body.appendChild(resizeOverlay);
    
    document.body.style.userSelect = "none";
    document.body.style.cursor = "nwse-resize";
    
    const handleMouseMove = (e) => {
      if (!isResizing) return;
      
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      
      let newWidth = startWidth + deltaX;
      let newHeight = startHeight + deltaY; // Fixed: positive for normal resizing
      
      // Dynamic constraints based on viewport with strict boundaries
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const padding = 25; // Strict padding for chatbox boundaries
      
      const minWidth = 320;
      const maxWidth = Math.max(minWidth, viewportWidth - padding * 2);
      const minHeight = 450;
      const maxHeight = Math.max(minHeight, viewportHeight - padding * 2);
      
      // Strict size enforcement - never allow overflow
      newWidth = Math.max(minWidth, Math.min(newWidth, maxWidth));
      newHeight = Math.max(minHeight, Math.min(newHeight, maxHeight));
      
      // Apply new dimensions
      chatContainer.style.width = newWidth + "px";
      chatContainer.style.height = newHeight + "px";
      chatContainer.style.maxWidth = newWidth + "px";
      chatContainer.style.maxHeight = newHeight + "px";
      
      // Update stored size
      storedSize = { width: Math.round(newWidth), height: Math.round(newHeight) };
      currentSize = { ...storedSize };
      isMaximized = false;
      chatContainer.classList.remove("maximized");
      
      // Strict position adjustment - prevent any overflow
      const containerRect = chatContainer.getBoundingClientRect();
      
      // Horizontal bounds - strict enforcement
      if (containerRect.left < padding) {
        chatWidget.style.left = padding + "px";
        chatWidget.style.right = "auto";
      } else if (containerRect.right > viewportWidth - padding) {
        const overflow = containerRect.right - (viewportWidth - padding);
        if (chatContainer.style.right) {
          const currentRight = parseInt(chatContainer.style.right) || 0;
          chatContainer.style.right = Math.max(0, currentRight + overflow) + "px";
        } else {
          const currentLeft = parseInt(chatContainer.style.left) || 0;
          chatContainer.style.left = Math.max(padding, currentLeft - overflow) + "px";
        }
      }
      
      // Vertical bounds - strict enforcement
      if (containerRect.top < padding) {
        chatWidget.style.top = padding + "px";
        chatWidget.style.bottom = "auto";
      } else if (containerRect.bottom > viewportHeight - padding) {
        const overflow = containerRect.bottom - (viewportHeight - padding);
        if (chatContainer.style.bottom) {
          const currentBottom = parseInt(chatContainer.style.bottom) || 0;
          chatContainer.style.bottom = Math.max(0, currentBottom + overflow) + "px";
        } else {
          const currentTop = parseInt(chatContainer.style.top) || 0;
          chatContainer.style.top = Math.max(padding, currentTop - overflow) + "px";
        }
      }
      
      // Ensure widget position stays within bounds
      const widgetRectAfter = chatWidget.getBoundingClientRect();
      const maxWidgetLeft = viewportWidth - widgetRectAfter.width - 5; // Allow icon near border
      const maxWidgetTop = viewportHeight - widgetRectAfter.height - 5;
      
      let finalLeft = parseFloat(chatWidget.style.left) || widgetRectAfter.left;
      let finalTop = parseFloat(chatWidget.style.top) || widgetRectAfter.top;
      
      finalLeft = Math.max(5, Math.min(finalLeft, maxWidgetLeft));
      finalTop = Math.max(5, Math.min(finalTop, maxWidgetTop));
      
      chatWidget.style.left = finalLeft + "px";
      chatWidget.style.top = finalTop + "px";
      chatWidget.style.right = "auto";
      chatWidget.style.bottom = "auto";
      currentPosition = { x: finalLeft, y: finalTop };
    };
    
    const handleMouseUp = () => {
      isResizing = false;
      chatContainer.classList.remove("resizing");
      document.body.removeChild(resizeOverlay);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
      localStorage.setItem("querybee_size", JSON.stringify(storedSize));
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
    
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  });
  
  // Update chat position on window resize
  window.addEventListener("resize", () => {
    if (isOpen && !isResizing) {
      if (isMaximized) {
        setMaximizedSize();
      } else {
        setContainerSize(storedSize, { persist: false });
      }
      setTimeout(() => {
        updateChatPosition();
        constrainToViewport();
      }, 30);
    }
  });

  // Send message function
  function sendMessage(text) {
    if (!text.trim()) return;

    // Hide quick questions after first user message
    if (quickQuestions && quickQuestions.style.display !== "none") {
      quickQuestions.style.display = "none";
    }

    addMessage("You", text, "user");
    userInput.value = "";

    // Show typing indicator in messages container
    showTypingIndicator();

    // Persistent session id for contexts
    let sessionId = localStorage.getItem("querybee_session");
    if (!sessionId) {
      sessionId = Math.random().toString(36).substring(2, 12);
      localStorage.setItem("querybee_session", sessionId);
    }

    // Call backend POST /api/dialogflow
    fetch("http://localhost:3000/api/dialogflow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: text, sessionId })
    })
      .then(async response => {
        const contentType = response.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) {
          const txt = await response.text();
          console.error("Non-JSON response from backend:", txt);
          throw new Error("Server returned an invalid response. Check server console.");
        }
        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          const errorMsg = err.response || err.error || `HTTP error: ${response.status}`;
          throw new Error(errorMsg);
        }
        return response.json();
      })
      .then(data => {
        // Backend returns { response: "...", intent: "...", sessionId: "..." }
        if (data && data.response) {
          addMessage("QueryBee", data.response, "bot");
        } else if (data && data.error) {
          addMessage("QueryBee", data.error, "bot");
        } else {
          addMessage("QueryBee", "Sorry, I didn't get a response.", "bot");
        }
        hideTypingIndicator();
      })
      .catch(error => {
        console.error("Error calling backend:", error);
        const errMsg = error && error.message ? error.message : "Sorry, something went wrong.";
        addMessage("QueryBee", errMsg, "bot");
        hideTypingIndicator();
      });
  }

  // Send button click handler
  sendBtn.addEventListener("click", () => {
    sendMessage(userInput.value.trim());
  });

  // Enter key handler
  userInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      sendMessage(userInput.value.trim());
    }
  });

  // Quick question button handlers
  quickBtns.forEach(btn => {
    btn.addEventListener("click", (e) => {
      // Don't trigger if clicking the remove button
      if (e.target.closest('.quick-btn-remove') || e.target.classList.contains('quick-btn-remove')) {
        e.stopPropagation();
        return;
      }
      const question = btn.getAttribute("data-question");
      if (question) {
        sendMessage(question);
      }
    });
  });

  // Remove suggestion handlers - attach to all remove buttons
  function attachRemoveHandlers() {
    const removeButtons = document.querySelectorAll('.quick-btn-remove');
    removeButtons.forEach(removeBtn => {
      // Remove existing listeners to avoid duplicates
      const newRemoveBtn = removeBtn.cloneNode(true);
      removeBtn.parentNode.replaceChild(newRemoveBtn, removeBtn);
      
      newRemoveBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        e.preventDefault();
        removeSuggestion(newRemoveBtn);
      });
    });
  }

  // Remove suggestion function with smooth animation
  function removeSuggestion(removeBtn) {
    const quickBtn = removeBtn.closest('.quick-btn');
    if (!quickBtn) return;

    // Add removing class for animation
    quickBtn.classList.add('removing');
    
    // After animation completes, remove the element
    setTimeout(() => {
      quickBtn.remove();
      
      // Check if all suggestions are removed
      const remainingSuggestions = quickQuestions.querySelectorAll('.quick-btn');
      if (remainingSuggestions.length === 0) {
        quickQuestions.style.display = 'none';
      }
    }, 300); // Match CSS transition duration
  }

  // Attach remove handlers on page load
  attachRemoveHandlers();

  if (clearChatBtn) {
    clearChatBtn.addEventListener("click", () => {
      if (!chatHistory.length) {
        clearChatHistory(false);
        return;
      }
      const confirmClear = window.confirm("Clear all chat history?");
      if (confirmClear) {
        clearChatHistory();
      }
    });
  }

  // Voice input
  if (voiceBtn) {
    if (!SpeechRecognition) {
      voiceBtn.disabled = true;
      voiceBtn.title = "Voice input not supported in this browser";
    } else {
      recognition = new SpeechRecognition();
      recognition.lang = "en-US";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.addEventListener("start", () => {
        isListening = true;
        voiceBtn.classList.add("listening");
        voiceBtn.title = "Listening...";
      });

      recognition.addEventListener("end", () => {
        isListening = false;
        voiceBtn.classList.remove("listening");
        voiceBtn.title = "Tap to speak";
      });

      recognition.addEventListener("error", (event) => {
        console.error("Voice recognition error:", event.error);
        isListening = false;
        voiceBtn.classList.remove("listening");
        voiceBtn.title = "Tap to speak";
      });

      recognition.addEventListener("result", (event) => {
        const transcript = event.results[0][0].transcript.trim();
        if (transcript) {
          userInput.value = transcript;
          sendMessage(transcript);
        }
      });

      voiceBtn.addEventListener("click", () => {
        if (isListening) {
          recognition.stop();
        } else {
          recognition.start();
        }
      });
    }
  }

  // Show typing indicator in messages container
  function showTypingIndicator() {
    // Remove existing typing indicator if any
    hideTypingIndicator();
    
    // Create typing indicator
    typingIndicator = document.createElement("div");
    typingIndicator.className = "typing-indicator";
    typingIndicator.innerHTML = `
      <span></span>
      <span></span>
      <span></span>
    `;
    
    // Append to messages container
    chatMessages.appendChild(typingIndicator);
    
    // Scroll to bottom to show typing indicator
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  // Hide typing indicator
  function hideTypingIndicator() {
    if (typingIndicator && typingIndicator.parentNode) {
      typingIndicator.parentNode.removeChild(typingIndicator);
      typingIndicator = null;
    }
  }

  function addMessage(sender, text, type = "bot", options = {}) {
    hideTypingIndicator();
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${type}`;
    
    const entry = options.entry || {
      id: generateMessageId(),
      sender,
      text,
      type,
      timestamp: Date.now(),
      feedback: null
    };
    
    messageDiv.dataset.messageId = entry.id;
    
    // Remove redundant sender labels from text
    let messageText = entry.text;
    if (messageText.startsWith(sender + ":")) {
      messageText = messageText.substring(sender.length + 1).trim();
    }
    
    const senderEl = document.createElement("strong");
    senderEl.textContent = `${sender}:`;
    const textEl = document.createElement("div");
    textEl.className = "message-text";
    textEl.textContent = messageText;
    
    messageDiv.appendChild(senderEl);
    messageDiv.appendChild(textEl);
    
    const footer = document.createElement("div");
    footer.className = "message-footer";
    const timeEl = document.createElement("span");
    timeEl.className = "message-time";
    timeEl.textContent = formatTimestamp(entry.timestamp);
    footer.appendChild(timeEl);
    
    const controls = document.createElement("div");
    controls.className = "message-controls";
    
    if (type === "bot" && canSpeak) {
      const speakBtn = createSpeakButton(entry);
      controls.appendChild(speakBtn);
    }
    
    if (type === "bot") {
      const feedbackEl = createFeedbackControls(entry);
      controls.appendChild(feedbackEl);
    }
    
    footer.appendChild(controls);
    
    messageDiv.appendChild(footer);
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    if (!options.skipSave) {
      persistEntry(entry);
    }
    
    if (type === "bot" && isOpen) {
      setTimeout(() => {
        userInput.focus();
      }, 100);
    }
  }
  
  function createFeedbackControls(entry) {
    const container = document.createElement("div");
    container.className = "feedback-group";
    
    const upBtn = document.createElement("button");
    upBtn.className = "feedback-btn thumbs-up";
    upBtn.setAttribute("type", "button");
    upBtn.dataset.value = "up";
    upBtn.innerHTML = '<i class="fas fa-thumbs-up"></i>';
    
    const downBtn = document.createElement("button");
    downBtn.className = "feedback-btn thumbs-down";
    downBtn.setAttribute("type", "button");
    downBtn.dataset.value = "down";
    downBtn.innerHTML = '<i class="fas fa-thumbs-down"></i>';
    
    const updateState = () => {
      [upBtn, downBtn].forEach(btn => {
        btn.classList.toggle("active", entry.feedback === btn.dataset.value);
      });
    };
    
    upBtn.addEventListener("click", () => {
      handleFeedback(entry, "up");
      updateState();
    });
    
    downBtn.addEventListener("click", () => {
      handleFeedback(entry, "down");
      updateState();
    });
    
    updateState();
    container.appendChild(upBtn);
    container.appendChild(downBtn);
    return container;
  }
  
  function handleFeedback(entry, value) {
    entry.feedback = entry.feedback === value ? null : value;
    saveHistory();
    return entry.feedback;
  }

  function createSpeakButton(entry) {
    const btn = document.createElement("button");
    btn.className = "speak-btn";
    btn.type = "button";
    btn.title = "Play response";
    btn.innerHTML = '<i class="fas fa-volume-up"></i>';
    
    btn.addEventListener("click", () => {
      toggleSpeech(entry);
    });
    
    return btn;
  }

  function toggleSpeech(entry) {
    if (!canSpeak) return;
    const isSameMessage = currentSpeech.messageId === entry.id;
    
    if (currentSpeech.utterance) {
      window.speechSynthesis.cancel();
      currentSpeech = { utterance: null, messageId: null };
      refreshSpeakButtons();
      if (isSameMessage) {
        return;
      }
    }
    
    const utterance = new SpeechSynthesisUtterance(entry.text);
    utterance.lang = "en-US";
    utterance.rate = 1;
    utterance.pitch = 1;
    
    utterance.onend = () => {
      currentSpeech = { utterance: null, messageId: null };
      refreshSpeakButtons();
    };
    
    utterance.onerror = () => {
      currentSpeech = { utterance: null, messageId: null };
      refreshSpeakButtons();
    };
    
    currentSpeech = { utterance, messageId: entry.id };
    window.speechSynthesis.speak(utterance);
    refreshSpeakButtons();
  }

  function refreshSpeakButtons() {
    if (!canSpeak) return;
    const buttons = document.querySelectorAll(".speak-btn");
    buttons.forEach(btn => {
      const message = btn.closest(".message");
      const isPlaying = message?.dataset.messageId === currentSpeech.messageId;
      btn.classList.toggle("playing", isPlaying);
      btn.title = isPlaying ? "Stop narration" : "Play response";
    });
  }
});
