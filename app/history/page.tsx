import ReadingHistory from "@/components/reading-history"

export default function HistoryPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-500 to-blue-600 pt-16 pb-24">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-white mb-8 text-center">Reading History</h1>
        <ReadingHistory />
      </div>
    </div>
  )
}
