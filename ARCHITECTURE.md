# 🏗️ Architecture & Data Flow

This document describes the internal architecture of the Morse Code Compiler, including component responsibilities, data flow diagrams, and design decisions.

---

## 📐 High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Browser (Client)                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────┐    ┌──────────────┐    ┌───────────┐ │
│  │  index.html   │    │  style.css    │    │ script.js  │ │
│  │  (Structure)  │    │  (Styling)    │    │ (Logic)    │ │
│  └──────┬───────┘    └──────┬───────┘    └─────┬─────┘ │
│         │                   │                   │       │
│         └───────────────────┼───────────────────┘       │
│                             │                           │
│              ┌──────────────┼──────────────┐            │
│              ▼              ▼              ▼            │
│        ┌──────────┐  ┌──────────┐  ┌─────────────┐     │
│        │ Encoder   │  │ Decoder   │  │ Shared       │     │
│        │ Module    │  │ Module    │  │ Components   │     │
│        └──────────┘  └──────────┘  └─────────────┘     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🧩 Component Breakdown

### 1. Morse Code Dictionary
```
┌─────────────────────────────────┐
│        MORSE_CODE (Object)       │
│                                  │
│  'A' → '.-'     'B' → '-...'   │
│  'E' → '.'      '0' → '-----'  │
│  '?' → '..--..' ...             │
│                                  │
│  Total: 54 characters supported  │
├─────────────────────────────────┤
│       MORSE_REVERSE (Object)     │
│                                  │
│  '.-'   → 'A'   '-...' → 'B'  │
│  '.'    → 'E'   '-----' → '0' │
│  Auto-generated from MORSE_CODE │
└─────────────────────────────────┘
```

### 2. Audio Engine (`AudioEngine` class)
```
┌────────────────────────────────────────┐
│            AudioEngine                  │
├────────────────────────────────────────┤
│  Properties:                            │
│  ├── ctx: AudioContext                  │
│  ├── enabled: boolean                   │
│  └── frequency: 700 Hz                 │
├────────────────────────────────────────┤
│  Methods:                               │
│  ├── init()            → Create context │
│  ├── beep(durationMs)  → One-shot tone  │
│  ├── startContinuous() → Sustained tone │
│  ├── stopContinuous()  → Stop tone      │
│  └── toggle()          → Enable/disable │
├────────────────────────────────────────┤
│  Audio Pipeline:                        │
│                                         │
│  OscillatorNode ──→ GainNode ──→ Output │
│  (sine wave)       (envelope)  (speaker)│
└────────────────────────────────────────┘
```

### 3. Toast Notification System
```
┌──────────────────────────────────────┐
│          showToast(msg, type, ms)      │
├──────────────────────────────────────┤
│                                       │
│  Types:  error   → Red background     │
│          warning → Amber background   │
│          info    → Blue background    │
│                                       │
│  Lifecycle:                           │
│  Create → Animate in → Auto-dismiss  │
│              ↑                        │
│        Click × to dismiss early       │
└──────────────────────────────────────┘
```

---

## 🔄 Data Flow: Encoder (Text → Morse)

```
 User Input                    Processing                      Output
 ──────────                   ──────────                      ──────

 ┌──────────┐     ┌────────────────────┐     ┌──────────────────────┐
 │ textarea  │────▶│ Input Validation    │────▶│ Toast Warning        │
 │ "Hello!"  │     │                    │     │ (if unsupported      │
 └──────────┘     │ findUnsupportedChars│     │  chars detected)     │
                  │ sanitizeInput()     │     └──────────────────────┘
                  └────────┬───────────┘
                           │ cleaned text
                           ▼
                  ┌────────────────────┐
                  │ textToMorse()       │
                  │                    │
                  │ "HELLO" →          │
                  │ ".... . .-.. .-..  │
                  │  ---"              │
                  └────────┬───────────┘
                           │
                  ┌────────▼───────────┐
                  │ renderMorseOutput() │
                  │                    │
                  │ Creates <span>     │
                  │ elements per char   │
                  └────────┬───────────┘
                           │
                  ┌────────▼───────────┐     ┌──────────────────────┐
                  │ playMorse()         │────▶│ For each symbol:     │
                  │ (async loop)        │     │                      │
                  │                    │     │  dot  → bulbOn 1 unit │
                  │ Iterates chars,    │     │  dash → bulbOn 3 units│
                  │ then symbols       │     │  gap  → bulbOff       │
                  └────────────────────┘     │                      │
                                             │  + audio.beep()      │
                                             │  + highlight char    │
                                             └──────────────────────┘

 Timing (speed 5 = 140ms per unit):
 ┌───┐ ┌───┐   ┌─────────────┐ ┌───┐
 │ . │ │ . │   │      -       │ │ . │    ← Signal pattern
 └───┘ └───┘   └─────────────┘ └───┘
   ↕     ↕           ↕           ↕
  1u    1u          3u          1u       ← Duration
       ↕                  ↕
      1u gap            1u gap           ← Intra-character gap
              ↕
            3u gap                       ← Inter-character gap
```

