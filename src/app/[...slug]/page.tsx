export default async function SubPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const resolved = await params;
  const segments = resolved?.slug || [];
  const title = segments.length
    ? segments.map((s: string) => s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, " ")).join(" / ")
    : "Page";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center max-w-lg mx-auto px-6">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <h1 className="text-3xl font-black text-primary mb-3 tracking-tight">{title}</h1>
        <p className="text-muted-foreground mb-8">We are putting the final touches on this page. Check back soon.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a href="/" className="px-6 py-3 bg-safety-orange text-white text-sm font-bold rounded-lg hover:brightness-110 transition-all shadow-lg shadow-safety-orange/20 text-center">Back to Home</a>
          <a href="/solutions" className="px-6 py-3 border border-border text-primary text-sm font-bold rounded-lg hover:bg-muted transition-all text-center">Explore Features</a>
        </div>
      </div>
    </div>
  );
}



