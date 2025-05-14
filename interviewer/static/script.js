document.addEventListener('DOMContentLoaded', () => {
    const setupSection = document.getElementById('setup-section');
    const interviewSection = document.getElementById('interview-section');
    const startInterviewBtn = document.getElementById('start-interview');
    const sendMessageBtn = document.getElementById('send-message');
    const userInput = document.getElementById('user-input');
    const chatMessages = document.getElementById('chat-messages');
    const codeEditorContainer = document.getElementById('code-editor-container');
    const codeInput = document.getElementById('code-input');
    const sendCodeBtn = document.getElementById('send-code');
    const codePanel = document.getElementById('code-panel');
    const toggleCodePanelBtn = document.getElementById('toggle-code-panel');
    const header = document.querySelector('header');

    let currentPersonality = '';
    let codeMirrorEditor = null;

    // Start interview
    startInterviewBtn.addEventListener('click', async () => {
        console.log('Starting interview...');
        try {
            const response = await fetch('/start_interview', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    category: 'python',
                    personality: 'carmack'
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }

            // Update UI for interview mode
            setupSection.classList.add('hidden');
            header.classList.add('hidden');
            interviewSection.classList.remove('hidden');
            interviewSection.classList.add('active');

            // Initialize code editor and show toggle button
            initializeCodeMirror();
            toggleCodePanelBtn.style.display = 'flex';
            
            // Add interviewer's first message
            addMessage(data.choices[0].message.content, 'interviewer');
        } catch (error) {
            console.error('Error starting interview:', error);
            alert('Error starting interview: ' + error.message);
        }
    });

    // Send message
    sendMessageBtn.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Initialize CodeMirror for Python code editor
    function initializeCodeMirror() {
        if (!codeMirrorEditor) {
            codeMirrorEditor = CodeMirror.fromTextArea(document.getElementById('code-input'), {
                mode: 'python',
                theme: 'monokai',
                lineNumbers: true,
                indentUnit: 4,
                tabSize: 4,
                lineWrapping: true,
                autofocus: true,
                matchBrackets: true,
                autoCloseBrackets: true
            });
        }
    }

    // Initialize code editor on page load
    initializeCodeMirror();

    // Set initial state of the toggle button
    if (codePanel.classList.contains('visible')) {
        document.querySelector('.toggle-arrow').style.transform = 'rotate(180deg)';
    }

    sendCodeBtn.addEventListener('click', async () => {
        const code = codeMirrorEditor ? codeMirrorEditor.getValue().trim() : '';
        if (!code) return;
        addMessage(code, 'user');
        if (codeMirrorEditor) codeMirrorEditor.setValue('');
        try {
            const response = await fetch('/send_code', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    code: code,
                    category: 'python',
                    personality: 'friendly'
                })
            });
            const data = await response.json();
            if (data.error) {
                throw new Error(data.error);
            }
            addMessage(data.choices[0].message.content, 'interviewer');
        } catch (error) {
            alert('Error sending code: ' + error.message);
        }
    });

    // Toggle code panel
    toggleCodePanelBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const isVisible = codePanel.classList.contains('visible');
        
        if (!isVisible) {
            // Show the panel
            codePanel.classList.add('visible');
            
            // Give time for the panel to appear before refreshing CodeMirror
            setTimeout(() => {
                if (codeMirrorEditor) {
                    codeMirrorEditor.refresh();
                }
            }, 300);
        } else {
            // Hide the panel
            codePanel.classList.remove('visible');
        }
        
        return false;
    });

    async function sendMessage() {
        const message = userInput.value.trim();
        if (!message) return;

        // Add user message to chat
        addMessage(message, 'user');
        userInput.value = '';

        try {
            const response = await fetch('/continue_interview', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    category: 'python',
                    personality: 'friendly'
                })
            });

            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }

            // Add interviewer's response
            addMessage(data.choices[0].message.content, 'interviewer');
        } catch (error) {
            alert('Error sending message: ' + error.message);
        }
    }

    function addMessage(content, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', `${sender}-message`);
        messageDiv.textContent = content;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}); 