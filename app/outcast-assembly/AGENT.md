# Outcast Assembly — Agent Notes

Chess movement, but the goal isn't checkmate — it's deduction. 6 of the
opponent's 16 pieces are secretly "Outcasts." Every Normal (non-outcast)
opponent piece is bound by one quirk it can never break; Outcasts break
quirks freely. Capture 3 Outcasts to win; lose 8 of your own pieces and you
lose.

## Files

- **`constants.ts`** — types (`Piece`, `Position`, `GameState`), board setup (`createInitialGameState`: mirrored back ranks with medics where a king/queen would sit, random `assignOutcasts` via Fisher-Yates), and display tables (`PIECE_GLYPH`, `PIECE_LABEL`).
- **`engine.ts`** — pure move generation and state transition. No React/DOM.
  - `geometryMoves(piece, pieces)` — raw chess-legal movement *ignoring* Normal-piece quirks. This is what's shown to the player for their own pieces (player pieces never have quirks).
  - `legalMovesForPiece(piece, pieces, turnNumber)` — wraps `geometryMoves` with the quirk filter, but **only for `side === 'opponent' && !isOutcast`** pieces. Player pieces and any Outcast (regardless of side, though only opponent pieces are ever flagged) get the raw geometry back unfiltered.
  - `applyMove(state, move)` — the only function that mutates game state (on a cloned copy). Handles capture/mutual-elimination, ring-swaps, and the medic-trap outcome (see below).
- **`ai.ts`** — opponent's move selection: rescue > mandatory capture > free move (see below).
- **`PieceIcon.tsx`** — SVG glyph per `PieceKind`.
- **`page.tsx`** — board rendering, click/selection state, marks (⚑/✓ note-taking), last-move highlight, rules modal, game-over overlay.

## The quirks (`legalMovesForPiece` in `engine.ts`)

| Piece | Quirk |
|---|---|
| Pawn | Never acts on even turns (`turnNumber % 2 === 0` → no moves at all) |
| Knight | Never crosses the board's center line — locked to whichever half it spawned in (`startX`) |
| Bishop | Never moves more than 2 squares (`diagonalDistance <= 2`) |
| Rook | Won't capture a target that has an orthogonal ally adjacent to it (`hasOrthogonalAlly`) |
| Medic | Only acts on **odd** turns (note: opposite parity from Pawn) — but see rescue priority below, which overrides this in `ai.ts` before the quirk filter is even consulted for "can it act at all" purposes |

Outcasts skip all of this (`if (piece.side === 'player' || piece.isOutcast) return geo;`) — they move with full, unrestricted chess geometry. The player's whole job is to force a Normal piece into a position where the *only* legal/expected move under its quirk differs from what actually happens, exposing it as an Outcast.

## The Medic — immunity and the trap

A Normal (non-outcast) medic can't capture and can't be captured — `isCapturableTarget` in `engine.ts` returns `false` for any non-outcast medic target, for both sides. For sliding/stepping pieces this normally would mean "square is occupied, no move generated, full stop" (a wall).

**But specifically when the *player* attacks an opponent's Normal medic**, a separate path (`isMedicTrap`) generates the move anyway, marked `isMedicTrap: true` instead of `isCapture: true`. `applyMove` resolves it by **eliminating the attacker** and leaving the medic completely untouched (`piecesLost += 1`, no change to the medic). On the board this move renders with the exact same red-square marker as a real capture (`move.isCapture || move.isMedicTrap` share one JSX branch in `page.tsx`) — intentionally indistinguishable, since the whole point is the player can't tell it's a trap until they commit to it.

This asymmetric handling is deliberate: the same immunity applies if the *opponent* AI were to consider attacking the *player's* medic, but that direction stays a hard block (`isMedicTrap` requires `mover.side === 'player'`) — the AI has no use for a risk/reward mechanic against itself, so the opponent simply can never generate a move onto the player's Normal medic at all.

Medic movement itself: steps 1 square any direction (like a king), plus a **ring swap** — instantly swaps position with an ally exactly 2 squares away (Chebyshev distance, `RING_OFFSETS`) in any direction, ignoring anything in between. Swaps are always legal (no quirk applies to `isSwap` moves) and set `hasMoved = true` on both pieces.

## AI decision order (`computeOpponentMove` in `ai.ts`)

1. **Medic rescue** — for each opponent medic, look at its legal ring-swap moves and pick one where `m.to` is under player threat. Note: for a swap move, `m.to` is the **threatened ally's current square** (the medic is moving there; the ally goes to the medic's old square) — so `isSquareThreatenedByPlayer(m.to, pieces)` is correctly checking the ally being rescued, not the medic. This works as a rescue specifically *because* the medic is immune: after the swap, the medic — not the ally — sits on the dangerous square, and the medic can't be captured there (unless it's secretly an Outcast).
2. **Mandatory capture** — if no rescue is needed/possible, any opponent piece with a legal capture must take a *random* one among all available captures (not the "best" one — there's no minimax here, this is a deduction game, not a chess engine).
3. **Free move** — otherwise, a random legal move from any opponent piece. Returns `null` if nothing is legal at all (page.tsx then just passes the turn back to the player).

This priority order itself is part of "the tell": a Normal piece that skips an available capture in favor of obeying its quirk (or that the player baited into one) is how Outcasts get identified — Outcasts have no quirk to obey, so they always take the mandatory capture like a normal chess engine would.

## State & UI notes (`page.tsx`)

- `marks: Map<pieceId, 'suspect' | 'clear'>` is pure player note-taking — zero effect on game logic, just an annotation rendered as a small ⚑/✓ badge in the corner of a cell.
- `lastMove` (tracked in component state, not `GameState`) drives the from/to square tinting (cyan for player, red/danger for opponent) and a small dot on the piece that just moved.
- Game over (`game.status !== 'playing'`) renders a fixed full-screen `.game-over-overlay` with outcasts-captured/pieces-lost stats and a "PLAY AGAIN" button calling `handleRestart` (fully rebuilds `GameState`, including a fresh random Outcast assignment).
- Win/loss stinger sounds are gated in a `useEffect` keyed on `game?.status` specifically so they fire exactly once per status change, not on every re-render.

## If extending

- New piece kind: add to `PieceKind`, `PIECE_GLYPH`/`PIECE_LABEL`, `BACK_RANK` (or pawn-rank logic) in `constants.ts`, a move-generator function plus a `geometryMoves` switch case in `engine.ts`, an SVG case in `PieceIcon.tsx`, and — if it should have a quirk — a case in `legalMovesForPiece`.
- New quirk: quirks are pure filters over `geometryMoves`'s output inside `legalMovesForPiece`'s switch — they should never need to know about Outcast status or side, since the early-return at the top of that function already handles "should this filter even apply."
- Changing win/loss thresholds: `OUTCASTS_TO_WIN`, `TOTAL_OUTCASTS`, `PIECES_LOST_TO_LOSE` in `constants.ts` — `TOTAL_OUTCASTS` should stay comfortably above `OUTCASTS_TO_WIN` or the game becomes trivial/impossible.
