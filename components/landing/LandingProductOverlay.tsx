'use client';

import { motion } from 'framer-motion';

/** 사진 위 미니 product — editorial 톤 */
export function LandingProductOverlay({ className = '' }: { className?: string }) {
  return (
    <motion.div
      className={`editorial-product rounded-lg overflow-hidden w-full max-w-[300px] ${className}`}
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <div className="px-4 py-2.5 border-b border-[#1a1816]/6 flex justify-between text-[10px] editorial-muted">
        <span>mathinsight</span>
        <span>흐름 · 4</span>
      </div>
      <div className="p-4 space-y-2.5 bg-white">
        {[
          { l: '시험', v: '68' },
          { l: '숙제', v: '미완' },
          { l: '다음', v: '유형 풀이' },
        ].map((row) => (
          <div key={row.l} className="flex justify-between text-[11px]">
            <span className="editorial-muted">{row.l}</span>
            <span className="editorial-ink font-medium">{row.v}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
