"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Store,
  ShoppingCart,
  BarChart3,
  Smartphone,
  CreditCard,
  Package,
  Users,
  Globe,
  Shield,
  Zap,
  Brain,
  ArrowRight,
  Check,
  Star,
  Phone,
  MessageCircle,
  Mail,
  ChevronRight,
  Menu,
  X,
  TrendingUp,
  Clock,
  Headphones,
  ChevronUp,
} from "lucide-react";

const features = [
  {
    icon: ShoppingCart,
    title: "Point de Vente (POS)",
    description: "Interface tactile intuitive pour les ventes rapides, gestion du panier et paiements mobiles.",
    color: "from-green-400 to-green-600",
  },
  {
    icon: Package,
    title: "Gestion d'Inventaire",
    description: "Suivi en temps réel des stocks, alertes de stock bas, prédictions IA et codes-barres.",
    color: "from-blue-400 to-blue-600",
  },
  {
    icon: Users,
    title: "Gestion Clients",
    description: "Base de données clients, suivi des crédits, fidélité et historique d'achats.",
    color: "from-purple-400 to-purple-600",
  },
  {
    icon: BarChart3,
    title: "Rapports & Analytics",
    description: "Tableaux de bord, tendances de ventes, comparaison de périodes et top produits.",
    color: "from-orange-400 to-orange-600",
  },
  {
    icon: Globe,
    title: "Boutique en Ligne",
    description: "E-commerce intégré avec panier, livraison et paiements Wave/Orange Money.",
    color: "from-cyan-400 to-cyan-600",
  },
  {
    icon: Smartphone,
    title: "WhatsApp AI",
    description: "Assistant intelligent pour gérer les commandes et clients via WhatsApp en Wolof et Français.",
    color: "from-emerald-400 to-emerald-600",
  },
  {
    icon: Brain,
    title: "Prédictions IA",
    description: "Intelligence artificielle pour anticiper les besoins en réapprovisionnement.",
    color: "from-pink-400 to-pink-600",
  },
  {
    icon: Shield,
    title: "Sécurité Avancée",
    description: "Gestion des rôles, audit logs, session sécurisée et chiffrement des données.",
    color: "from-red-400 to-red-600",
  },
];

const stats = [
  { value: "28+", label: "Fonctionnalités" },
  { value: "3", label: "Langues (FR, WO, EN)" },
  { value: "24/7", label: "Disponibilité" },
  { value: "100%", label: "Mobile-First" },
];

const plans = [
  {
    name: "Gratuit",
    price: "0",
    period: "7 jours",
    description: "Pour démarrer et découvrir",
    features: ["50 produits", "100 clients", "1 employé", "POS & Vente rapide", "Rapports de base"],
    color: "border-gray-200",
    cta: "Essai gratuit",
  },
  {
    name: "Starter",
    price: "5 000",
    period: "F/mois",
    description: "Pour les boutiques qui décollent",
    features: [
      "200 produits",
      "500 clients",
      "3 employés",
      "2 boutiques",
      "Boutique en ligne",
      "Rapports par boutique",
      "Import/Export CSV",
      "Sync hors-ligne",
      "Impression personnalisée",
    ],
    color: "border-blue-500",
    cta: "Commencer",
  },
  {
    name: "Pro",
    price: "10 000",
    period: "F/mois",
    description: "Pour les boutiques en croissance",
    features: [
      "500 produits",
      "1000 clients",
      "5 employés",
      "5 boutiques",
      "Boutique en ligne",
      "WhatsApp Bot IA",
      "Prédictions stock",
      "Suivi livraison",
      "API access",
      "Support prioritaire",
    ],
    color: "border-primary-500 ring-2 ring-primary-500/20",
    popular: true,
    cta: "Commencer",
  },
  {
    name: "Enterprise",
    price: "15 000",
    period: "F/mois",
    description: "Tout illimité — support dédié",
    features: [
      "Produits illimités",
      "Clients illimités",
      "Employés illimités",
      "Boutiques illimitées",
      "Tout le Pro inclus",
      "Support prioritaire dédié",
    ],
    color: "border-yellow-500",
    cta: "Contacter",
  },
];

