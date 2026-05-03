import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Politique cookies — Terranova',
  description: 'Politique de gestion des cookies et traceurs utilisés par Terranova : finalités, durées, gestion du consentement.',
}

const H2 = "text-2xl text-[#0F172A] mb-3"
const H2_STYLE = { fontFamily: "'DM Serif Display', serif" }

export default function CookiesPage() {
  return (
    <>
      {/* Hero */}
      <div className="bg-navy relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse at 85% 40%, rgba(79,70,229,0.18) 0%, transparent 65%), radial-gradient(ellipse at 15% 80%, rgba(124,58,237,0.10) 0%, transparent 55%)',
        }} />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 pt-10 pb-12">
          <p className="text-[11px] font-bold text-primary uppercase tracking-[0.18em] mb-3">Informations légales</p>
          <h1 className="font-serif text-4xl sm:text-5xl text-white leading-tight">Politique cookies</h1>
          <p className="text-white/60 text-sm mt-4 max-w-xl">
            Conforme à la directive ePrivacy 2002/58/CE, à la loi Informatique et Libertés et aux
            recommandations de la CNIL (délibération du 17 septembre 2020).
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="space-y-8 text-[#374151] leading-relaxed">

        <section>
          <h2 className={H2} style={H2_STYLE}>1. Qu&apos;est-ce qu&apos;un cookie ?</h2>
          <p>
            Un cookie est un petit fichier texte déposé sur votre terminal (ordinateur, smartphone,
            tablette) lors de la consultation d&apos;un site web. Il permet au site de mémoriser des
            informations relatives à votre navigation (préférences, identifiant de session, panier…)
            et facilite votre expérience sur le site.
          </p>
          <p className="mt-3 text-sm">
            La présente politique couvre également les autres traceurs (local storage, session
            storage, pixels invisibles, fingerprinting), même s&apos;ils ne sont pas techniquement
            des cookies au sens strict.
          </p>
        </section>

        <section>
          <h2 className={H2} style={H2_STYLE}>2. Cookies utilisés par Terranova</h2>

          <h3 className="font-semibold text-[#0F172A] mt-6 mb-2">🟢 Cookies strictement nécessaires (sans consentement)</h3>
          <p className="text-sm mb-3">
            Ces cookies sont indispensables au fonctionnement du Service. Ils ne nécessitent pas
            votre consentement (article 82 LIL).
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-[#E5E7EB] rounded-lg overflow-hidden">
              <thead className="bg-[#F8FAFC] text-[#0F172A]">
                <tr>
                  <th className="text-left p-3 font-semibold border-b border-[#E5E7EB]">Nom</th>
                  <th className="text-left p-3 font-semibold border-b border-[#E5E7EB]">Finalité</th>
                  <th className="text-left p-3 font-semibold border-b border-[#E5E7EB]">Durée</th>
                </tr>
              </thead>
              <tbody className="text-[#4B5563]">
                <tr className="border-b border-[#E5E7EB]"><td className="p-3"><code>sb-*-auth-token</code></td><td className="p-3">Session d&apos;authentification Supabase</td><td className="p-3">7 jours</td></tr>
                <tr className="border-b border-[#E5E7EB]"><td className="p-3"><code>tn_consent</code></td><td className="p-3">Mémorisation de votre choix concernant les cookies</td><td className="p-3">13 mois</td></tr>
                <tr className="border-b border-[#E5E7EB]"><td className="p-3"><code>tn_carte_prefs</code></td><td className="p-3">Préférences d&apos;affichage de la carte (zoom, style…)</td><td className="p-3">1 an</td></tr>
                <tr><td className="p-3"><code>tn_filtres</code></td><td className="p-3">Mémorisation des filtres de recherche</td><td className="p-3">Session</td></tr>
              </tbody>
            </table>
          </div>

          <h3 className="font-semibold text-[#0F172A] mt-6 mb-2">🔵 Cookies de mesure d&apos;audience (consentement requis)</h3>
          <p className="text-sm mb-3">
            Lorsqu&apos;ils sont activés, ces cookies nous permettent de mesurer la fréquentation du
            site et d&apos;améliorer le Service. Vous pouvez les refuser sans dégrader votre expérience.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-[#E5E7EB] rounded-lg overflow-hidden">
              <thead className="bg-[#F8FAFC] text-[#0F172A]">
                <tr>
                  <th className="text-left p-3 font-semibold border-b border-[#E5E7EB]">Service</th>
                  <th className="text-left p-3 font-semibold border-b border-[#E5E7EB]">Finalité</th>
                  <th className="text-left p-3 font-semibold border-b border-[#E5E7EB]">Durée</th>
                </tr>
              </thead>
              <tbody className="text-[#4B5563]">
                <tr className="border-b border-[#E5E7EB]"><td className="p-3"><strong>Google Analytics 4</strong> <span className="text-[10px] text-[#9CA3AF]">(le cas échéant)</span></td><td className="p-3">Mesure d&apos;audience anonymisée, analyse comportementale</td><td className="p-3">13 mois</td></tr>
                <tr className="border-b border-[#E5E7EB]"><td className="p-3"><strong>Google Tag Manager</strong></td><td className="p-3">Gestion des balises de mesure</td><td className="p-3">Session</td></tr>
                <tr><td className="p-3"><strong>Matomo</strong> <span className="text-[10px] text-[#9CA3AF]">(le cas échéant)</span></td><td className="p-3">Mesure d&apos;audience self-hosted en alternative à Google Analytics</td><td className="p-3">13 mois</td></tr>
              </tbody>
            </table>
          </div>

          <h3 className="font-semibold text-[#0F172A] mt-6 mb-2">🟡 Cookies publicitaires (consentement requis)</h3>
          <p className="text-sm mb-3">
            Ces cookies permettent de mesurer l&apos;efficacité de nos campagnes publicitaires sur
            les réseaux sociaux. Ils sont déposés uniquement après votre consentement explicite.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-[#E5E7EB] rounded-lg overflow-hidden">
              <thead className="bg-[#F8FAFC] text-[#0F172A]">
                <tr>
                  <th className="text-left p-3 font-semibold border-b border-[#E5E7EB]">Service</th>
                  <th className="text-left p-3 font-semibold border-b border-[#E5E7EB]">Finalité</th>
                  <th className="text-left p-3 font-semibold border-b border-[#E5E7EB]">Durée</th>
                </tr>
              </thead>
              <tbody className="text-[#4B5563]">
                <tr><td className="p-3"><strong>Meta Pixel</strong> <span className="text-[10px] text-[#9CA3AF]">(le cas échéant)</span></td><td className="p-3">Suivi de conversion Facebook / Instagram</td><td className="p-3">90 jours</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className={H2} style={H2_STYLE}>3. Gestion de votre consentement</h2>
          <p>
            Lors de votre première visite, un bandeau d&apos;information vous permet de :
          </p>
          <ul className="list-disc list-inside text-sm space-y-1 text-[#4B5563] mt-2">
            <li><strong>Tout accepter</strong> : autorise le dépôt de tous les cookies (techniques, mesure, publicité)</li>
            <li><strong>Tout refuser</strong> : seuls les cookies strictement nécessaires sont déposés</li>
            <li><strong>Personnaliser</strong> : choix catégorie par catégorie</li>
          </ul>
          <p className="mt-3 text-sm">
            Aucun cookie soumis à consentement n&apos;est déposé avant que vous n&apos;ayez exprimé
            votre choix. Le refus est <strong>aussi simple à exprimer que l&apos;acceptation</strong>{' '}
            (recommandation CNIL).
          </p>
          <p className="mt-3 text-sm">
            Vous pouvez modifier votre choix à tout moment en cliquant sur le lien{' '}
            <strong>« Gérer mes cookies »</strong> en bas de page, ou en effaçant les cookies de
            votre navigateur.
          </p>
        </section>

        <section>
          <h2 className={H2} style={H2_STYLE}>4. Configuration de votre navigateur</h2>
          <p>
            Vous pouvez également configurer votre navigateur pour bloquer ou supprimer les cookies :
          </p>
          <ul className="list-disc list-inside text-sm space-y-1 text-[#4B5563] mt-2">
            <li>
              <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-[#4F46E5] hover:underline">Google Chrome</a>
            </li>
            <li>
              <a href="https://support.mozilla.org/fr/kb/protection-renforcee-contre-pistage-firefox-ordinateur" target="_blank" rel="noopener noreferrer" className="text-[#4F46E5] hover:underline">Mozilla Firefox</a>
            </li>
            <li>
              <a href="https://support.apple.com/fr-fr/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-[#4F46E5] hover:underline">Apple Safari</a>
            </li>
            <li>
              <a href="https://support.microsoft.com/fr-fr/microsoft-edge/supprimer-les-cookies-dans-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer" className="text-[#4F46E5] hover:underline">Microsoft Edge</a>
            </li>
          </ul>
          <p className="mt-3 text-sm">
            Le blocage de tous les cookies, y compris techniques, peut empêcher l&apos;accès à
            certaines fonctionnalités du Service (connexion, messagerie, publication).
          </p>
        </section>

        <section>
          <h2 className={H2} style={H2_STYLE}>5. Durée de conservation du consentement</h2>
          <p>
            Votre choix est conservé pour une durée maximale de <strong>13 mois</strong>. À
            l&apos;expiration de ce délai, le bandeau vous sera à nouveau présenté pour recueillir
            votre consentement actualisé.
          </p>
        </section>

        <section>
          <h2 className={H2} style={H2_STYLE}>6. Vos droits</h2>
          <p>
            Vous disposez à tout moment des droits d&apos;accès, de rectification, d&apos;effacement,
            d&apos;opposition et de portabilité sur les données collectées via les cookies. Pour les
            exercer, consultez notre{' '}
            <a href="/legal/confidentialite" className="text-[#4F46E5] hover:underline">
              Politique de confidentialité
            </a>{' '}
            ou contactez-nous à{' '}
            <a href="mailto:dpo@terranova.fr" className="text-[#4F46E5] hover:underline">
              dpo@terranova.fr
            </a>.
          </p>
        </section>

        <p className="text-xs text-[#9CA3AF] pt-4 border-t border-[#E5E7EB]">
          Dernière mise à jour : mai 2026
        </p>
      </div>
      </div>
    </>
  )
}
