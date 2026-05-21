export function Hero() {
  return (
    <section className="relative h-screen w-full overflow-hidden bg-industrial-blue">
      {/* Animated Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-safety-orange/20 via-industrial-blue/80 to-cyan-900/40 animate-gradient bg-[length:400%_400%]" />

      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        poster="/images/hero_section.jpg"
        className="absolute inset-0 h-full w-full object-cover opacity-50"
      >
        <source src="/videos/hero_section.mp4" type="video/mp4" />
      </video>

      {/* Industrial Overlay Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-industrial-blue/40 via-transparent to-industrial-blue" />

      {/* Floating Orbs */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-safety-orange/10 rounded-full blur-3xl animate-pulse-slow" />
      <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl animate-pulse-slow animation-delay-2000" />

      {/* Content */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <span className="inline-block px-3 py-1 mb-6 text-xs font-bold uppercase tracking-widest text-safety-orange border border-safety-orange/50 bg-safety-orange/10 rounded-full backdrop-blur-sm">
            Precision Management for Heavy Industry
          </span>
          <h1 className="max-w-4xl text-5xl font-extrabold tracking-tighter text-white md:text-7xl lg:text-8xl">
            FORGE THE FUTURE OF <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-safety-orange via-orange-300 to-amber-400 bg-[length:200%_auto] animate-gradient-text">
              RETAIL LOGISTICS
            </span>
          </h1>
          <p className="mx-auto mt-8 max-w-2xl text-lg text-slate-300 md:text-xl font-medium leading-relaxed">
            Unify your hardware enterprise with AnvilOS. Real-time inventory, 
            seamless POS integrations, and supplier logic engineered for reliability.
          </p>
          
          <div className="mt-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <button className="h-14 px-8 bg-safety-orange text-white font-bold rounded-sm hover:bg-orange-600 transition-colors active:scale-95 shadow-lg shadow-safety-orange/20 hover:shadow-xl hover:shadow-safety-orange/30">
              Enter Marketplace
            </button>
            <button className="h-14 px-8 bg-white/10 text-white font-bold rounded-sm border border-white/20 hover:bg-white/20 hover:border-white/40 transition-all active:scale-95 backdrop-blur-md">
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