const testimonials = [
  {
    name: "Fatou Diop",
    role: "Boutiquaine à Dakar",
    text: "Naatal ERP a transformé ma boutique. Je gère tout depuis mon téléphone — ventes, stocks, clients. L'IA prédit même quand réapprovisionner !",
    rating: 5,
  },
  {
    name: "Moussa Ndiaye",
    role: "Gérant de supermarché",
    text: "Le multi-boutique est parfait. Je vois les rapports de chaque magasin séparément. Le WhatsApp Bot réduit le travail de moitié.",
    rating: 5,
  },
  {
    name: "Aissatou Fall",
    role: "Commerçante en ligne",
    text: "La boutique en ligne intégrée m'a permis de vendre partout au Sénégal. Les paiements Wave et Orange Money fonctionnent parfaitement.",
    rating: 5,
  },
];

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
      setShowScrollTop(window.scrollY > 500);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/90 backdrop-blur-lg shadow-lg" : "bg-transparent"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 text-white font-bold shadow-lg shadow-primary-500/25">
                BR
              </div>
              <span className={`text-xl font-bold ${scrolled ? "text-gray-900" : "text-white"}`}>
                Naatal ERP Cloud
              </span>
            </div>

            <div className="hidden lg:flex items-center gap-8">
              <a href="#features" className={`text-sm font-medium transition-colors ${scrolled ? "text-gray-600 hover:text-primary-600" : "text-white/80 hover:text-white"}`}>
                Fonctionnalités
              </a>
              <a href="#pricing" className={`text-sm font-medium transition-colors ${scrolled ? "text-gray-600 hover:text-primary-600" : "text-white/80 hover:text-white"}`}>
                Tarifs
              </a>
              <a href="#testimonials" className={`text-sm font-medium transition-colors ${scrolled ? "text-gray-600 hover:text-primary-600" : "text-white/80 hover:text-white"}`}>
                Avis
              </a>
              <a href="#contact" className={`text-sm font-medium transition-colors ${scrolled ? "text-gray-600 hover:text-primary-600" : "text-white/80 hover:text-white"}`}>
                Contact
              </a>
            </div>

            <div className="hidden lg:flex items-center gap-3">
              <Link href="/login" className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${scrolled ? "text-gray-700 hover:bg-gray-100" : "text-white hover:bg-white/10"}`}>
                Se connecter
              </Link>
              <Link href="/register" className="px-5 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors shadow-lg shadow-primary-500/25">
                Créer un compte
              </Link>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`lg:hidden p-2 rounded-lg ${scrolled ? "text-gray-700" : "text-white"}`}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-gray-200 shadow-lg">
            <div className="px-4 py-4 space-y-3">
              <a href="#features" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium text-gray-700 py-2">Fonctionnalités</a>
              <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium text-gray-700 py-2">Tarifs</a>
              <a href="#testimonials" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium text-gray-700 py-2">Avis</a>
              <a href="#contact" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium text-gray-700 py-2">Contact</a>
              <hr className="border-gray-200" />
              <Link href="/login" className="block text-center px-4 py-2.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50">Se connecter</Link>
              <Link href="/register" className="block text-center px-4 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700">Créer un compte</Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 h-72 w-72 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute bottom-20 right-20 h-96 w-96 rounded-full bg-orange-400/20 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-yellow-400/10 blur-3xl" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 lg:py-0">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm px-4 py-2 mb-6">
                <Zap className="h-4 w-4 text-yellow-400" />
                <span className="text-sm text-white/90">Développé par Abdoulaye Sow</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
                Gérez votre boutique
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-300">
                  en toute simplicité
                </span>
              </h1>
              <p className="text-lg text-white/80 mb-8 max-w-lg">
                La solution ERP tout-en-un pour les commerçants du Sénégal. Inventaire, ventes, crédits, paiements mobiles et boutique en ligne — tout dans une seule application.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-primary-700 bg-white rounded-xl hover:bg-gray-50 transition-all shadow-xl hover:shadow-2xl"
                >
                  Commencer gratuitement
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <a
                  href="#features"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-white border-2 border-white/30 rounded-xl hover:bg-white/10 transition-all"
                >
                  Découvrir les fonctionnalités
                </a>
              </div>
              <div className="flex items-center gap-6 mt-8">
                <div className="flex -space-x-3">
                  {["A", "B", "C", "D"].map((l, i) => (
                    <div key={i} className="h-10 w-10 rounded-full bg-white/20 border-2 border-primary-700 flex items-center justify-center text-sm font-bold text-white">
                      {l}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                  <p className="text-sm text-white/70">500+ commerçants satisfaits</p>
                </div>
              </div>
            </div>

            <div className="hidden lg:block relative">
              <div className="relative bg-white/10 backdrop-blur-lg rounded-3xl p-6 border border-white/20 shadow-2xl">
                <div className="bg-white rounded-2xl p-6 shadow-xl">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-lg">
                      BR
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Tableau de bord</p>
                      <p className="text-xs text-gray-500">Aujourd&apos;hui</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-green-50 rounded-xl p-3">
                      <p className="text-xs text-green-600 font-medium">Ventes</p>
                      <p className="text-xl font-bold text-green-700">24</p>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-3">
                      <p className="text-xs text-blue-600 font-medium">Revenu</p>
                      <p className="text-xl font-bold text-blue-700">485K</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-3">
                    <Brain className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="text-xs font-medium text-gray-900">Prédiction IA</p>
                      <p className="text-[10px] text-gray-500">Réapprovisionner T-Shirt en 3 jours</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="relative -mt-16 z-20">
        <div className="max-w-5xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl font-bold text-primary-600">{stat.value}</p>
                <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary-100 text-primary-700 text-sm font-medium mb-4">
              Fonctionnalités
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Tout ce dont vous avez besoin
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Une suite complète d&apos;outils pour gérer votre boutique efficacement
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-xl hover:border-primary-200 transition-all duration-300 hover:-translate-y-1"
              >
                <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary-100 text-primary-700 text-sm font-medium mb-4">
              Simple et rapide
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Comment ça marche ?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Créez votre compte",
                description: "Inscrivez-vous en 30 secondes avec votre numéro de téléphone. Essai gratuit de 7 jours.",
                icon: Smartphone,
              },
              {
                step: "02",
                title: "Configurez votre boutique",
                description: "Ajoutez vos produits, configurez les paiements et personnalisez votre boutique en ligne.",
                icon: Store,
              },
              {
                step: "03",
                title: "Vendez et grandissez",
                description: "Utilisez le POS pour les ventes, suivez vos rapports et laissez l'IA optimiser vos stocks.",
                icon: TrendingUp,
              },
            ].map((item) => (
              <div key={item.step} className="relative bg-white rounded-2xl p-8 shadow-sm hover:shadow-lg transition-shadow">
                <div className="text-6xl font-bold text-primary-100 absolute top-4 right-6">
                  {item.step}
                </div>
                <div className="relative">
                  <div className="h-14 w-14 rounded-xl bg-primary-100 flex items-center justify-center mb-6">
                    <item.icon className="h-7 w-7 text-primary-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                  <p className="text-gray-500 leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary-100 text-primary-700 text-sm font-medium mb-4">
              Tarifs
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Choisissez votre plan
            </h2>
            <p className="text-lg text-gray-500">
              Commencez gratuitement, évoluez quand vous êtes prêt
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative bg-white rounded-2xl border-2 ${plan.color} p-8 hover:shadow-xl transition-all duration-300 ${plan.popular ? "md:-translate-y-4" : ""}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary-600 text-white text-xs font-bold rounded-full">
                    Le plus populaire
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
                </div>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-sm text-gray-500 ml-1">{plan.price !== "0" ? "F CFA" : ""} {plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3 text-sm text-gray-600">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={`block w-full text-center py-3 rounded-xl font-medium transition-colors ${
                    plan.popular
                      ? "bg-primary-600 text-white hover:bg-primary-700 shadow-lg shadow-primary-500/25"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary-100 text-primary-700 text-sm font-medium mb-4">
              Témoignages
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Aimé par les commerçants
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className={`h-5 w-5 ${i <= t.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-200"}`} />
                  ))}
                </div>
                <p className="text-gray-600 mb-6 leading-relaxed">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 rounded-3xl p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-10 left-10 h-40 w-40 rounded-full bg-white/30 blur-3xl" />
              <div className="absolute bottom-10 right-10 h-60 w-60 rounded-full bg-orange-400/30 blur-3xl" />
            </div>
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Prêt à transformer votre boutique ?
              </h2>
              <p className="text-lg text-white/80 mb-8 max-w-xl mx-auto">
                Rejoignez 500+ commerçants qui utilisent déjà Naatal ERP pour gérer et développer leur activité.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-primary-700 bg-white rounded-xl hover:bg-gray-50 transition-all shadow-xl"
                >
                  Commencer maintenant
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-white border-2 border-white/30 rounded-xl hover:bg-white/10 transition-all"
                >
                  Se connecter
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact / Developer */}
      <section id="contact" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <span className="inline-block px-4 py-1.5 rounded-full bg-primary-100 text-primary-700 text-sm font-medium mb-4">
                Contact
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Besoin d&apos;aide ?
              </h2>
              <p className="text-lg text-gray-500 mb-8">
                Notre équipe est disponible pour vous accompagner.
              </p>

              <div className="space-y-4">
                <a href="tel:+221776621410" className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all">
                  <div className="h-12 w-12 rounded-xl bg-primary-100 flex items-center justify-center">
                    <Phone className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Téléphone</p>
                    <p className="text-sm text-gray-500">+221 77 662 14 10</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400 ml-auto" />
                </a>

                <a href="https://wa.me/221708372127" target="_blank" className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200 hover:border-green-300 hover:shadow-md transition-all">
                  <div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center">
                    <MessageCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">WhatsApp</p>
                    <p className="text-sm text-gray-500">+221 70 837 21 27</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400 ml-auto" />
                </a>

                <a href="mailto:layedevops@gmail.com" className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all">
                  <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
                    <Mail className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Email</p>
                    <p className="text-sm text-gray-500">layedevops@gmail.com</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400 ml-auto" />
                </a>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                  BR
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">Naatal ERP Cloud</h3>
                  <p className="text-sm text-gray-500">ERP Boutique & POS</p>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-start gap-3">
                  <Headphones className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Support prioritaire</p>
                    <p className="text-xs text-gray-500">Assistance rapide par WhatsApp et téléphone</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Mises à jour gratuites</p>
                    <p className="text-xs text-gray-500">Nouvelles fonctionnalités régulières</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Données sécurisées</p>
                    <p className="text-xs text-gray-500">Chiffrement et sauvegarde automatique</p>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-200">
                <p className="text-xs text-gray-400 text-center">
                  Développé avec passion au Sénégal
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Developer Section */}
      <section className="py-16 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-bold text-white mb-4">
                Développé par{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-orange-400">
                  Abdoulaye Sow
                </span>
              </h3>
              <p className="text-gray-400 mb-6 leading-relaxed">
                Ingénieur logiciel passionné par la technologie au service du commerce africain.
                Naatal ERP est né du besoin réel des commerçants sénégalais de disposer d&apos;un outil
                moderne, accessible et adapté à leur réalité.
              </p>
              <div className="flex flex-wrap gap-3">
                <span className="px-3 py-1 rounded-full bg-white/10 text-sm text-white/80">FastAPI</span>
                <span className="px-3 py-1 rounded-full bg-white/10 text-sm text-white/80">Next.js</span>
                <span className="px-3 py-1 rounded-full bg-white/10 text-sm text-white/80">PostgreSQL</span>
                <span className="px-3 py-1 rounded-full bg-white/10 text-sm text-white/80">OpenAI</span>
                <span className="px-3 py-1 rounded-full bg-white/10 text-sm text-white/80">WhatsApp API</span>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary-400 to-orange-400 flex items-center justify-center text-white font-bold text-lg">
                  AS
                </div>
                <div>
                  <p className="font-semibold text-white">Abdoulaye Sow</p>
                  <p className="text-sm text-gray-400">Développeur Full-Stack</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm text-gray-300">
                  <Phone className="h-4 w-4 text-primary-400" />
                  +221 77 662 14 10
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-300">
                  <MessageCircle className="h-4 w-4 text-green-400" />
                  +221 70 837 21 27 (WhatsApp)
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-300">
                  <Mail className="h-4 w-4 text-blue-400" />
                  layedevops@gmail.com
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-950 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 text-white font-bold">
                BR
              </div>
              <div>
                <p className="font-semibold text-white">Naatal ERP Cloud</p>
                <p className="text-xs text-gray-500">ERP Boutique & POS</p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <Link href="/login" className="text-sm text-gray-400 hover:text-white transition-colors">
                Connexion
              </Link>
              <Link href="/register" className="text-sm text-gray-400 hover:text-white transition-colors">
                Inscription
              </Link>
              <a href="#features" className="text-sm text-gray-400 hover:text-white transition-colors">
                Fonctionnalités
              </a>
              <a href="#pricing" className="text-sm text-gray-400 hover:text-white transition-colors">
                Tarifs
              </a>
            </div>

            <p className="text-sm text-gray-500">
              &copy; {new Date().getFullYear()} Naatal ERP Cloud — Développé par Abdoulaye Sow. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>
      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full bg-primary-600 text-white shadow-lg shadow-primary-500/30 hover:bg-primary-700 hover:shadow-xl hover:scale-110 transition-all duration-300 flex items-center justify-center"
          aria-label="Retour en haut"
        >
          <ChevronUp className="h-6 w-6" />
        </button>
      )}
    </div>
  );
}
