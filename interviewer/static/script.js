document.addEventListener('DOMContentLoaded', () => {
    const setupSection = document.getElementById('setup-section');
    const interviewSection = document.getElementById('interview-section');
    const startInterviewBtn = document.getElementById('start-interview');
    const sendMessageBtn = document.getElementById('send-message');
    const userInput = document.getElementById('user-input');
    const chatMessages = document.getElementById('chat-messages');
    const categorySelect = document.getElementById('category');
    const codeEditorContainer = document.getElementById('code-editor-container');
    const codeInput = document.getElementById('code-input');
    const sendCodeBtn = document.getElementById('send-code');
    const codePanel = document.getElementById('code-panel');
    const toggleCodePanelBtn = document.getElementById('toggle-code-panel');

    let currentCategory = '';
    let currentPersonality = '';
    let codeMirrorEditor = null;

    // Start interview
    startInterviewBtn.addEventListener('click', async () => {
        currentCategory = categorySelect.value;
        currentPersonality = 'friendly';

        if (!currentCategory) {
            alert('Please select a technology');
            return;
        }

        try {
            const response = await fetch('/start_interview', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    category: currentCategory,
                    personality: 'friendly'
                })
            });

            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }

            // Show interview section and hide setup
            setupSection.classList.add('hidden');
            interviewSection.classList.remove('hidden');

            // Ensure editor is shown if Python
            ensureEditorOnInterviewStart();

            // Add interviewer's first message
            addMessage(data.choices[0].message.content, 'interviewer');
        } catch (error) {
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

    // Helper to show/hide code editor based on category
    function showOrHideCodeEditor() {
        if (categorySelect.value === 'python') {
            codePanel.classList.remove('hidden');
            toggleCodePanelBtn.textContent = 'Hide Code Editor';
            initializeCodeMirror();
            setTimeout(() => codeMirrorEditor && codeMirrorEditor.refresh(), 100);
        } else {
            codePanel.classList.add('hidden');
        }
    }

    // On category change
    categorySelect.addEventListener('change', showOrHideCodeEditor);

    // On page load, or after interview starts, ensure editor is shown if Python is selected
    function ensureEditorOnInterviewStart() {
        showOrHideCodeEditor();
    }

    // Call on page load in case Python is pre-selected
    showOrHideCodeEditor();

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
                    category: categorySelect.value,
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

    toggleCodePanelBtn.addEventListener('click', () => {
        if (codePanel.classList.contains('hidden')) {
            codePanel.classList.remove('hidden');
            toggleCodePanelBtn.textContent = 'Hide Code Editor';
            initializeCodeMirror();
            setTimeout(() => codeMirrorEditor && codeMirrorEditor.refresh(), 100);
        } else {
            codePanel.classList.add('hidden');
            toggleCodePanelBtn.textContent = 'Show Code Editor';
        }
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
                    category: currentCategory,
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