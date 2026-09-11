import React from "react";

export const AwningCanopy: React.FC = () => {
  // 13 Stripes for a balanced symmetrical green-to-green luxury storefront awning
  // Strip 0: Green, 1: White, 2: Green, 3: White, 4: Green, 5: White, 6: Green, 7: White, 8: Green, 9: White, 10: Green, 11: White, 12: Green
  const stripeWidth = 70;
  const startOffset = 45; // Offset for left 3D building wall perspective
  const stripesCount = 13; // 13 * 70 = 910px

  const stripes = Array.from({ length: stripesCount }, (_, i) => {
    const isGreen = i % 2 === 0;
    const x1 = startOffset + i * stripeWidth;
    const x2 = x1 + stripeWidth;
    const midX = (x1 + x2) / 2;
    return { id: i, isGreen, x1, x2, midX };
  });

  const totalAwningWidth = startOffset + stripesCount * stripeWidth; // 45 + 910 = 955
  const viewBoxWidth = 1000;

  return (
    <div className="relative w-full select-none pointer-events-none -mx-4 -mt-3 sm:-mt-4 mb-0 overflow-visible z-20">
      <svg
        viewBox={`0 0 ${viewBoxWidth} 142`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto block filter drop-shadow-[0_20px_28px_rgba(0,0,0,0.55)]"
        preserveAspectRatio="none"
      >
        <defs>
          {/* 1. Cylindrical 3D Green Fabric Gradient (Convex tubular light with fabric texture feel) */}
          <linearGradient id="realGreenRib" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#011e10" />
            <stop offset="12%" stopColor="#023b1f" />
            <stop offset="38%" stopColor="#086e3c" />
            <stop offset="50%" stopColor="#109855" />
            <stop offset="62%" stopColor="#086e3c" />
            <stop offset="88%" stopColor="#023b1f" />
            <stop offset="100%" stopColor="#011e10" />
          </linearGradient>

          {/* 2. Cylindrical 3D White Fabric Gradient (Convex tubular light with soft fabric sheen) */}
          <linearGradient id="realWhiteRib" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#809388" />
            <stop offset="14%" stopColor="#b4c5bc" />
            <stop offset="38%" stopColor="#eef4f0" />
            <stop offset="50%" stopColor="#ffffff" />
            <stop offset="62%" stopColor="#eef4f0" />
            <stop offset="86%" stopColor="#b4c5bc" />
            <stop offset="100%" stopColor="#809388" />
          </linearGradient>

          {/* 3. Scallop 3D Green Drop Gradient */}
          <linearGradient id="realScallopGreen" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#01180d" />
            <stop offset="18%" stopColor="#02351c" />
            <stop offset="50%" stopColor="#076637" />
            <stop offset="82%" stopColor="#02351c" />
            <stop offset="100%" stopColor="#01180d" />
          </linearGradient>

          {/* 4. Scallop 3D White Drop Gradient */}
          <linearGradient id="realScallopWhite" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#76897f" />
            <stop offset="18%" stopColor="#aabcb2" />
            <stop offset="50%" stopColor="#edf5f1" />
            <stop offset="82%" stopColor="#aabcb2" />
            <stop offset="100%" stopColor="#76897f" />
          </linearGradient>

          {/* 5. Overhead Sun Lighting & Perspective Forward Slope */}
          <linearGradient id="awningSunSlope" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#000000" stopOpacity="0.45" />
            <stop offset="18%" stopColor="#ffffff" stopOpacity="0.15" />
            <stop offset="48%" stopColor="#ffffff" stopOpacity="0.32" />
            <stop offset="82%" stopColor="#ffffff" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.45" />
          </linearGradient>

          {/* 6. Front Valance Bend Crease / Under-Fold Deep Shadow */}
          <linearGradient id="valanceFoldShadow" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#000000" stopOpacity="0.8" />
            <stop offset="45%" stopColor="#000000" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </linearGradient>

          {/* 7. Front Metallic Eaves Tubular Highlight Rod */}
          <linearGradient id="frontEavesRod" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="40%" stopColor="#ffffff" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.5" />
          </linearGradient>

          {/* 8. Luxury 3D Metallic Golden Trim Ribbon */}
          <linearGradient id="luxuryGoldTrim" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#946d1b" />
            <stop offset="15%" stopColor="#d4af37" />
            <stop offset="35%" stopColor="#fff3ad" />
            <stop offset="50%" stopColor="#d4af37" />
            <stop offset="70%" stopColor="#fff3ad" />
            <stop offset="85%" stopColor="#d4af37" />
            <stop offset="100%" stopColor="#946d1b" />
          </linearGradient>

          {/* 9. Realistic Beige/Cream Stucco Architectural Wall Facade */}
          <linearGradient id="leftStuccoWall" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#dfceba" />
            <stop offset="40%" stopColor="#ede0d0" />
            <stop offset="80%" stopColor="#f7eee2" />
            <stop offset="100%" stopColor="#cfbca6" />
          </linearGradient>

          <linearGradient id="rightStuccoWall" x1="100%" y1="0%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#dfceba" />
            <stop offset="40%" stopColor="#ede0d0" />
            <stop offset="80%" stopColor="#f7eee2" />
            <stop offset="100%" stopColor="#cfbca6" />
          </linearGradient>
        </defs>

        {/* === 1. REALISTIC BEIGE STOREFRONT WALL FACADE SURROUND === */}
        {/* Left Building Facade Wall */}
        <polygon points={`0,0 ${startOffset},0 ${startOffset},100 0,122`} fill="url(#leftStuccoWall)" />
        <line x1={startOffset} y1="0" x2={startOffset} y2="100" stroke="#a8957e" strokeWidth="1.5" />

        {/* Right Building Facade Wall */}
        <polygon points={`${totalAwningWidth},0 ${viewBoxWidth},0 ${viewBoxWidth},122 ${totalAwningWidth},100`} fill="url(#rightStuccoWall)" />
        <line x1={totalAwningWidth} y1="0" x2={totalAwningWidth} y2="100" stroke="#a8957e" strokeWidth="1.5" />

        {/* === 2. STORE WALL MOUNTING STRIP (Anchored under search bar) === */}
        <rect x={startOffset} y="0" width={stripesCount * stripeWidth} height="5" fill="#01140a" />
        <line x1={startOffset} y1="5" x2={totalAwningWidth} y2="5" stroke="#000000" strokeWidth="2" opacity="0.75" />

        {/* === 3. SLOPING 3D AWNING ROOF (Projecting Forward in 3D Perspective) === */}
        <g>
          {stripes.map((s) => (
            <g key={`roof-${s.id}`}>
              <rect
                x={s.x1}
                y="5"
                width={stripeWidth}
                height="68"
                fill={s.isGreen ? "url(#realGreenRib)" : "url(#realWhiteRib)"}
              />
              {/* Deep Seam Groove Line between panels */}
              <line x1={s.x1} y1="5" x2={s.x1} y2="73" stroke="#000000" strokeWidth="2.2" opacity="0.5" />
            </g>
          ))}
          <line x1={totalAwningWidth} y1="5" x2={totalAwningWidth} y2="73" stroke="#000000" strokeWidth="2.2" opacity="0.5" />

          {/* Sunlight highlight & forward slope perspective lighting overlay */}
          <rect x={startOffset} y="5" width={stripesCount * stripeWidth} height="68" fill="url(#awningSunSlope)" />
        </g>

        {/* === 4. FRONT SUPPORT FRAME ROD & CREASE FOLD === */}
        <rect x={startOffset} y="70" width={stripesCount * stripeWidth} height="3.5" fill="url(#frontEavesRod)" />
        <rect x={startOffset} y="73" width={stripesCount * stripeWidth} height="9" fill="url(#valanceFoldShadow)" />

        {/* === 5. 3D HANGING SCALLOPED VALANCE (Smooth U-Curved waves with realistic fabric drop) === */}
        <g>
          {stripes.map((s) => (
            <g key={`scallop-${s.id}`}>
              {/* Scallop Shape */}
              <path
                d={`M ${s.x1},73 L ${s.x2},73 L ${s.x2},96 Q ${s.midX},124 ${s.x1},96 Z`}
                fill={s.isGreen ? "url(#realScallopGreen)" : "url(#realScallopWhite)"}
              />
              {/* Scallop Separation Crease Line */}
              <line x1={s.x1} y1="73" x2={s.x1} y2="96" stroke="#000000" strokeWidth="2" opacity="0.5" />
            </g>
          ))}
          <line x1={totalAwningWidth} y1="73" x2={totalAwningWidth} y2="96" stroke="#000000" strokeWidth="2" opacity="0.5" />

          {/* Upper Crease Shadow Band */}
          <rect x={startOffset} y="73" width={stripesCount * stripeWidth} height="12" fill="url(#valanceFoldShadow)" opacity="0.85" />

          {/* Dark Gold Piping Outer Shadow/Base */}
          <path
            d={stripes
              .map((s, idx) => `${idx === 0 ? `M ${s.x1},96` : ""} Q ${s.midX},124 ${s.x2},96`)
              .join(" ")}
            stroke="#6e4609"
            strokeWidth="5.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />

          {/* Shiny 3D Metallic Gold Ribbon Trim */}
          <path
            d={stripes
              .map((s, idx) => `${idx === 0 ? `M ${s.x1},96` : ""} Q ${s.midX},124 ${s.x2},96`)
              .join(" ")}
            stroke="url(#luxuryGoldTrim)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />

          {/* Specular White Thread Highlight along Gold Trim */}
          <path
            d={stripes
              .map((s, idx) => `${idx === 0 ? `M ${s.x1},94` : ""} Q ${s.midX},122 ${s.x2},94`)
              .join(" ")}
            stroke="#ffffff"
            strokeWidth="1.2"
            strokeOpacity="0.85"
            fill="none"
          />
        </g>

        {/* === 6. REALISTIC 3D PERSPECTIVE END CAPS (Left & Right 3D Side Fabric Profiles) === */}
        {/* Left Side 3D Fabric Wedge connecting to wall */}
        <polygon points={`${startOffset},5 ${startOffset},96 ${startOffset - 22},75 ${startOffset - 22},5`} fill="#011409" opacity="0.96" />
        <line x1={startOffset - 22} y1="5" x2={startOffset - 22} y2="75" stroke="#000000" strokeWidth="1.8" opacity="0.65" />

        {/* Right Side 3D Fabric Wedge connecting to wall */}
        <polygon points={`${totalAwningWidth},5 ${totalAwningWidth},96 ${totalAwningWidth + 22},75 ${totalAwningWidth + 22},5`} fill="#011409" opacity="0.96" />
        <line x1={totalAwningWidth + 22} y1="5" x2={totalAwningWidth + 22} y2="75" stroke="#000000" strokeWidth="1.8" opacity="0.65" />
      </svg>

      {/* Realistic Deep Cast Shadow Draping over the Store Showcase Window below */}
      <div className="h-7 w-full bg-gradient-to-b from-black/65 via-black/25 to-transparent -mt-5" />
    </div>
  );
};
