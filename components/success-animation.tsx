"use client";

import { useEffect, useState } from "react";
import { CheckCircle } from "lucide-react";

export function SuccessAnimation({
  message,
  onComplete,
}: {
  message: string;
  onComplete?: () => void;
}) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      onComplete?.();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeInUp">
      <div className="bg-white rounded-2xl p-8 shadow-2xl text-center max-w-sm animate-bounceIn">
        <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="h-12 w-12 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Success!</h3>
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  );
}
