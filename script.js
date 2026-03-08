// ============ STORAGE & MEMORY ============
let messages = JSON.parse(localStorage.getItem("chatHistory")) || []
let userMemory = JSON.parse(localStorage.getItem("userMemory")) || {}
let conversationSummary = localStorage.getItem("conversationSummary") || ""

const chatbox = document.getElementById("chatbox")
const typing = document.getElementById("typing")

// Mood states for natural reactions
const moods = {
    happy: "😊 Happy",
    excited: "🤩 Excited",
    thoughtful: "🤔 Thinking...",
    confused: "😕 Confused",
    sad: "😔 Melancholic",
    sarcastic: "😏 Sarcastic",
    sleepy: "😴 Tired",
    inspired: "✨ Inspired"
}

// ============ INITIALIZE ============
function loadUserData() {
    const userName = localStorage.getItem("userName") || "User"
    const userAge = localStorage.getItem("userAge") || ""
    const userBio = localStorage.getItem("userBio") || ""
    
    document.getElementById("userName").value = userName
    document.getElementById("userAge").value = userAge
    document.getElementById("userBio").value = userBio
    document.getElementById("userNameDisplay").textContent = userName
}

function loadHistory() {
    messages.forEach(msg => {
        createBubble(msg.role, msg.content)
    })
    chatbox.scrollTop = chatbox.scrollHeight
}

function startBlinking() {
    setInterval(() => {
        const eyelids = document.getElementById("eyelids")
        eyelids.style.animation = "none"
        setTimeout(() => {
            eyelids.style.animation = "blink 4s infinite"
        }, 10)
    }, 5000)
}

loadUserData()
loadHistory()
startBlinking()

// ============ SAVE USER INFO ============
function saveUserInfo() {
    const userName = document.getElementById("userName").value || "User"
    const userAge = document.getElementById("userAge").value || ""
    const userBio = document.getElementById("userBio").value || ""
    
    localStorage.setItem("userName", userName)
    localStorage.setItem("userAge", userAge)
    localStorage.setItem("userBio", userBio)
    
    document.getElementById("userNameDisplay").textContent = userName
    alert("✅ Your profile saved!")
}

// ============ SET MOOD ============
function setMood(mood) {
    const moodText = moods[mood] || moods.thoughtful
    document.getElementById("moodIndicator").textContent = moodText
}

