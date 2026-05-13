# Math Minute Drills

A fast-paced math drill mobile app where students answer as many problems as possible before time runs out. Earn points, unlock achievements, and decorate a virtual classroom.

## Run & Operate

- `pnpm --filter @workspace/mobile run dev` — start the Expo mobile app (via workflow)
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000, currently unused)
- Scan the QR code in the Expo workflow logs with Expo Go to test on a real device

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Mobile: Expo / expo-router (file-based routing)
- State: React Context + AsyncStorage (no backend required for core gameplay)
- Fonts: @expo-google-fonts/inter
- Icons: @expo/vector-icons (Feather)
- Haptics: expo-haptics

## Where things live

```
artifacts/mobile/
  app/(tabs)/       # All screens (Stack nav, no tab bar UI)
    index.tsx       # Home screen
    setup.tsx       # Drill setup (operations, time, difficulty)
    game.tsx        # Active drill gameplay
    results.tsx     # Post-drill results + points earned
    achievements.tsx # Badges + claim bonus points
    shop.tsx        # Buy classroom/student items
    classroom.tsx   # Visual classroom scene + equip items
  components/
    NumberPad.tsx   # Auto-submit keypad
    TimerBar.tsx    # Animated countdown bar
    AchievementCard.tsx
  constants/
    achievements.ts # 20 achievements with bonus point values
    shopItems.ts    # 28 shop items across classroom/student categories
    colors.ts       # Dark theme palette
  context/
    GameContext.tsx # All game state + AsyncStorage persistence
  utils/
    mathUtils.ts    # Question generation (add/sub/mul/div × 3 difficulties)
```

## Architecture decisions

- All state in a single React Context + AsyncStorage — no backend needed for core gameplay
- Auto-submit on correct answer: `parseInt(input) === answer` checked on every keypress
- Points are a balance (earned − spent), not tracked as lifetime total
- Achievement bonuses must be manually claimed on the achievements page (intentional friction creates a reward loop)
- Classroom scene uses emoji + View-based rendering (no SVG/image dependencies)
- `(tabs)` group used as a plain Stack (no tab bar UI) — keeps all routes at `/` path level

## Product

- **Drill gameplay**: pick +/−/×/÷ in any combo, choose time (30s–3min), pick difficulty (Easy/Medium/Hard), answer as many questions as possible using a number keypad that auto-submits the instant the answer is correct
- **Points**: earned per drill (10/15/25 pts per answer by difficulty), with streak multipliers (+10/25/50%)
- **20 Achievements**: 3 tiers per operation, score milestones, streak badges, special challenges — each has a claimable bonus point reward
- **Shop**: 28 items across classroom decorations (wall, floor, desk, ceiling) and student customizations (outfit, hat, accessory)
- **Classroom**: visual 2D classroom scene showing equipped items and a customizable student character

## User preferences

_Populate as you build._

## Gotchas

- Web preview shows the app but haptics are disabled on web
- The classroom scene uses `Dimensions.get('window')` for responsive sizing — works on all device sizes
- AsyncStorage key is `@mathdrills_v2` (v1 key from previous session will not migrate — users start fresh)
- `require('@/constants/shopItems')` inside GameContext is intentional to avoid circular import at module level
