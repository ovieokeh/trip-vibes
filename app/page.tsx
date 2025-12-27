import SetupForm from "@/components/SetupForm";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] gap-8 p-4">
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-black tracking-tighter">
          Don&apos;t Plan.
          <br />
          Just Vibe.
        </h1>
        <p className="text-xl text-base-content/70 max-w-md mx-auto">
          Swipe through aesthetic cards. We&apos;ll build a geographically optimized itinerary for you.
        </p>
      </div>

      <div className="card bg-base-100 w-full shadow-xl border border-base-200">
        <div className="card-body">
          <SetupForm />
        </div>
      </div>
    </div>
  );
}
