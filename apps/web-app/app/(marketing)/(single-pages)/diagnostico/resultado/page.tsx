import { Suspense } from "react";
import ResultadoContent from "./ResultadoContent";

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="loading loading-spinner loading-lg text-teal-600"></div>
    </div>
  );
}

export default function ResultadoPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ResultadoContent />
    </Suspense>
  );
}
