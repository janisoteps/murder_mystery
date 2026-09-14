# Season 3 location workflow

Each location is completed independently in this order:

1. Create a clue-free schematic floor plan.
2. User reviews the floor plan.
3. Revise the floor plan from feedback.
4. User gives final floor-plan approval.
5. Build the clue-free walkable 3D scene.
6. Iterate while the user tests movement, scale, camera, lighting, and environment.
7. Integrate textures supplied by the user.
8. Perform final user testing and fixes.

The 3D scene for a location must not begin before the user explicitly approves that location's floor plan. Test scenes omit clues and case interactions. They include Mara, movement, flashlight control, camera zoom, collision, and any NPC stand-ins needed to judge scale and staging.

## NPC presentation

NPC portraits will be converted into transparent person cutouts. In a 3D scene, each cutout uses a thin shadow-casting plane with a subtle base shadow and constrained camera-facing rotation. The source portrait defines the front appearance. The matching three-second video plays in the conversation interface, preserving its generated background and avoiding a rectangular video texture around the in-world cutout. Animated transparent cutouts can be considered later only if per-frame video masking proves worthwhile.

Background removal and video masking are performed only for NPCs assigned to the location currently being built. This keeps review work focused and avoids processing unused variants before their lighting and scale are known.
