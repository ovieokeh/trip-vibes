import SetupForm from "@/components/SetupForm";

export default function Home() {
  return (
    <div className="flex flex-col items-center p-4 bg-base-100 selection:bg-primary selection:text-primary-content min-h-full">
      {/* Background Decor - Emojis - Fixed so they don't scroll with content but don't force overflow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none select-none opacity-20 z-0">
        <span className="absolute top-[10%] left-[10%] text-6xl">✈️</span>
        <span className="absolute top-[20%] right-[15%] text-5xl">🌴</span>
        <span className="absolute bottom-[15%] left-[20%] text-7xl">📸</span>
        <span className="absolute bottom-[20%] right-[10%] text-6xl">🍹</span>
        <span className="absolute top-[40%] left-[5%] text-4xl">🗺️</span>
        <span className="absolute top-[60%] right-[5%] text-5xl">🍜</span>
      </div>

      <div className="text-center space-y-6 z-10 max-w-2xl mx-auto mb-10 mt-8 sm:mt-16">
        <h1 className="w-full flex justify-center gap-2 text-2xl tracking-tighter leading-none">
          Don&apos;t Plan.
          <br />
          <span className="text-primary selection:text-base-content">Just Vibe.</span>
        </h1>
        <p className="text-lg md:text-xl text-base-content/70 font-medium max-w-lg mx-auto">
          Swipe through aesthetic cards. We&apos;ll build a geographically optimized itinerary for you.
        </p>
      </div>

      <div className="w-full max-w-xl z-10 mb-8">
        <SetupForm />
      </div>
    </div>
  );
}
