import { useState } from 'react';
import { copySummary, downloadSummary, printEstimate, whatsappUrl } from '../../lib/share.js';

const Icon = ({ d }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
    <path d={d} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function PrintShareBar({ result, onRestart }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const ok = await copySummary(result);
    setCopied(ok);
    setTimeout(() => setCopied(false), 2200);
  };

  return (
    <div className="no-print flex flex-wrap items-center gap-2">
      <button type="button" className="btn-primary !px-5 !py-2.5" onClick={printEstimate}>
        <Icon d="M7 8V3h10v5M7 18H5a2 2 0 01-2-2v-4a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2h-2M7 15h10v6H7v-6z" />
        Print / Save PDF
      </button>

      <button type="button" className="btn-ghost !px-5 !py-2.5" onClick={handleCopy}>
        <Icon d="M9 9h10v10a2 2 0 01-2 2H9a2 2 0 01-2-2V9zM5 15V5a2 2 0 012-2h10" />
        {copied ? 'Copied' : 'Copy summary'}
      </button>

      <button
        type="button"
        className="btn-ghost !px-5 !py-2.5"
        onClick={() => downloadSummary(result)}
      >
        <Icon d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
        Download .txt
      </button>

      <a
        href={whatsappUrl(result)}
        target="_blank"
        rel="noreferrer"
        className="btn-ghost !px-5 !py-2.5"
      >
        <Icon d="M21 12a9 9 0 01-13.3 7.9L3 21l1.1-4.7A9 9 0 1121 12z" />
        Share
      </a>

      {onRestart && (
        <button
          type="button"
          onClick={onRestart}
          className="ml-auto text-sm font-medium text-dim underline underline-offset-4 hover:text-molten"
        >
          Start over
        </button>
      )}
    </div>
  );
}
