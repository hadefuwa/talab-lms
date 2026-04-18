"use client";

interface Props {
  studentName: string;
  courseTitle: string;
  subjectCategory: string;
  completionDate: Date;
  courseId: string;
}

export default function CertificateView({ studentName, courseTitle, subjectCategory, completionDate, courseId }: Props) {
  const dateStr = completionDate.toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric",
  });

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-4 py-10">
      {/* Actions (hidden on print) */}
      <div className="flex gap-3 mb-8 print:hidden">
        <a
          href={`/courses/${courseId}`}
          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm rounded-lg transition-colors"
        >
          ← Back to Course
        </a>
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-talab-600 hover:bg-talab-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Print / Save PDF
        </button>
      </div>

      {/* Certificate */}
      <div
        id="certificate"
        className="w-full max-w-2xl bg-white text-gray-900 rounded-2xl shadow-2xl overflow-hidden print:shadow-none print:rounded-none print:max-w-none"
        style={{ aspectRatio: "1.414 / 1" }}
      >
        {/* Top border accent */}
        <div className="h-3 bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600" />

        <div className="flex flex-col items-center justify-center h-full px-12 py-8 text-center" style={{ height: "calc(100% - 12px)" }}>
          {/* Logo mark */}
          <div className="w-12 h-12 bg-sky-600 rounded-xl flex items-center justify-center text-white font-black text-xl mb-6">
            T
          </div>

          <p className="text-xs font-semibold uppercase tracking-widest text-sky-600 mb-3">
            Certificate of Completion
          </p>

          <p className="text-sm text-gray-500 mb-2">This is to certify that</p>

          <h1 className="text-3xl font-black text-gray-900 mb-2" style={{ fontFamily: "Georgia, serif" }}>
            {studentName}
          </h1>

          <p className="text-sm text-gray-500 mb-3">has successfully completed</p>

          <h2 className="text-xl font-bold text-gray-800 mb-1">{courseTitle}</h2>
          <p className="text-sm text-sky-600 font-medium mb-6">{subjectCategory}</p>

          <div className="w-16 h-px bg-gray-300 mb-6" />

          <p className="text-sm text-gray-400">Awarded on {dateStr}</p>

          <div className="mt-6 flex items-center gap-2">
            <div className="w-5 h-5 bg-sky-600 rounded flex items-center justify-center text-white text-xs font-bold">T</div>
            <span className="text-xs text-gray-400 font-medium">Talab LMS</span>
          </div>
        </div>

        {/* Bottom border accent */}
        <div className="h-1.5 bg-gradient-to-r from-indigo-600 via-blue-600 to-sky-500" />
      </div>

      <style>{`
        @media print {
          body { background: white; }
          .print\\:hidden { display: none !important; }
          #certificate { width: 100vw; height: 100vh; border-radius: 0; box-shadow: none; }
        }
      `}</style>
    </div>
  );
}