---

## 🔄 Data Flow: Decoder (Morse → Text)

```
 User Input                  Processing                     Output
 ──────────                 ──────────                     ──────

 ┌──────────────┐    ┌───────────────────┐
 │ Space key /   │───▶│ keyDown()          │
 │ Telegraph     │    │                   │
 │ click         │    │ Record start time  │
 └──────┬───────┘    │ Start audio        │
        │            │ Animate telegraph   │
        │            │ Start press bar     │
        │            └───────────────────┘
        │
 ┌──────▼───────┐    ┌───────────────────┐
 │ Key release   │───▶│ keyUp()            │
 └──────────────┘    │                   │
                     │ Calculate duration  │
                     │ duration < 2 units  │──▶ Dot  (.)
                     │ duration >= 2 units │──▶ Dash (-)
                     └────────┬──────────┘
                              │
                              │ Append to currentMorse
                              │
                     ┌────────▼──────────┐
                     │ Letter Timeout     │
                     │ (3 units pause)    │
                     └────────┬──────────┘
                              │
                     ┌────────▼──────────┐    ┌────────────────────┐
                     │ commitLetter()     │───▶│ MORSE_REVERSE      │
                     │                   │    │ lookup              │
                     │                   │    │                    │
                     │                   │    │ Found? → {char,    │
                     │                   │    │   isError: false}   │
                     │                   │    │                    │
                     │                   │    │ Not found? →       │
                     │                   │    │  {char: '?',       │
                     │                   │    │   isError: true,    │
                     │                   │    │   morse: sequence}  │
                     │                   │    │  + Warning toast    │
                     └────────┬──────────┘    └────────────────────┘
                              │
                     ┌────────▼──────────┐
                     │ Word Timeout       │
                     │ (7 units pause)    │
                     │                   │
                     │ Add space char     │
                     └────────┬──────────┘
                              │
                     ┌────────▼──────────┐
                     │ drawCanvas()       │
                     │                   │
                     │ Per-character      │
                     │ rendering:         │
                     │                   │
                     │ Normal → white +   │
                     │          purple    │
                     │          glow      │
                     │                   │
                     │ Error  → red +     │
                     │          red glow  │
                     │          + dashed  │
                     │          underline │
                     └──────────────────┘
```

---

## 🧠 Decoder State Machine

```
                    ┌─────────┐
                    │  IDLE    │◀──────────────────────┐
                    │         │                        │
                    └────┬────┘                        │
                         │ keyDown()                   │
                         ▼                             │
                    ┌─────────┐                        │
                    │ KEY_DOWN │                        │
                    │         │──── press bar animates  │
                    │         │──── audio plays         │
                    └────┬────┘                         │
                         │ keyUp()                     │
                         │ (measure duration)          │
                         ▼                             │
                    ┌─────────┐                        │
                    │ SIGNAL   │                        │
                    │ RECORDED │                        │
                    │         │──── dot or dash added   │
                    └────┬────┘    to currentMorse      │
                         │                             │
              ┌──────────┼──────────┐                  │
              │          │          │                   │
              ▼          ▼          ▼                   │
         ┌────────┐ ┌────────┐ ┌──────────┐            │
         │ Another│ │ Letter │ │ Word     │            │
         │ key    │ │Timeout │ │ Timeout  │            │
         │ press  │ │(3 unit)│ │(+4 unit) │            │
         └───┬────┘ └───┬────┘ └────┬─────┘            │
             │          │           │                   │
             │          ▼           ▼                   │
             │    commitLetter() add space              │
             │          │           │                   │
             │          └─────┬─────┘                   │
             │                │                         │
             └────────────────┴─────────────────────────┘
```

---

## 📊 Data Model: Decoder Characters