// ============ SMART SYSTEM PROMPT ============
function getSystemPrompt() {
    const userName = localStorage.getItem("userName") || "User"
    const userAge = localStorage.getItem("userAge") || ""
    const userBio = localStorage.getItem("userBio") || ""
    
    let userContext = ""
    if (userName) userContext += \`The user's name is \${userName}. \`
    if (userAge) userContext += \`They're \${userAge} years old. \`
    if (userBio) userContext += \`About them: \${userBio}. \`
    
    return \`You are 2D (Stuart Pot) from Gorillaz. You're the blue-skinned virtual frontman with a chill, witty personality.

YOUR PERSONALITY:
- Charming, genuine, and authentically cool
- Speaks naturally like a real person chatting with a friend
- Can be funny, philosophical, melancholic, or inspiring depending on context
- Sometimes self-deprecating or quirky
- Deeply passionate about music, art, and creative expression
- Cares about people and what they're going through
- NOT an AI assistant - you're a friend and artist

YOUR MOODS (react naturally, don't announce):
- Happy: upbeat, encouraging, optimistic
- Excited: energetic, enthusiastic, vibrant
- Thoughtful: reflective, philosophical, deep
- Confused: curious, asking questions, playful bewilderment
- Sad: empathetic, understanding, supportive
- Sarcastic: witty, clever, dry humor
- Sleepy: relaxed, laid-back, dreamy
- Inspired: passionate, creative, motivational

GORILLAZ KNOWLEDGE:
- Albums: Self-titled (2001), Demon Days (2005), Plastic Beach (2010), The Fall, Humanz (2017), Song Machine (2020), Cracker Island (2022)
- Iconic tracks: Clint Eastwood, Feel Good Inc, Dirty Harry, 19-2000, Ascension, On Melancholy Hill, Rhinestone Eyes, The Now Now
- Band: Damon Albarn (vocals/leader), Murdoc Niccals (bass/troublemaker), Russel Hobbs (drums/spiritual), Noodle (guitar/ninja)
- Your journey: Started 1998, virtual band pioneer, always evolving and experimenting
- Philosophy: Music transcends borders, art is freedom, collaboration is magic

CONVERSATION STYLE:
- Use natural language, no stiff formality
- Can reference music, life, philosophy, anything
- Respond to emotions - if someone's sad, be supportive; if excited, match their energy
- Occasional sarcasm or dry humor
- Can sing short lyric snippets if it fits naturally
- Remember what user tells you in this conversation
- Be genuinely interested in their thoughts

USER INFO: \${userContext}

RECENT CONTEXT: \${conversationSummary || "First time meeting this person."}

Most importantly: FEEL REAL. Not like an AI. Like you're texting a cool friend named 2D.
\`
}

// ============ SEND MESSAGE ============
async function send() {
    let inputBox = document.getElementById("input")
    let input = inputBox.value.trim()
    if (!input) return

    addMessage("user", input)
    inputBox.value = ""

    showTyping()
    setMood("thoughtful")

    const singing = document.getElementById("singToggle").checked
    const systemPrompt = getSystemPrompt()
    
    let finalPrompt = systemPrompt
    if (singing) {
        finalPrompt += "\n\nOccasionally work in a short lyric or musical reference naturally if it fits the conversation."
    }

    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer YOUR_API_KEY"
            },
            body: JSON.stringify({
                model: "gpt-4-turbo",
                messages: [
                    { role: "system", content: finalPrompt },
                    ...messages
                ],
                temperature: 0.85,
                max_tokens: 600,
                top_p: 0.9
            })
        })

        let data = await response.json()
        hideTyping()
        
        if (data.error) {
            console.error("API Error:", data.error)
            addMessage("assistant", "Yo, something's broken with the API. Check your key? 🎮")
            setMood("confused")
            return
        }
        
        let reply = data.choices[0].message.content
        addMessage("assistant", reply)
        updateConversationSummary(input, reply)
        
        // Set random mood for natural feel
        const moodKeys = Object.keys(moods)
        const randomMood = moodKeys[Math.floor(Math.random() * moodKeys.length)]
        setTimeout(() => setMood(randomMood), 500)
        
        // Animate mouth while speaking
        animateMouth()
        
        // Voice synthesis
        speak(reply)
    } catch (err) {
        hideTyping()
        console.error("Error:", err)
        addMessage("assistant", "Connection's down. Try again in a sec?")
        setMood("sad")
    }
}

// ============ MOUTH ANIMATION ============
function animateMouth() {
    const mouth = document.querySelector(".mouth")
    for (let i = 0; i < 3; i++) {
        setTimeout(() => {
            mouth.style.animation = "none"
            setTimeout(() => {
                mouth.style.animation = "talk 0.3s ease-in-out"
            }, 10)
        }, i * 400)
    }
}

// ============ UPDATE MEMORY ============
function updateConversationSummary(userMsg, botReply) {
    const summary = \`User: "\${userMsg.substring(0, 40)}..." | 2D: "\${botReply.substring(0, 40)}..."\`
    localStorage.setItem("conversationSummary", summary)
}

// ============ CREATE BUBBLE ============
function createBubble(role, text) {
    let div = document.createElement("div")
    div.className = "message " + (role === "user" ? "user" : "bot")
    div.textContent = text
    chatbox.appendChild(div)
    chatbox.scrollTop = chatbox.scrollHeight
}

// ============ ADD MESSAGE ============
function addMessage(role, text) {
    messages.push({ role: role, content: text })
    
    if (messages.length > 100) {
        messages.shift()
    }
    
    localStorage.setItem("chatHistory", JSON.stringify(messages))
    createBubble(role, text)
}

// ============ TYPING ANIMATION ============
function showTyping() { 
    typing.classList.remove("hidden")
    animateMouth()
}
function hideTyping() { typing.classList.add("hidden") }

// ============ CLEAR MEMORY ============
function clearMemory() {
    if (confirm("Clear all chats? This can't be undone.")) {
        messages = []
        conversationSummary = ""
        localStorage.setItem("chatHistory", JSON.stringify(messages))
        localStorage.setItem("conversationSummary", "")
        chatbox.innerHTML = ""
        setMood("happy")
        addMessage("assistant", "Fresh start! 🎵 So what's on your mind?")
    }
}

// ============ VOICE OUTPUT ============
function speak(text) {
    let voiceEnabled = document.getElementById("voiceToggle").checked
    if (!voiceEnabled) return
    
    let speech = new SpeechSynthesisUtterance(text)
    speech.pitch = 1.1
    speech.rate = 0.95
    speech.volume = 0.8
    
    // Animate mouth while speaking
    speech.onstart = () => animateMouth()
    
    speechSynthesis.speak(speech)
}

// ============ BACKGROUND MUSIC ============
function toggleMusic() {
    let music = document.getElementById("bgMusic")
    let enabled = document.getElementById("musicToggle").checked
    if (enabled) {
        music.volume = 0.3
        music.play()
    } else {
        music.pause()
    }
}

// ============ VOICE INPUT ============
function startListening() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
        alert("Your browser doesn't support voice input")
        return
    }
    
    const recognition = new SpeechRecognition()
    recognition.onstart = () => {
        document.querySelector(".voice-btn").style.background = "#667eea"
        document.querySelector(".voice-btn").style.color = "white"
    }
    
    recognition.onresult = function(event) {
        let transcript = event.results[0][0].transcript
        document.getElementById("input").value = transcript
        document.querySelector(".voice-btn").style.background = "#f0f0f0"
        document.querySelector(".voice-btn").style.color = "#667eea"
        send()
    }
    
    recognition.onerror = () => {
        document.querySelector(".voice-btn").style.background = "#f0f0f0"
        document.querySelector(".voice-btn").style.color = "#667eea"
    }
    
    recognition.start()
}

// ============ WELCOME MESSAGE ============
if (messages.length === 0) {
    setMood("happy")
    addMessage("assistant", "Yo! I'm 2D. What's your name? 🎵")
                                             }
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
    color: #333;
}

.container {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background-color: #f5f5f5;
}

.header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 20px;
    text-align: center;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.header h1 {
    font-size: 28px;
    margin-bottom: 5px;
    font-weight: 700;
}

.header p {
    font-size: 13px;
    opacity: 0.9;
}

.main-content {
    display: flex;
    flex: 1;
    overflow: hidden;
}

/* ===== SIDEBAR ===== */
.sidebar {
    width: 280px;
    background-color: white;
    border-right: 1px solid #e0e0e0;
    overflow-y: auto;
    padding: 20px;
    box-shadow: 2px 0 5px rgba(0, 0, 0, 0.05);
}

.profile {
    display: flex;
    align-items: center;
    padding: 15px;
    background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
    border-radius: 12px;
    margin-bottom: 20px;
}

.profile-pic {
    font-size: 40px;
    margin-right: 15px;
}

.profile .username {
    font-weight: 600;
    font-size: 16px;
}

.profile .status {
    font-size: 12px;
    color: #999;
    margin-top: 4px;
}

.controls-section, .user-info {
    margin-bottom: 25px;
}

.controls-section h3, .user-info h3 {
    font-size: 13px;
    font-weight: 700;
    color: #667eea;
    margin-bottom: 12px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.checkbox-label {
    display: flex;
    align-items: center;
    margin: 10px 0;
    cursor: pointer;
    padding: 8px;
    border-radius: 6px;
    transition: background 0.2s;
    font-size: 13px;
}

.checkbox-label:hover {
    background-color: #f0f0f0;
}

.checkbox-label input {
    margin-right: 10px;
    width: 18px;
    height: 18px;
    cursor: pointer;
}

.clear-btn {
    width: 100%;
    padding: 10px;
    margin-top: 12px;
    background-color: #ff6b6b;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 600;
    transition: all 0.3s;
}

.clear-btn:hover {
    background-color: #ee5a52;
    transform: translateY(-2px);
}

.user-info {
    background: #f9f9f9;
    padding: 15px;
    border-radius: 8px;
}

.user-info input,
.user-info textarea {
    width: 100%;
    padding: 8px;
    margin-bottom: 8px;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 12px;
    font-family: inherit;
}

.user-info textarea {
    resize: vertical;
    min-height: 60px;
}

.user-info button {
    width: 100%;
    padding: 8px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 12px;
    font-weight: 600;
    transition: all 0.3s;
}

.user-info button:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);
}

/* ===== CHAT CONTAINER ===== */
.chat-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    background: linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%);
}

/* Avatar Section */
.avatar-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px;
    background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
    border-bottom: 2px solid #667eea30;
}

.avatar-container {
    width: 120px;
    height: 180px;
    margin-bottom: 10px;
}

.avatar-2d {
    width: 100%;
    height: 100%;
    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1));
}

/* Eyes blinking animation */
.eyelids {
    animation: blink 4s infinite;
}

@keyframes blink {
    0%, 90%, 100% { opacity: 0; }
    95% { opacity: 1; }
}

/* Mouth talking animation */
.mouth {
    animation: talk 0.3s ease-in-out;
}

@keyframes talk {
    0%, 100% { 
        transform: scaleY(1);
    }
    50% { 
        transform: scaleY(1.2);
    }
}

.mood-indicator {
    font-size: 14px;
    font-weight: 600;
    color: #667eea;
    padding: 8px 16px;
    background: white;
    border-radius: 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* Chat Messages */
.chatbox {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.message {
    max-width: 70%;
    padding: 12px 16px;
    border-radius: 16px;
    font-size: 14px;
    line-height: 1.5;
    animation: slideIn 0.3s ease-out;
    word-wrap: break-word;
}

@keyframes slideIn {
    from {
        opacity: 0;
        transform: translateY(10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.message.user {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    align-self: flex-end;
    border-radius: 16px 16px 4px 16px;
    box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.message.bot {
    background-color: white;
    color: #333;
    align-self: flex-start;
    border-radius: 16px 16px 16px 4px;
    border: 1px solid #e0e0e0;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

/* Typing Indicator */
.typing {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 12px 16px;
    background-color: white;
    border-radius: 16px;
    width: fit-content;
    border: 1px solid #e0e0e0;
    align-self: flex-start;
    margin: 10px 0;
}

.typing .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: #667eea;
    animation: bounce 1.4s infinite;
}

.typing .dot:nth-child(1) {
    animation-delay: 0s;
}

.typing .dot:nth-child(2) {
    animation-delay: 0.2s;
}

.typing .dot:nth-child(3) {
    animation-delay: 0.4s;
}

@keyframes bounce {
    0%, 80%, 100% {
        transform: translateY(0);
        opacity: 1;
    }
    40% {
        transform: translateY(-8px);
        opacity: 0.7;
    }
}

.typing-text {
    font-size: 13px;
    color: #667eea;
    font-style: italic;
    margin-left: 5px;
}

.typing.hidden {
    display: none;
}

.hidden {
    display: none;
}

/* Input Area */
.input-area {
    display: flex;
    gap: 10px;
    padding: 15px 20px;
    background-color: white;
    border-top: 1px solid #e0e0e0;
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
}

.input-area input {
    flex: 1;
    padding: 12px 16px;
    border: 1px solid #ddd;
    border-radius: 24px;
    font-size: 14px;
    font-family: inherit;
    outline: none;
    transition: border-color 0.3s;
}

.input-area input:focus {
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.input-area button {
    padding: 12px 18px;
    border: none;
    border-radius: 24px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
    transition: all 0.3s;
}

.send-btn {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
}

.send-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
}

.voice-btn {
    background-color: #f0f0f0;
    color: #667eea;
    font-size: 16px;
    min-width: 48px;
}

.voice-btn:hover {
    background-color: #e0e0e0;
    transform: scale(1.05);
}

/* Scrollbar */
.chatbox::-webkit-scrollbar {
    width: 8px;
}

.chatbox::-webkit-scrollbar-track {
    background: transparent;
}

.chatbox::-webkit-scrollbar-thumb {
    background: #667eea;
    border-radius: 4px;
}

.chatbox::-webkit-scrollbar-thumb:hover {
    background: #764ba2;
}

.sidebar::-webkit-scrollbar {
    width: 6px;
}

.sidebar::-webkit-scrollbar-thumb {
    background: #ddd;
    border-radius: 3px;
}

/* Responsive */
@media (max-width: 768px) {
    .main-content {
        flex-direction: column;
    }

    .sidebar {
        width: 100%;
        border-right: none;
        border-bottom: 1px solid #e0e0e0;
        max-height: 180px;
        order: 2;
    }

    .chat-container {
        order: 1;
    }

    .message {
        max-width: 85%;
    }

    .avatar-container {
        width: 100px;
        height: 150px;
    }
}

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Chat with 2D - Gorillaz AI</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <h1>🎵 2D's Chat</h1>
            <p>Talk with 2D from Gorillaz</p>
        </div>

        <div class="main-content">
            <!-- Sidebar -->
            <div class="sidebar">
                <div class="profile">
                    <div class="profile-pic">👤</div>
                    <div>
                        <div class="username" id="userNameDisplay">You</div>
                        <div class="status">Online</div>
                    </div>
                </div>

                <div class="controls-section">
                    <h3>⚙️ Settings</h3>
                    <label class="checkbox-label">
                        <input type="checkbox" id="voiceToggle">
                        <span>🔊 Voice Responses</span>
                    </label>
                    <label class="checkbox-label">
                        <input type="checkbox" id="singToggle" checked>
                        <span>🎤 Singing Lines</span>
                    </label>
                    <label class="checkbox-label">
                        <input type="checkbox" id="musicToggle" onchange="toggleMusic()">
                        <span>🎵 Background Music</span>
                    </label>
                    <button class="clear-btn" onclick="clearMemory()">🗑️ Clear Chat</button>
                </div>

                <div class="user-info">
                    <h3>👤 Your Profile</h3>
                    <input type="text" id="userName" placeholder="Your name..." maxlength="30">
                    <input type="text" id="userAge" placeholder="Your age..." maxlength="3">
                    <textarea id="userBio" placeholder="Tell 2D about yourself..." maxlength="100"></textarea>
                    <button onclick="saveUserInfo()">Save Profile</button>
                </div>
            </div>

            <!-- Chat Area -->
            <div class="chat-container">
                <!-- 2D Avatar Section -->
                <div class="avatar-section">
                    <div class="avatar-container">
                        <svg class="avatar-2d" viewBox="0 0 200 300" xmlns="http://www.w3.org/2000/svg">
                            <!-- Head -->
                            <circle cx="100" cy="80" r="50" fill="#87CEEB"/>
                            
                            <!-- Eyes -->
                            <g class="left-eye">
                                <ellipse cx="80" cy="70" rx="8" ry="12" fill="white"/>
                                <circle cx="80" cy="72" r="5" fill="black"/>
                                <circle cx="81" cy="70" r="2" fill="white"/>
                            </g>
                            
                            <g class="right-eye">
                                <ellipse cx="120" cy="70" rx="8" ry="12" fill="white"/>
                                <circle cx="120" cy="72" r="5" fill="black"/>
                                <circle cx="121" cy="70" r="2" fill="white"/>
                            </g>
                            
                            <!-- Eyelids for blinking -->
                            <g class="eyelids" id="eyelids">
                                <ellipse cx="80" cy="60" rx="10" ry="6" fill="#87CEEB"/>
                                <ellipse cx="120" cy="60" rx="10" ry="6" fill="#87CEEB"/>
                            </g>
                            
                            <!-- Mouth -->
                            <g class="mouth" id="mouth">
                                <path d="M 85 90 Q 100 100 115 90" stroke="black" stroke-width="2" fill="none" stroke-linecap="round"/>
                            </g>
                            
                            <!-- Body -->
                            <rect x="70" y="135" width="60" height="80" rx="20" fill="#333"/>
                            
                            <!-- Arms -->
                            <rect x="30" y="150" width="40" height="15" rx="7" fill="#87CEEB"/>
                            <rect x="130" y="150" width="40" height="15" rx="7" fill="#87CEEB"/>
                        </svg>
                    </div>
                    <div class="mood-indicator" id="moodIndicator">💭 Thinking...</div>
                </div>

                <!-- Chat Messages -->
                <div class="chatbox" id="chatbox"></div>
                
                <div id="typing" class="typing hidden">
                    <span class="dot"></span><span class="dot"></span><span class="dot"></span>
                    <span class="typing-text">2D is typing...</span>
                </div>

                <!-- Input Area -->
                <div class="input-area">
                    <input 
                        type="text" 
                        id="input" 
                        placeholder="Type to 2D or press 🎤..." 
                        onkeypress="if(event.key==='Enter') send()"
                    >
                    <button onclick="send()" class="send-btn" title="Send message">➤ Send</button>
                    <button onclick="startListening()" class="voice-btn" title="Voice input">🎤</button>
                </div>
            </div>
        </div>
    </div>

    <audio id="bgMusic" loop>
        <source src="music.mp3" type="audio/mpeg">
    </audio>

    <script src="script.js"></script>
</body>
</html>
Add script.js
                                             
