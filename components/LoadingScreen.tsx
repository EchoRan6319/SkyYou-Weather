
import React from 'react';
import { Cloud, Sun } from 'lucide-react';

interface Props {
  status?: string;
}

const LoadingScreen: React.FC<Props> = ({ status = "SkyYou" }) => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#fdfcff] transition-opacity duration-500">
      <div className="relative w-32 h-32 flex items-center justify-center mb-8">
        {/* Background Glow */}
        <div className="absolute inset-0 bg-blue-100 rounded-full blur-3xl opacity-60 animate-breathe"></div>
        
        {/* Sun Icon */}
        <div className="absolute top-0 right-0 animate-spin-slow">
           <Sun 
             size={64} 
             className="text-orange-400 drop-shadow-lg" 
             strokeWidth={1.5}
           />
        </div>

        {/* Cloud Icon floating in front */}
        <div className="absolute bottom-2 left-2 animate-float z-10">
           <Cloud 
             size={64} 
             className="text-[#4c8df6] drop-shadow-xl fill-white" 
             strokeWidth={1.5}
           />
        </div>
      </div>

      <div className="text-center space-y-2 animate-slide-up">
        <h1 className="text-3xl font-bold text-[#1f1f1f] tracking-tight font-sans">
          SkyYou
        </h1>
        {status && (
          <p className="text-sm font-medium text-gray-400 uppercase tracking-widest">
            {status}
          </p>
        )}
      </div>

      {/* Progress Bar */}
      <div className="absolute bottom-12 w-48 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-[#4c8df6] rounded-full animate-[loading_1.5s_ease-in-out_infinite]" style={{ width: '40%' }}></div>
      </div>
      
      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(100%); width: 60%; }
          100% { transform: translateX(200%); }
        }
        .animate-spin-slow {
          animation: spin 12s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;
