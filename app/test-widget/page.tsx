'use client';

import { useRef, useState } from 'react';

export default function TestWidgetPage() {
  const [isOpen, setIsOpen] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const focusWidget = () => {
    if (iframeRef.current) {
      iframeRef.current.focus();
      iframeRef.current.contentWindow?.postMessage({ type: 'focus-widget' }, '*');
    }
  };

  const handleToggle = () => {
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);
    // Focus iframe when opening
    if (newIsOpen) {
      setTimeout(focusWidget, 100);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 p-10">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-4">AI Voice Platform</h1>
        <p className="text-white/90 text-lg mb-8">
          This page demonstrates the embeddable chat widget. Look for the chat button in the bottom-right corner!
        </p>

        <div className="bg-white rounded-2xl p-6 shadow-xl mb-6">
          <h2 className="text-xl font-semibold mb-3">How It Works</h2>
          <p className="text-gray-600 mb-4">
            Add a single script tag to any website to embed an AI chat widget:
          </p>
          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
{`<script src="http://localhost:3002/widget.js"
        data-embed-id="your-embed-id"
        data-position="bottom-right"
        data-theme="auto"></script>`}
          </pre>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-xl mb-6">
          <h2 className="text-xl font-semibold mb-3">Test the Demo Widget</h2>
          <p className="text-gray-600 mb-4">
            Click the chat button in the corner, or open the demo directly:
          </p>
          <a
            href="/widget/demo"
            target="_blank"
            className="inline-block bg-indigo-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-600 transition"
          >
            Open Demo Widget
          </a>
        </div>

        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4">
          <p className="text-amber-800 text-sm">
            <strong>Note:</strong> The demo uses Ollama (llama3.2) for responses.
            For production, set up Supabase and create embeds in the dashboard.
          </p>
        </div>
      </div>

      {/* Floating widget button */}
      <div className="fixed bottom-5 right-5 z-50">
        {isOpen && (
          <iframe
            ref={iframeRef}
            src="/widget/demo"
            className="absolute bottom-16 right-0 w-96 h-[600px] rounded-2xl shadow-2xl border-0"
            style={{ maxHeight: 'calc(100vh - 100px)' }}
            onLoad={focusWidget}
          />
        )}
        <button
          onClick={handleToggle}
          tabIndex={-1}
          onMouseDown={(e) => e.preventDefault()}
          className="w-14 h-14 rounded-full bg-indigo-500 text-white flex items-center justify-center shadow-lg hover:bg-indigo-600 transition hover:scale-105"
        >
          {isOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
