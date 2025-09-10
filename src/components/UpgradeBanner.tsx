"use client";

import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';

interface UpgradeBannerProps {
  className?: string;
}

export default function UpgradeBanner({ className = "" }: UpgradeBannerProps) {
  const router = useRouter();

  const handleUpgradeClick = () => {
    router.push('/dashboard/planos');
  };

  return (
    <div 
      className={`bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 cursor-pointer transition-all duration-300 hover:from-blue-700 hover:to-blue-800 hover:shadow-lg ${className}`}
      onClick={handleUpgradeClick}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-white font-bold text-lg mb-2">
            Upgrade para Glow Pro
          </h3>
          <p className="text-blue-100 text-sm leading-relaxed">
            Seu plano gratuito permite até 10 clientes. Para mais cadastros, assine o plano Premium.
          </p>
        </div>
        <button 
          className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors duration-200 flex items-center gap-2 whitespace-nowrap"
          onClick={(e) => {
            e.stopPropagation();
            handleUpgradeClick();
          }}
        >
          Upgrade
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
