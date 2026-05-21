export function Hero() {
  return (
    <section className="relative h-screen w-full overflow-hidden bg-industrial-blue">
      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        poster="/images/hero_section.jpg"
        className="absolute inset-0 h-full w-full object-cover opacity-60"
      >
        <source src="/videos/hero_section.mp4" type="video/mp4" />
      </video>

      {/* Industrial Overlay Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-industrial-blue/40 via-transparent to-industrial-blue" />

      {/* Content */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <span className="inline-block px-3 py-1 mb-6 text-xs font-bold uppercase tracking-widest text-safety-orange border border-safety-orange/50 bg-safety-orange/10 rounded-full">
            Precision Management for Heavy Industry
          </span>
          <h1 className="max-w-4xl text-5xl font-extrabold tracking-tighter text-white md:text-7xl lg:text-8xl">
            FORGE THE FUTURE OF <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-safety-orange to-orange-400">
              RETAIL LOGISTICS
            </span>
          </h1>
          <p className="mx-auto mt-8 max-w-2xl text-lg text-slate-300 md:text-xl font-medium leading-relaxed">
            Unify your hardware enterprise with AnvilOS. Real-time inventory, 
            seamless POS integrations, and supplier logic engineered for reliability.
          </p>
          
          <div className="mt-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <button className="h-14 px-8 bg-safety-orange text-white font-bold rounded-sm hover:bg-orange-600 transition-colors active:scale-95 shadow-lg shadow-safety-orange/20">
              Enter Marketplace
            </button>
            <button className="h-14 px-8 bg-white/10 text-white font-bold rounded-sm border border-white/20 hover:bg-white/20 transition-all active:scale-95 backdrop-blur-sm">
              Live Demo
            </button>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce opacity-50">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </div>
    </section>
  );
}
