# Handoff: Infinite Grid Problem

## The Problem

The app uses React Three Fiber with an **orthographic camera** in an isometric view. We need a ground plane with grid lines that appears infinite - no visible edges no matter how far the user pans or zooms.

### Current State

The file `src/sprenity/web/src/App.tsx` has a broken implementation using `@plackyfantacky/three.infinitegridhelper` which is an unmaintained package. This needs to be replaced.

### What Doesn't Work

1. **Large mesh planes** (e.g., 10000x10000) - With orthographic camera, you can always pan far enough to see edges
2. **Drei's Grid with `infiniteGrid={true}`** - Known bug, doesn't work with orthographic cameras. See: https://github.com/pmndrs/react-three-fiber/discussions/2671
3. **Zoom limits (`minZoom`)** - User can still pan to edges
4. **Random npm packages** - Most are unmaintained or don't support orthographic cameras

## The Actual Solution

Professional 3D apps (Unity, Unreal, Blender) use **shader-based grids** that compute grid lines mathematically per-pixel. The key insight for making it "infinite" with any camera type:

**Move the grid to follow the camera/orbit target every frame.**

```typescript
// In useFrame or render loop
grid.position.x = orbitControls.target.x;
grid.position.z = orbitControls.target.z;
```

This way the grid is always centered on the view, so edges never appear.

## Requirements

1. Dark ground color: `#2A2B38`
2. Grid line color: `#56565c`
3. Grid cell size: 2 units
4. Must work with orthographic camera
5. Must work with OrbitControls panning (right-click drag)
6. No visible edges ever

## Recommended Approach

Write a custom `InfiniteGrid` component using Three.js `ShaderMaterial`:

1. Create a plane geometry (reasonably sized, e.g., 1000x1000)
2. Use a fragment shader that draws grid lines based on world coordinates
3. Use `useFrame` to move the plane to follow the OrbitControls target
4. Set scene background to match ground color

### Shader Algorithm (from "The Best Darn Grid Shader Yet")

```glsl
// Fragment shader core logic
vec2 coord = worldPosition.xz;
vec2 grid = abs(fract(coord - 0.5) - 0.5) / fwidth(coord);
float line = min(grid.x, grid.y);
float gridAlpha = 1.0 - min(line, 1.0);
```

The `fwidth()` function provides automatic anti-aliasing.

## Reference

- The Best Darn Grid Shader Yet: https://bgolus.medium.com/the-best-darn-grid-shader-yet-727f9278b9d8
- Anti-aliased grid shader: https://madebyevan.com/shaders/grid/

## Files to Modify

- `src/sprenity/web/src/App.tsx` - Replace the broken Grid implementation
