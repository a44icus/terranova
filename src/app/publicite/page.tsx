import Link from 'next/link'
import PubliciteContactForm from './PubliciteContactForm'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'

const FORMATS = [
  {
    id: 'pin',
    emoji: '📍',
    nom: 'Pin',
    description: 'Pastille colorée affichée directement sur la carte, dans le style des annonces immobilières.',
    avantages: ['Discret et natif', 'Visible dès zoom 13', 'Clic direct vers votre site'],
    prix: '49 € / mois',
    highlight: false,
  },
  {
    id: 'banner',
    emoji: '🏷️',
    nom: 'Banner',
    description: 'Bulle élargie avec titre et description, plus visible que le pin. Idéal pour les agences.',
    avantages: ['Titre + description', 'Fort impact visuel', 'Popup au survol', 'Lien cliquable'],
    prix: '99 € / mois',
    highlight: true,
  },
  {
    id: 'card',
    emoji: '🃏',
    nom: 'Carte',
    description: 'Carte complète avec image, description et bouton d\'appel à l\'action. Le format premium.',
    avantages: ['Image personnalisée', 'Titre + description', 'Bouton CTA', 'Popup détaillé'],
    prix: '199 € / mois',
    highlight: false,
  },
]

const FAQ = [
  {
    q: 'Comment fonctionne la publicité sur la carte ?',
    r: 'Votre publicité apparaît directement sur notre carte interactive, visible par tous les utilisateurs qui zooment sur la zone que vous avez choisie. Elle s\'affiche comme un marqueur natif, sans être intrusif.',
  },
  {
    q: 'Puis-je cibler une zone géographique précise ?',
    r: 'Oui. Vous définissez les coordonnées GPS de votre emplacement, et optionnellement un rayon de visibilité. Votre pub ne s\'affiche que lorsque l\'utilisateur consulte cette zone.',
  },
  {
    q: 'Comment sont mesurées les performances ?',
    r: 'Vous avez accès à un tableau de bord avec le nombre d\'impressions (affichages) et de clics, ainsi que le taux de clic (CTR). Les données sont mises à jour en temps réel.',
  },
  {
    q: 'Quel est l\'engagement minimal ?',
    r: 'Aucun engagement minimum. Vous payez au mois, vous pouvez arrêter quand vous voulez.',
  },
  {
    q: 'Comment soumettre ma publicité ?',
    r: 'Remplissez le formulaire ci-dessous. Notre équipe valide votre publicité sous 24h puis la configure sur la carte.',
  },
]

export default async function PublicitePage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <SiteHeader />

      {/* Hero */}
      <section className="bg-[#0F172A] text-white py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white/70 text-xs font-medium px-3 py-1.5 rounded-full mb-6 border border-white/10">
            📍 Publicité géolocalisée
          </div>
          <h1 className="font-serif text-5xl mb-6 leading-tight">
            Touchez les acheteurs<br />
            <span className="italic" style={{ color: '#4F46E5' }}>là où ils cherchent</span>
          </h1>
          <p className="text-white/60 text-lg max-w-2xl mx-auto mb-8">
            Affichez votre agence, programme neuf ou service directement sur la carte interactive
            consultée par des milliers d'acheteurs et locataires chaque mois.
          </p>
          <a href="#formats"
            className="inline-flex items-center gap-2 bg-[#4F46E5] text-white font-semibold px-6 py-3 rounded-xl hover:bg-[#4338CA] transition-colors">
            Voir les formats →
          </a>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white border-b border-[#0F172A]/08 py-10 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-8 text-center">
          {[
            { value: '12 000+', label: 'Visiteurs / mois' },
            { value: '3 min',   label: 'Temps moyen sur la carte' },
            { value: '100 %',   label: 'Audience qualifiée immobilier' },
          ].map(s => (
            <div key={s.label}>
              <div className="font-serif text-3xl text-[#0F172A] mb-1">{s.value}</div>
              <div className="text-sm text-[#0F172A]/50">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Formats */}
      <section id="formats" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-serif text-4xl text-[#0F172A] mb-3">Nos formats</h2>
            <p className="text-[#0F172A]/50">Choisissez le format adapté à votre objectif</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FORMATS.map(f => (
              <div key={f.id}
                className={`bg-white rounded-2xl border-2 p-7 relative ${
                  f.highlight
                    ? 'border-[#4F46E5] shadow-xl shadow-[#4F46E5]/10'
                    : 'border-[#0F172A]/08 shadow-sm'
                }`}>
                {f.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#4F46E5] text-white text-xs font-semibold px-3 py-1 rounded-full">
                    Le plus populaire
                  </div>
                )}
                <div className="text-4xl mb-4">{f.emoji}</div>
                <h3 className="font-serif text-xl text-[#0F172A] mb-2">{f.nom}</h3>
                <p className="text-sm text-[#0F172A]/55 mb-5 leading-relaxed">{f.description}</p>
                <ul className="space-y-2 mb-7">
                  {f.avantages.map(a => (
                    <li key={a} className="flex items-center gap-2 text-sm text-[#0F172A]/70">
                      <span className="text-green-500 text-xs">✓</span>
                      {a}
                    </li>
                  ))}
                </ul>
                <div className="border-t border-[#0F172A]/08 pt-5">
                  <div className="font-serif text-2xl text-[#0F172A] mb-1">{f.prix}</div>
                  <div className="text-xs text-[#0F172A]/40">Sans engagement · Annulable à tout moment</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-6 bg-white border-t border-[#0F172A]/08">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-serif text-3xl text-[#0F172A] text-center mb-10">Questions fréquentes</h2>
          <div className="space-y-6">
            {FAQ.map((item, i) => (
              <div key={i} className="border-b border-[#0F172A]/08 pb-6 last:border-0">
                <h3 className="font-semibold text-[#0F172A] mb-2">{item.q}</h3>
                <p className="text-sm text-[#0F172A]/60 leading-relaxed">{item.r}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Formulaire contact */}
      <section id="contact" className="py-20 px-6 bg-[#F8FAFC]">
        <div className="max-w-xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="font-serif text-3xl text-[#0F172A] mb-3">Réserver un emplacement</h2>
            <p className="text-[#0F172A]/50 text-sm">Réponse sous 24h · Mise en ligne rapide</p>
          </div>
          <PubliciteContactForm formats={FORMATS.map(f => f.nom)} />
        </div>
      </section>
      <SiteFooter />
    </div>
  )
}
