# CipherCalc — Agent Notes

A "decrypt the equation" puzzle: you're given 4 unique single digits and 3
random operators, the engine evaluates them into a target, and you have to
figure out a digit arrangement that hits that target — sometimes without
seeing the operators or the target itself.

## Files

- **`engine.ts`** — pure functions, no React/DOM. Everything here is unit-testable in isolation.
  - `evaluate(numbers, operations)` — evaluates `n0 op0 n1 op1 n2 op2 n3` with real operator precedence (one pass for `*`/`/`, then one pass for `+`/`-`, both left-to-right via array splicing). Division is `Math.trunc` (toward zero, not floor), and division by zero returns `0` instead of throwing/`Infinity`.
  - `checkAnswer(playerNumbers, operations, target)` — re-evaluates the player's digit arrangement against the *original* operations/target and returns `{ correct, offset, message }`. The operations never change after generation; only the digit *order* is the player's input.
  - `generatePuzzle()` — picks 4 unique digits (Fisher-Yates shuffle of 0-9, take first 4) and 3 random ops, loops until `target !== 0` (a target of 0 would make the puzzle trivially satisfiable by many arrangements, including some that "feel" wrong).
  - `getHiddenOps(difficulty)` / `isTargetVisible(difficulty)` — purely presentational difficulty knobs. They don't change what answer is correct, only what `page.tsx` chooses to mask with `?`.
- **`page.tsx`** — all state, all rendering, all sound effects. No sub-components; the calculator "screen", numpad, and difficulty tabs are all inline JSX in one ~500-line file.

## State shape (`page.tsx`)

`puzzle` (current `Puzzle`), `playerNumbers` (the 4 digits the player has placed, indexed 0-3 — this is the *only* thing the player edits; operations are fixed by the puzzle), `selectedIdx` (which of the 4 boxes the numpad writes into), `difficulty`, `score`, `status` (`{ message, correct } | null`), `showAnswer` (give-up state), `showRules`, `shakeKey` (incremented to force a CSS shake animation replay via `key={shakeKey}`).

## Non-obvious behavior

- **No repeats, all difficulties**: `handleCheck` rejects (and shakes) if `new Set(playerNumbers).size !== 4`, even on easy. This is enforced in the UI layer, not `engine.ts` — the engine will happily evaluate `[1,1,1,1]`.
- **All-zero guard on medium/hard only**: `playerNumbers.every(n => n === 0)` is rejected on medium/hard but *allowed* on easy (where the target is visible, so an all-zero default isn't an exploit).
- **Give Up resets score to 0**, not just reveals the answer — it's a punishment, not a hint.
- **Difficulty colors must be hex literals, not `var(--cyan)` CSS variable strings.** `diffColors[d].color` gets used two ways: as a plain CSS `color` (works fine with `var()`), and concatenated into alpha-suffixed strings like `` `${color}55` `` for box-shadow/gradient stops (`0 0 12px ${color}55`). Concatenating a string suffix onto a `var(--cyan)` reference produces the literal invalid CSS value `var(--cyan)55`, which silently drops that one box-shadow layer — the *whole* `box-shadow` declaration can become `none` if every layer in the comma list is malformed this way. This already bit the difficulty-glow panel border once; keep `diffColors` as `{ color: '#00d4ff', ... }` style hex strings.
- **Panel border is intentionally neutral.** `.crt-frame`'s `border-color` is left at the default `var(--border)` (a near-invisible `#1a1a2e`) at all difficulty levels — difficulty is signaled *only* by the `box-shadow` glow color, matching the glow-only treatment Spectrum Snake and Outcast Gambit use for their boards. Don't reintroduce a `borderColor` override tied to difficulty.
- **Keyboard shortcuts** (`0-9`, arrow keys to move `selectedIdx`, `Enter` to check-or-advance, `Backspace` to clear current box) are wired in a `useEffect` that bails out entirely while `showRules` is true.

## If extending

- New operators: extend the `Operation` union, `ALL_OPS`, `opSymbol`, and both evaluation passes in `evaluate` — precedence grouping is currently hardcoded to `*`/`/` then `+`/`-`, so a new operator needs an explicit decision about which pass it joins.
- New difficulty: add a case to `getHiddenOps`/`isTargetVisible`, and a `diffColors` entry with a hex (not `var()`) color plus a matching `.diff-tab.active-*` class in `globals.css`.
- The puzzle's `numbers` field is the *correct answer* digit order; `playerNumbers` starts at `[0,0,0,0]` and the player rearranges/replaces digits to match. Don't confuse `puzzle.numbers` (answer) with `playerNumbers` (player's current input) when reading `page.tsx`.