```
decoderState.decodedChars: Array<CharObject>

CharObject = {
    char: string,       // The displayed character ('A', '?', ' ')
    isError: boolean,   // true if Morse sequence was unrecognized
    morse: string       // Original Morse input ('.-', '.-.-.-.', '')
}

Example state after decoding "HI ? WORLD":
┌──────────────────────────────────────────────────────────┐
│ Index │ char │ isError │ morse    │ Rendering            │
├───────┼──────┼─────────┼──────────┼──────────────────────┤
│   0   │  H   │ false   │ ....     │ White, purple glow   │
│   1   │  I   │ false   │ ..       │ White, purple glow   │
│   2   │ ' '  │ false   │          │ Word space           │
│   3   │  ?   │ true    │ .-.-.-.  │ RED, dashed underline│
│   4   │ ' '  │ false   │          │ Word space           │
│   5   │  W   │ false   │ .--      │ White, purple glow   │
│   6   │  O   │ false   │ ---      │ White, purple glow   │
│   7   │  R   │ false   │ .-.      │ White, purple glow   │
│   8   │  L   │ false   │ .-..     │ White, purple glow   │
│   9   │  D   │ false   │ -..      │ White, purple glow   │
│  10   │  ?   │ false   │ ..--..   │ White, purple glow ← REAL ? │
└──────────────────────────────────────────────────────────┘
```

---

## 🎨 Rendering Pipeline

### Canvas Rendering Flow

```
drawCanvas()
    │
    ├── Clear canvas
    ├── Draw background gradient
    ├── Draw grid lines
    │
    ├── Empty state?
    │   └── Draw placeholder text → return
    │
    ├── Calculate dynamic font size
    │   ├── text.length ≤ 30  → 32px
    │   ├── text.length ≤ 60  → 24px
    │   ├── text.length ≤ 100 → 18px
    │   └── text.length > 100 → 14px
    │
    ├── wordWrapChars() → lines of CharObjects
    │
    ├── For each line:
    │   └── For each CharObject:
    │       ├── isError = true:
    │       │   ├── Fill red (#f87171)
    │       │   ├── Shadow: red glow
    │       │   └── Draw dashed underline
    │       └── isError = false:
    │           ├── Fill white (#e8e8f0)
    │           └── Shadow: purple glow
    │
    └── Draw blinking cursor
        └── requestAnimationFrame(drawCursorBlink)
```

### Bulb Rendering

```
  Bulb OFF                          Bulb ON
  ────────                         ────────

  ┌────────────┐                  ┌────────────┐
  │            │                  │  ✦ GLOW ✦  │  ← radial gradient
  │  ┌──────┐  │                  │  ┌──────┐  │     opacity: 1
  │  │ dark │  │     bulbOn()     │  │ GOLD │  │  ← background: #ffd700
  │  │ gray │  │  ──────────────▶ │  │ GLOW │  │     box-shadow: 30px+60px
  │  │      │  │                  │  │      │  │
  │  └──┬───┘  │                  │  └──┬───┘  │
  │  ┌──┴───┐  │                  │  ┌──┴───┐  │
  │  │ base │  │                  │  │ base │  │
  │  └──────┘  │                  │  └──────┘  │
  └────────────┘                  └────────────┘
      .bulb                         .bulb.on
      .bulb-glow                    .bulb-glow.on
      .bulb-reflection              .bulb-reflection.on
```

---

## 🔧 Configuration & Timing

### Speed Mapping

```
Encoder Speed Slider (1-10):
  Unit Duration = 240 - (speed × 20) ms

  Speed  1 → 220ms  (slowest)
  Speed  5 → 140ms  (default)
  Speed 10 →  40ms  (fastest)

Decoder Sensitivity Slider (1-10):
  Unit Duration = 280 - (speed × 24) ms

  Speed  1 → 256ms  (most forgiving)
  Speed  5 → 160ms  (default)
  Speed 10 →  40ms  (most precise)
```

### Morse Timing (in units)

```
Signal     │ Duration
───────────┼──────────
Dot (.)    │ 1 unit
Dash (-)   │ 3 units
Intra-char │ 1 unit gap
Inter-char │ 3 units gap
Inter-word │ 7 units gap
```

---

## 📁 File Responsibilities

| File | Lines | Responsibility |
|------|-------|---------------|
| `index.html` | ~160 | Page structure, semantic HTML, mode panels, all UI elements |
| `style.css` | ~800 | Design tokens, dark theme, bulb/telegraph styling, animations, toasts, responsive |
| `script.js` | ~900 | Morse dictionary, audio engine, encoder logic, decoder state machine, canvas renderer, error handling |

---

## 🔒 Design Decisions

1. **No framework**: Vanilla JS keeps the project zero-dependency, fast to load, and easy to understand.
2. **Array-based decoded chars**: Using `{char, isError, morse}` objects instead of a plain string enables per-character error styling without ambiguity.
3. **Web Audio API over `<audio>` tags**: Allows precise, programmatic tone generation without pre-recorded audio files.
4. **Canvas for decoded output**: Provides pixel-level control over text rendering, enabling per-character colors, glows, and underlines that HTML text nodes can't easily achieve.
5. **CSS custom properties**: All design tokens in `:root` for easy theming and consistency.
6. **60ms CSS transition on bulb**: Fast enough to feel real-time but smooth enough to avoid flickering artifacts.
