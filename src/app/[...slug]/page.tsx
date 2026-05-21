export default function SubPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const segments = typeof params === "object" && "then" in params
    ? [] : (params as any).slug || [];

  const title = segments.length
    ? (segments as string[]).map((s: string) => s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, " ")).join(" / ")
    : "Page";

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F1F5F9]">
      <div className="text-center max-w-lg mx-auto px-6">
        <h1 className="text-3xl font-bold text-[#0e212c] mb-4">{title}</h1>
        <p className="text-[#64748b]">This page is under development. Check back soon.</p>
        <a href="/" className="inline-block mt-6 px-6 py-2.5 bg-gradient-to-r from-[#fd761a] to-[#e56600] text-white text-sm font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all">
          Back to Home
        </a>
      </div>
    </div>
  );
}
