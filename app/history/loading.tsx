import LoadingState from "@/components/loading-state"

export default function HistoryLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-500 to-blue-600 pt-16 pb-24">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-white mb-8 text-center">Reading History</h1>
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <LoadingState />
          <p className="mt-4 text-white/90 font-medium">Loading your reading history...</p>
        </div>
      </div>
    </div>
  )
} 