export function LoadingOverlay({
  message = "Loading...",
}: {
  message?: string;
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 shadow-2xl text-center max-w-sm">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-lg font-semibold text-gray-900">{message}</p>
        <div className="loading-dots mt-3">
          <span className="text-blue-500"></span>
          <span className="text-purple-500"></span>
          <span className="text-pink-500"></span>
        </div>
      </div>
    </div>
  );
}
