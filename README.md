# ⚡ Morse Code Compiler

A beautiful, interactive **Morse Code Compiler** that encodes text to Morse code and decodes Morse code back to text — with real-time visual and audio feedback.

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Web Audio API](https://img.shields.io/badge/Web_Audio_API-4285F4?style=for-the-badge&logo=google-chrome&logoColor=white)

---

## ✨ Features

### 🔤 Encoder — Text → Morse Code
- Type any message and convert it to Morse code instantly
- **Animated light bulb** blinks the Morse code pattern in real-time
- **Audio beeps** accompany each dot (dit) and dash (dah)
- Live Morse code output with character-by-character highlighting
- Adjustable playback **speed control** (1x–10x)

### 📡 Decoder — Morse → Text
- **Interactive telegraph key** — click or press `Space` to input Morse signals
- **Short press** = Dot (●), **Long press** = Dash (━)
- Visual **press duration indicator** showing dot/dash threshold
- Auto-commits letters after pause; adds word spaces after longer pauses
- Decoded message renders on a **live canvas** with glow effects

### 🛡️ Robust Error Handling
- **Unsupported characters** (emojis, special Unicode) detected with toast warnings
- **Invalid Morse sequences** shown as red `?` with wavy underline — visually distinct from real `?` (`..--..`)
- Error characters on canvas render in **red with dashed underline**
- Hover tooltip on error characters reveals the unrecognized Morse sequence

### 🎨 Premium Design
- Dark theme with ambient purple/blue gradient background
- Glassmorphism card design with subtle backdrop blur
- Realistic glowing light bulb with filament detail
- Wooden telegraph key with brass knob
- Smooth micro-animations and transitions
- Fully responsive layout (mobile + desktop)

---

## 📂 Project Structure

```
morse-compiler/
├── index.html          # Main HTML structure with both mode panels
├── style.css           # Complete dark theme styling & animations
├── script.js           # Morse engine, audio, encoder, decoder & canvas
├── ARCHITECTURE.md     # Detailed architecture & data flow documentation
└── README.md           # This file
```

---

## 🚀 Getting Started

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, Edge)
- No build tools, frameworks, or package managers needed

### Run Locally

1. **Clone the repository**
   ```bash
   git clone https://github.com/manshusainishab/morse-compiler.git
   cd morse-compiler
   ```

2. **Open in browser**
   ```bash
   # Option A: Simply open the file
   open index.html

   # Option B: Use a local server (recommended for Web Audio API)
   python3 -m http.server 8080
   # Then visit http://localhost:8080
   ```

That's it — no `npm install`, no build step, no dependencies!

---

## 🎮 How to Use

### Encoder Mode (Text → Morse)

1. Select the **"Text → Morse"** tab
2. Type your message in the text input area
3. Click **"Encode & Play"**
4. Watch the bulb blink and hear the audio beeps
5. Morse code appears below with live highlighting
6. Adjust speed with the slider, stop anytime with **"Stop"**

### Decoder Mode (Morse → Text)

1. Select the **"Morse → Text"** tab
2. Press & hold **`Space`** (or click the telegraph key):
   - **Short press** → Dot (●)
   - **Long press** → Dash (━)
3. Release and wait briefly — the letter auto-commits
4. Wait longer between letters for a word space
5. Watch your decoded message appear on the canvas
6. Use **`Delete`/`Backspace`** key to undo

---

## 📖 Morse Code Reference

The app includes a built-in expandable reference chart. Here's the standard International Morse Code:

| Letter | Code | Letter | Code | Number | Code |
|--------|------|--------|------|--------|------|
| A | `.-` | N | `-.` | 0 | `-----` |
| B | `-...` | O | `---` | 1 | `.----` |
| C | `-.-.` | P | `.--.` | 2 | `..---` |
| D | `-..` | Q | `--.-` | 3 | `...--` |
| E | `.` | R | `.-.` | 4 | `....-` |
| F | `..-.` | S | `...` | 5 | `.....` |
| G | `--.` | T | `-` | 6 | `-....` |
| H | `....` | U | `..-` | 7 | `--...` |
| I | `..` | V | `...-` | 8 | `---..` |
| J | `.---` | W | `.--` | 9 | `----.` |
| K | `-.-` | X | `-..-` | | |
| L | `.-..` | Y | `-.--` | | |
| M | `--` | Z | `--..` | | |

### Timing Rules
- **Dot**: 1 time unit
- **Dash**: 3 time units
- **Gap between signals** (same letter): 1 time unit
- **Gap between letters**: 3 time units
- **Gap between words**: 7 time units

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| **HTML5** | Semantic page structure |
| **CSS3** | Dark theme, animations, glassmorphism, responsive layout |
| **Vanilla JavaScript** | Morse engine, DOM manipulation, event handling |
| **Web Audio API** | Real-time audio beep generation (sine wave oscillator) |
| **Canvas API** | Decoded message rendering with per-character styling |
| **Google Fonts** | Outfit, Inter, JetBrains Mono typography |

---

## 🧪 Error Handling

### Encoder Input Validation
| Input | Behavior |
|---|---|
| `Hello World` | ✅ Encodes normally |
| `Hello 😀👍 World` | ⚠️ Warning toast — emojis skipped, valid chars encode |
| `Hello © † World` | ⚠️ Warning toast — special chars skipped |
| `😀👍🎉` (only emojis) | 🛑 Error toast — encoding blocked |

### Decoder Error Display
| Scenario | Display |
|---|---|
| Valid sequence `.-` | Normal white `A` on canvas |
| Valid `..--..` | Normal white `?` on canvas |
| Invalid `.-.-.-.-` | 🔴 Red `?` with dashed underline + tooltip + toast warning |

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

## 🤝 Contributing

Contributions are welcome! Feel free to:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

<p align="center">
  <strong>·  —  ·  ·  ·</strong>&nbsp;&nbsp;&nbsp;<strong>·  ·  ·  ·</strong>&nbsp;&nbsp;&nbsp;<strong>·</strong>&nbsp;&nbsp;&nbsp;<strong>·  —</strong>&nbsp;&nbsp;&nbsp;<strong>—  ·  —  ·</strong>
  <br>
  <em>That spells "THENC" — just kidding, it spells ❤️ in Morse spirit!</em>
  <br><br>
  Built with ❤️ using vanilla HTML, CSS & JavaScript
</p>
