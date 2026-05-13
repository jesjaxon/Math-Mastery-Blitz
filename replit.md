# Math Minute Drills

A fast-paced math drill mobile app where students answer as many problems as possible before time runs out. Earn points, adopt animals, build a rocket, and launch to the moon!

## Run & Operate

- `pnpm --filter @workspace/mobile run dev` — start the Expo mobile app (via workflow)
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000, currently unused)
- Scan the QR code in the Expo workflow logs with Expo Go to test on a real device

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Mobile: Expo / expo-router (file-based routing)
- State: React Context + AsyncStorage (`@mathdrills_v3`)
- Fonts: @expo-google-fonts/inter
- Icons: @expo/vector-icons (Feather)
- Haptics: expo-haptics

## Where things live

```
artifacts/mobile/
  app/(tabs)/
    index.tsx       # Home — points + star coins, 6 nav cards
    setup.tsx       # Drill setup
    game.tsx        # Active drill gameplay
    results.tsx     # Post-drill results + points earned
    achievements.tsx# 35 badges with claimable bonuses
    shop.tsx        # Classroom & student items (42 total)
    classroom.tsx   # Visual classroom scene + equip items + passive rate
    aquarium.tsx    # Sea animal collection + aquarium tank scene
    zoo.tsx         # Land animal collection + zoo scene
    rocket.tsx      # Rocket parts shop (Star Coins only)
    launch.tsx      # Physics mini-game: gravity slingshot to moon
  components/
    NumberPad.tsx   # Auto-submit keypad
    TimerBar.tsx    # Animated countdown bar
    AchievementCard.tsx
  constants/
    achievements.ts # 35 achievements with bonus point values
    shopItems.ts    # 42 shop items with starCoinsPerHour field
    aquariumAnimals.ts # 15 sea animals (common → legendary)
    zooAnimals.ts   # 15 land animals (common → legendary)
    rocketParts.ts  # 6 rocket parts (total 1,850 🪙)
    colors.ts       # Dark theme palette
  context/
    GameContext.tsx # All game state + passive currency + animals + rocket
  utils/
    mathUtils.ts    # Question generation
```

## Architecture decisions

- All state in a single React Context + AsyncStorage — no backend needed
- Auto-submit on correct answer: `parseInt(input) === answer` on every keypress
- **Two currencies**: Points (earned from drills) and Star Coins (earned passively)
- Achievement bonuses manually claimed on Achievements page
- Passive currency tick: calculated on load + every 60s via setInterval
- Classroom scene: emoji + View-based rendering
- Launch mini-game: setInterval physics loop at 30fps, physics stored in refs

## Product

### Drill gameplay
Pick +/−/×/÷ in any combo, choose time (30s–3min), pick difficulty (Easy/Medium/Hard). Auto-submits on correct answer. Points: 10/15/25 per answer × difficulty. Streak multipliers at 5/10/20+.

### Points (⭐)
Earned from drills. Spent in: Shop, Aquarium animals, Zoo animals.

### Star Coins (🪙)
Passive currency earned per hour based on equipped classroom items + displayed aquarium/zoo animals. Spent ONLY to buy rocket parts.

### 35 Achievements
- 4 tiers per operation (×4 = 16)
- Score milestones: 10, 25, 50, 100, 200 correct in one drill
- Streak milestones: 5, 10, 20, 30 in a row
- Drill count: 10, 50, 100 total drills
- Special: All-Rounder, Speed Demon, Mix Master, Hard Hero, Marathon, First Flight
- External: First Purchase, Animal Lover (10 animals), Astronaut (complete launch)

### Shop (42 items)
- Classroom: 23 items across wall, floor, ceiling, desk slots — all produce Star Coins/hr
- Student: 19 items — outfits, hats, accessories (cosmetic)
- Higher prices than before — 150–5000 pts

### Aquarium (15 sea animals)
Dedicated page. Blue ocean tank scene shows displayed animals. Common → Legendary. Each animal produces Star Coins/hr. Buy with regular points.

### School Zoo (15 land animals)
Same structure as Aquarium but green earthy scene. Land animals 🦔→🐯.

### Rocket Assembly
All 6 parts buyable only with Star Coins (total 1,850 🪙). When complete, LAUNCH button activates.

Parts: Solar Panels (150), Fuselage (200), Fuel Tank (250), Engine (350), Navigation (400), Command Module (500).

### Space Launch Mini-game
Full physics simulation (30fps via setInterval):
- Earth 🌍 lower-left, Moon 🌕 upper-right
- Rocket starts orbiting Earth — tap BOOST (2× prograde burns to escape)
- Moon's gravity slingshots the rocket back toward Earth
- Win: visit Moon proximity then return to Earth orbit
- Lose: crash into a body or drift off-screen
- Rocket rotates to face velocity direction; 55-dot trail shown

## User preferences

_Populate as you build._

## Gotchas

- Web preview shows the app but haptics are disabled on web
- AsyncStorage key is `@mathdrills_v3` (v2/v1 data is not migrated)
- Passive currency: `getPassiveRate()` requires equipped classroom items + displayed animals
- Launch game physics: EARTH_MU=320, MOON_MU=65, THRUST_POWER=0.4; needs 2 boosts to escape
- `require('@/constants/shopItems')` inside GameContext is intentional to avoid circular imports
