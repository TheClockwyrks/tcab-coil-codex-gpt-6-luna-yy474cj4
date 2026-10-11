# Coil

Coil is a neon grid serpent. Guide the growing coil through the arena, collect pellets, and chain them quickly to build a score multiplier before its window drains away.

## Install and play

```sh
npm ci
npm run dev
```

Use **Arrow keys** or **WASD** to steer. Turns take effect on the next grid tick and are buffered briefly. **Enter** or **Space** confirms menu choices, **Escape** backs out, **P** pauses, and **M** toggles sound. Touch players can use the on-screen directional pad and menu controls.

## Production build

```sh
npm run build
npm run preview
```

The production build is a self-contained static site in `dist/`. Generated sprite and audio files are committed under `assets/` and copied into the published asset path.
