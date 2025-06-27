import React, { useState, useEffect } from 'react';
import { RefreshCw, ExternalLink, Maximize2, Minimize2 } from 'lucide-react';

interface StreamlitIntegrationProps {
  streamlitUrl?: string;
}

const StreamlitIntegration: React.FC<StreamlitIntegrationProps> = ({ 
  streamlitUrl = "http://localhost:8501" 
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentUrl] = useState(streamlitUrl);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [currentUrl]);

  const handleRefresh = () => {
    setIsLoading(true);
    const iframe = document.getElementById('streamlit-frame') as HTMLIFrameElement;
    if (iframe) {
      iframe.src = iframe.src;
    }
    setTimeout(() => setIsLoading(false), 2000);
  };

  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const openInNewTab = () => {
    window.open(currentUrl, '_blank');
  };

  return (
    <div className="h-screen w-full bg-black flex flex-col">
      {/* Header Bar */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between">
      

        <div className="flex items-center space-x-2">
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          
          <button
            onClick={openInNewTab}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            title="Open in new tab"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
          
          <button
            onClick={handleFullscreen}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white text-lg font-medium">Loading Fishing Zones...</p>
            <p className="text-gray-400 text-sm mt-2">Connecting to AI prediction service</p>
          </div>
        </div>
      )}

      {/* Streamlit iframe */}
      <div className={`flex-1 relative ${isFullscreen ? 'fixed inset-0 z-40' : ''}`}>
        {isFullscreen && (
          <button
            onClick={handleFullscreen}
            className="absolute top-4 right-4 z-50 p-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Minimize2 className="w-5 h-5" />
          </button>
        )}
        
        <iframe
          id="streamlit-frame"
          src={currentUrl}
          className="w-full h-full border-none"
          style={{
            backgroundColor: '#000000',
            colorScheme: 'dark'
          }}
          onLoad={() => {
            setIsLoading(false);
            // Inject CSS to make Streamlit background black
            const iframe = document.getElementById('streamlit-frame') as HTMLIFrameElement;
            if (iframe && iframe.contentDocument) {
              try {
                const style = iframe.contentDocument.createElement('style');
                style.textContent = `
                  .stApp > div:first-child {
                    background-color: #000000 !important;
                  }
                  .main .block-container {
                    background-color: #000000 !important;
                  }
                  .sidebar .sidebar-content {
                    background-color: #111111 !important;
                  }
                `;
                iframe.contentDocument.head.appendChild(style);
              } catch (e) {
                console.log('Cannot inject styles due to CORS policy');
              }
            }
          }}
          title="Fishing Zones Prediction App"
        />
      </div>

      {/* Connection Status */}
      <div className="bg-gray-900 border-t border-gray-800 px-4 py-2">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center space-x-4">
           
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-1 h-1 bg-green-500 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StreamlitIntegration;