import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface FaqItem {
  q: string;
  a: string;
}

export default function Accordion({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="space-y-3">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div
            key={item.q}
            className={`glass overflow-hidden rounded-2xl transition-colors ${
              isOpen ? 'border-iris-400/30 bg-iris-500/[0.06]' : 'hover:border-white/15'
            }`}
          >
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left sm:px-6 sm:py-5"
              aria-expanded={isOpen}
            >
              <span className="font-display text-[15px] font-semibold text-slate-100 sm:text-base">{item.q}</span>
              <ChevronDown
                className={`h-5 w-5 shrink-0 text-iris-300 transition-transform duration-300 ${
                  isOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.28, ease: 'easeInOut' }}
                >
                  <p className="px-5 pb-5 text-sm leading-relaxed text-slate-400 sm:px-6 sm:pb-6">{item.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
