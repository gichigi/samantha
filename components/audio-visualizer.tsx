"use client"

interface AudioVisualizerProps {
  isLoading: boolean
  isPlaying: boolean
  audioDuration?: number
  currentTime?: number
}

export default function AudioVisualizer({ 
  isLoading, 
  isPlaying, 
  audioDuration = 0, 
  currentTime = 0 
}: AudioVisualizerProps) {
  
  // Determine animation speed and scale based on state
  const getAnimationStyle = () => {
    if (isLoading) {
      return {
        animation: 'breathe 3s ease-in-out infinite',
      }
    }
    
    if (isPlaying) {
      return {
        animation: 'breathe 2s ease-in-out infinite',
      }
    }
    
    // Paused - slower gentle breathing
    return {
      animation: 'breathe 4s ease-in-out infinite',
    }
  }

  return (
    <div className="flex items-center justify-center h-64 w-full">
      <style jsx>{`
        @keyframes breathe {
          0%, 100% {
            transform: scale(1);
            opacity: 0.8;
          }
          50% {
            transform: scale(1.2);
            opacity: 1;
          }
        }
        
        @keyframes glow {
          0%, 100% {
            filter: drop-shadow(0 0 20px rgba(255, 255, 255, 0.3));
          }
          50% {
            filter: drop-shadow(0 0 40px rgba(255, 255, 255, 0.6));
          }
        }
      `}</style>
      
      <div 
        className="relative"
        style={getAnimationStyle()}
        aria-label={isLoading ? "Loading audio..." : isPlaying ? "Playing audio" : "Audio paused"}
      >
        {/* Main circle */}
        <div 
          className="w-32 h-32 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/40"
          style={{
            animation: 'glow 2s ease-in-out infinite',
          }}
        />
        
        {/* Inner circle */}
        <div 
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="w-20 h-20 rounded-full bg-white/30 backdrop-blur-sm" />
        </div>
      </div>
    </div>
  )
}
