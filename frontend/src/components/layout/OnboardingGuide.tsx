"use client";

import { useState, useEffect, useCallback } from "react";
import { X, ChevronRight, ChevronLeft, CheckCircle } from "lucide-react";

interface GuideStep {
  target: string;
  title: string;
  content: string;
  position: "top" | "bottom" | "left" | "right";
}

const GUIDE_STEPS: GuideStep[] = [
  { target: '[data-guide="dashboard"]', title: "Tableau de bord", content: "Vue d'ensemble de votre boutique : ventes, stock, alertes.", position: "bottom" },
  { target: '[data-guide="pos"]', title: "Point de Vente", content: "Enregistrez vos ventes rapidement avec le scanner code-barres.", position: "bottom" },
  { target: '[data-guide="products"]', title: "Produits", content: "Gérez votre catalogue : ajouter, modifier, ajuster le stock.", position: "bottom" },
  { target: '[data-guide="customers"]', title: "Clients", content: "Gérez vos clients et suivez les crédits.", position: "bottom" },
  { target: '[data-guide="orders"]', title: "Commandes", content: "Suivez les commandes de votre boutique en ligne.", position: "bottom" },
  { target: '[data-guide="reports"]', title: "Rapports", content: "Analyses détaillées de vos ventes et performances.", position: "bottom" },
  { target: '[data-guide="settings"]', title: "Paramètres", content: "Configurez votre boutique, impressions, et intégrations.", position: "bottom" },
];

const GUIDE_STORAGE_KEY = "naatal-guide-completed";

export default function OnboardingGuide() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
  const [targetEl, setTargetEl] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const completed = localStorage.getItem(GUIDE_STORAGE_KEY);
    if (!completed) {
      setTimeout(() => setIsVisible(true), 1000);
    }
  }, []);

  const updatePosition = useCallback(() => {
    const step = GUIDE_STEPS[currentStep];
    if (!step) return;
    const el = document.querySelector(step.target) as HTMLElement;
    if (!el) return;
    setTargetEl(el);
    const rect = el.getBoundingClientRect();
    let top = 0;
    let left = 0;
    switch (step.position) {
      case "bottom": top = rect.bottom + 12; left = rect.left + rect.width / 2 - 150; break;
      case "top": top = rect.top - 120; left = rect.left + rect.width / 2 - 150; break;
      case "left": top = rect.top; left = rect.left - 320; break;
      case "right": top = rect.top; left = rect.right + 12; break;
    }
    setTooltipPos({ top: Math.max(8, top), left: Math.max(8, Math.min(left, window.innerWidth - 320)) });
  }, [currentStep]);

  useEffect(() => {
    if (isVisible) updatePosition();
    window.addEventListener("resize", updatePosition);
    return () => window.removeEventListener("resize", updatePosition);
  }, [isVisible, updatePosition]);

  useEffect(() => {
    if (targetEl) {
      targetEl.style.position = "relative";
      targetEl.style.zIndex = "60";
      targetEl.style.boxShadow = "0 0 0 4px rgba(234, 179, 8, 0.5)";
      targetEl.style.borderRadius = "8px";
    }
    return () => {
      if (targetEl) {
        targetEl.style.position = "";
        targetEl.style.zIndex = "";
        targetEl.style.boxShadow = "";
        targetEl.style.borderRadius = "";
      }
    };
  }, [targetEl]);

  const handleNext = () => {
    if (currentStep < GUIDE_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const handleComplete = () => {
    localStorage.setItem(GUIDE_STORAGE_KEY, "true");
    setIsVisible(false);
    setCurrentStep(0);
  };

  if (!isVisible) return null;

  const step = GUIDE_STEPS[currentStep];
  if (!step) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={handleComplete} />
      <div
        className="absolute z-50 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 p-5"
        style={{ top: tooltipPos.top, left: tooltipPos.left }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-primary-600 bg-primary-100 px-2 py-0.5 rounded-full">
              {currentStep + 1}/{GUIDE_STEPS.length}
            </span>
            <h3 className="font-semibold text-gray-900">{step.title}</h3>
          </div>
          <button onClick={handleComplete} className="text-gray-400 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="text-sm text-gray-600 mb-4">{step.content}</p>
        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            {GUIDE_STEPS.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all ${i === currentStep ? "w-6 bg-primary-600" : "w-1.5 bg-gray-300"}`} />
            ))}
          </div>
          <div className="flex gap-2">
            {currentStep > 0 && (
              <button onClick={handlePrev} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
                <ChevronLeft className="h-4 w-4" /> Retour
              </button>
            )}
            <button onClick={handleNext} className="flex items-center gap-1 rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700">
              {currentStep === GUIDE_STEPS.length - 1 ? (
                <><CheckCircle className="h-4 w-4" /> Terminer</>
              ) : (
                <>Suivant <ChevronRight className="h-4 w-4" /></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
