export function DarkraiHeader() {
  return (
    <header className="border-b border-gray-800">
      <div className="max-w-2xl mx-auto px-4 py-5 flex items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-iv/platinum/491.png"
          alt="darkrai"
          width={64}
          height={64}
          style={{ imageRendering: 'pixelated' }}
        />
        <div>
          <h1
            className="font-bold text-white"
            style={{
              fontSize: '2.6rem',
              letterSpacing: '0.1em',
              transform: 'scaleY(0.6)',
              transformOrigin: 'left center',
              display: 'inline-block',
              lineHeight: 1,
            }}
          >SHADOWBALL</h1>
          <p className="text-sm text-gray-500 mt-1 italic tracking-widest">OpenClaw Agent Monitor</p>
        </div>
      </div>
    </header>
  )
}
