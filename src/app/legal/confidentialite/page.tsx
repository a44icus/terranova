import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Politique de confidentialité — Terranova',
  description: 'Politique de confidentialité et protection des données personnelles (RGPD) de Terranova.',
}

const H2 = "text-2xl text-[#0F172A] mb-3"
const H2_STYLE = { fontFamily: "'DM Serif Display', serif" }

export default function ConfidentialitePage() {
  return (
    <>
      {/* Hero */}
      <div className="bg-navy relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse at 85% 40%, rgba(79,70,229,0.18) 0%, transparent 65%), radial-gradient(ellipse at 15% 80%, rgba(124,58,237,0.10) 0%, transparent 55%)',
        }} />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 pt-10 pb-12">
          <p className="text-[11px] font-bold text-primary uppercase tracking-[0.18em] mb-3">Informations légales</p>
          <h1 className="font-serif text-4xl sm:text-5xl text-white leading-tight">Politique de confidentialité</h1>
          <p className="text-white/60 text-sm mt-4 max-w-xl">
            Conforme au Règlement (UE) 2016/679 (RGPD) et à la loi Informatique et Libertés du 6 janvier 1978 modifiée.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="space-y-8 text-[#374151] leading-relaxed">

        <section>
          <h2 className={H2} style={H2_STYLE}>1. Responsable du traitement</h2>
          <p>
            Le responsable du traitement de vos données personnelles est <strong>Terranova</strong>,
            tel qu&apos;identifié dans les{' '}
            <a href="/legal/mentions-legales" className="text-[#4F46E5] hover:underline">mentions légales</a>.
          </p>
          <p className="mt-3 text-sm">
            Pour toute question relative à vos données personnelles ou pour exercer vos droits, vous
            pouvez nous contacter à :{' '}
            <a href="mailto:dpo@terranova.fr" className="text-[#4F46E5] hover:underline">
              dpo@terranova.fr
            </a>
            {' '}(Délégué à la Protection des Données — DPO).
          </p>
        </section>

        <section>
          <h2 className={H2} style={H2_STYLE}>2. Données collectées</h2>
          <p className="mb-3">
            Nous collectons et traitons les catégories de données suivantes :
          </p>
          <div className="space-y-4">
            <div className="bg-white border border-[#E5E7EB] rounded-lg p-4">
              <h3 className="font-semibold text-[#0F172A] mb-2">Données d&apos;identification (compte)</h3>
              <ul className="list-disc list-inside text-sm space-y-1 text-[#4B5563]">
                <li>Nom, prénom</li>
                <li>Adresse email</li>
                <li>Numéro de téléphone (facultatif, recommandé pour les annonceurs)</li>
                <li>Mot de passe (stocké sous forme <strong>hashée et salée</strong>, jamais en clair)</li>
                <li>Photo de profil (facultatif)</li>
              </ul>
            </div>

            <div className="bg-white border border-[#E5E7EB] rounded-lg p-4">
              <h3 className="font-semibold text-[#0F172A] mb-2">Données liées aux annonces</h3>
              <ul className="list-disc list-inside text-sm space-y-1 text-[#4B5563]">
                <li>Adresse complète du bien (rue, ville, code postal, coordonnées GPS)</li>
                <li>Caractéristiques (surface, pièces, prix, DPE/GES, photos)</li>
                <li>Coordonnées de contact dédiées à l&apos;annonce</li>
              </ul>
            </div>

            <div className="bg-white border border-[#E5E7EB] rounded-lg p-4">
              <h3 className="font-semibold text-[#0F172A] mb-2">Données de paiement (abonnements)</h3>
              <ul className="list-disc list-inside text-sm space-y-1 text-[#4B5563]">
                <li>Identifiant client Stripe (jeton)</li>
                <li>Historique de facturation</li>
                <li className="text-[#DC2626]"><strong>Aucune donnée bancaire</strong> n&apos;est stockée par Terranova : la collecte et le traitement des moyens de paiement sont opérés par <a href="https://stripe.com/fr/privacy" target="_blank" rel="noopener noreferrer" className="text-[#4F46E5] hover:underline">Stripe</a>, prestataire certifié PCI-DSS niveau 1.</li>
              </ul>
            </div>

            <div className="bg-white border border-[#E5E7EB] rounded-lg p-4">
              <h3 className="font-semibold text-[#0F172A] mb-2">Données de communication</h3>
              <ul className="list-disc list-inside text-sm space-y-1 text-[#4B5563]">
                <li>Messages échangés via la messagerie interne</li>
                <li>Demandes de visite, alertes, favoris</li>
              </ul>
            </div>

            <div className="bg-white border border-[#E5E7EB] rounded-lg p-4">
              <h3 className="font-semibold text-[#0F172A] mb-2">Données de navigation et techniques</h3>
              <ul className="list-disc list-inside text-sm space-y-1 text-[#4B5563]">
                <li>Adresse IP (anonymisée pour l&apos;analyse statistique)</li>
                <li>Informations sur le navigateur, l&apos;OS, la résolution d&apos;écran</li>
                <li>Pages visitées, durée de visite, actions effectuées</li>
                <li>Géolocalisation approximative (au niveau ville, via headers d&apos;edge réseau)</li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h2 className={H2} style={H2_STYLE}>3. Finalités et bases légales</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-[#E5E7EB] rounded-lg overflow-hidden">
              <thead className="bg-[#F8FAFC] text-[#0F172A]">
                <tr>
                  <th className="text-left p-3 font-semibold border-b border-[#E5E7EB]">Finalité</th>
                  <th className="text-left p-3 font-semibold border-b border-[#E5E7EB]">Base légale</th>
                </tr>
              </thead>
              <tbody className="text-[#4B5563]">
                <tr className="border-b border-[#E5E7EB]"><td className="p-3">Création et gestion du compte</td><td className="p-3">Exécution du contrat (art. 6.1.b RGPD)</td></tr>
                <tr className="border-b border-[#E5E7EB]"><td className="p-3">Publication et diffusion des annonces</td><td className="p-3">Exécution du contrat</td></tr>
                <tr className="border-b border-[#E5E7EB]"><td className="p-3">Mise en relation entre utilisateurs (messagerie)</td><td className="p-3">Exécution du contrat</td></tr>
                <tr className="border-b border-[#E5E7EB]"><td className="p-3">Facturation et abonnements payants</td><td className="p-3">Exécution du contrat + obligation légale</td></tr>
                <tr className="border-b border-[#E5E7EB]"><td className="p-3">Envoi d&apos;alertes nouvelles annonces</td><td className="p-3">Consentement (révocable à tout moment)</td></tr>
                <tr className="border-b border-[#E5E7EB]"><td className="p-3">Newsletters commerciales</td><td className="p-3">Consentement</td></tr>
                <tr className="border-b border-[#E5E7EB]"><td className="p-3">Sécurité, prévention de la fraude, modération</td><td className="p-3">Intérêt légitime (art. 6.1.f RGPD)</td></tr>
                <tr className="border-b border-[#E5E7EB]"><td className="p-3">Statistiques d&apos;usage anonymisées</td><td className="p-3">Intérêt légitime</td></tr>
                <tr><td className="p-3">Réponse à une obligation légale (réquisition judiciaire)</td><td className="p-3">Obligation légale (art. 6.1.c RGPD)</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className={H2} style={H2_STYLE}>4. Destinataires et sous-traitants</h2>
          <p>
            Vos données ne sont jamais vendues ni cédées à des tiers à des fins commerciales. Elles
            sont communiquées uniquement aux destinataires suivants, dans la stricte limite nécessaire
            à l&apos;exécution du Service :
          </p>
          <div className="overflow-x-auto mt-3">
            <table className="w-full text-sm border border-[#E5E7EB] rounded-lg overflow-hidden">
              <thead className="bg-[#F8FAFC] text-[#0F172A]">
                <tr>
                  <th className="text-left p-3 font-semibold border-b border-[#E5E7EB]">Sous-traitant</th>
                  <th className="text-left p-3 font-semibold border-b border-[#E5E7EB]">Finalité</th>
                  <th className="text-left p-3 font-semibold border-b border-[#E5E7EB]">Localisation</th>
                </tr>
              </thead>
              <tbody className="text-[#4B5563]">
                <tr className="border-b border-[#E5E7EB]"><td className="p-3"><strong>Vercel Inc.</strong></td><td className="p-3">Hébergement applicatif, edge network</td><td className="p-3">UE / USA (DPF)</td></tr>
                <tr className="border-b border-[#E5E7EB]"><td className="p-3"><strong>Supabase Inc.</strong></td><td className="p-3">Base de données, authentification, stockage photos</td><td className="p-3">UE-Ouest (Irlande)</td></tr>
                <tr className="border-b border-[#E5E7EB]"><td className="p-3"><strong>Stripe Payments Europe</strong></td><td className="p-3">Paiement et facturation des abonnements</td><td className="p-3">UE (Irlande)</td></tr>
                <tr className="border-b border-[#E5E7EB]"><td className="p-3"><strong>Resend</strong></td><td className="p-3">Envoi d&apos;emails transactionnels</td><td className="p-3">UE / USA (DPF)</td></tr>
                <tr><td className="p-3"><strong>Cloudflare</strong> (le cas échéant)</td><td className="p-3">Protection DDoS, optimisation réseau</td><td className="p-3">UE / Mondial</td></tr>
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-sm">
            Tous nos sous-traitants sont liés par un accord de traitement des données (Data Processing
            Agreement) conforme à l&apos;article 28 RGPD et présentent des garanties suffisantes en
            matière de sécurité et de confidentialité.
          </p>
        </section>

        <section>
          <h2 className={H2} style={H2_STYLE}>5. Transferts hors Union Européenne</h2>
          <p>
            La grande majorité de vos données est hébergée au sein de l&apos;Union Européenne
            (Supabase région UE-Ouest, Stripe Irlande). Certains sous-traitants (Vercel, Resend) sont
            établis aux États-Unis ; les transferts sont alors encadrés par :
          </p>
          <ul className="list-disc list-inside text-sm space-y-1 text-[#4B5563] mt-2">
            <li>L&apos;adhésion au <strong>Data Privacy Framework</strong> UE-États-Unis (décision d&apos;adéquation du 10 juillet 2023)</li>
            <li>Le cas échéant, des <strong>Clauses Contractuelles Types</strong> (CCT) approuvées par la Commission européenne</li>
            <li>Des mesures complémentaires techniques et organisationnelles appropriées</li>
          </ul>
        </section>

        <section>
          <h2 className={H2} style={H2_STYLE}>6. Durées de conservation</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-[#E5E7EB] rounded-lg overflow-hidden">
              <thead className="bg-[#F8FAFC] text-[#0F172A]">
                <tr>
                  <th className="text-left p-3 font-semibold border-b border-[#E5E7EB]">Type de donnée</th>
                  <th className="text-left p-3 font-semibold border-b border-[#E5E7EB]">Durée</th>
                </tr>
              </thead>
              <tbody className="text-[#4B5563]">
                <tr className="border-b border-[#E5E7EB]"><td className="p-3">Compte actif</td><td className="p-3">Tant que le compte n&apos;est pas supprimé</td></tr>
                <tr className="border-b border-[#E5E7EB]"><td className="p-3">Compte inactif</td><td className="p-3">Suppression ou anonymisation après <strong>3 ans</strong> sans connexion</td></tr>
                <tr className="border-b border-[#E5E7EB]"><td className="p-3">Annonces dépubliées</td><td className="p-3">Archivage 6 mois puis anonymisation</td></tr>
                <tr className="border-b border-[#E5E7EB]"><td className="p-3">Messages de la messagerie interne</td><td className="p-3">2 ans après le dernier échange</td></tr>
                <tr className="border-b border-[#E5E7EB]"><td className="p-3">Données de facturation et factures</td><td className="p-3"><strong>10 ans</strong> (obligation Code de commerce)</td></tr>
                <tr className="border-b border-[#E5E7EB]"><td className="p-3">Logs techniques et de sécurité</td><td className="p-3">12 mois (article L.34-1 CPCE)</td></tr>
                <tr><td className="p-3">Cookies (consentement et préférences)</td><td className="p-3">13 mois maximum</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className={H2} style={H2_STYLE}>7. Vos droits</h2>
          <p className="mb-3">
            Conformément aux articles 15 à 22 du RGPD et à la loi Informatique et Libertés, vous
            disposez à tout moment des droits suivants :
          </p>
          <ul className="list-disc list-inside text-sm space-y-2 text-[#4B5563]">
            <li><strong className="text-[#374151]">Droit d&apos;accès</strong> : obtenir copie des données vous concernant</li>
            <li><strong className="text-[#374151]">Droit de rectification</strong> : corriger toute donnée inexacte ou incomplète</li>
            <li><strong className="text-[#374151]">Droit à l&apos;effacement</strong> (« droit à l&apos;oubli ») : demander la suppression de vos données, sous réserve des obligations légales de conservation</li>
            <li><strong className="text-[#374151]">Droit à la limitation</strong> : demander le gel temporaire du traitement</li>
            <li><strong className="text-[#374151]">Droit d&apos;opposition</strong> : vous opposer au traitement pour motif légitime ou à des fins de prospection</li>
            <li><strong className="text-[#374151]">Droit à la portabilité</strong> : recevoir vos données dans un format structuré, couramment utilisé et lisible par machine</li>
            <li><strong className="text-[#374151]">Droit de retirer votre consentement</strong> à tout moment, sans affecter la licéité du traitement effectué auparavant</li>
            <li><strong className="text-[#374151]">Droit de définir des directives post mortem</strong> sur le sort de vos données après votre décès</li>
            <li><strong className="text-[#374151]">Droit de ne pas faire l&apos;objet d&apos;une décision automatisée</strong> ayant des effets juridiques significatifs (Terranova ne pratique aucun profilage de ce type)</li>
          </ul>
          <p className="mt-3 text-sm">
            Pour exercer ces droits, contactez-nous à{' '}
            <a href="mailto:dpo@terranova.fr" className="text-[#4F46E5] hover:underline">dpo@terranova.fr</a>{' '}
            en justifiant de votre identité (copie d&apos;une pièce d&apos;identité). Nous nous
            engageons à répondre dans un délai maximum de <strong>1 mois</strong> à compter de la
            réception de votre demande, prolongeable de 2 mois en cas de complexité.
          </p>
          <p className="mt-3 text-sm">
            Vous disposez également du <strong>droit d&apos;introduire une réclamation</strong>{' '}
            auprès de la <a href="https://www.cnil.fr/fr/plaintes" target="_blank" rel="noopener noreferrer" className="text-[#4F46E5] hover:underline">CNIL</a> :
          </p>
          <address className="mt-2 not-italic text-sm space-y-0.5">
            <p>3, place de Fontenoy — TSA 80715</p>
            <p>75334 Paris Cedex 07</p>
            <p>Téléphone : 01 53 73 22 22</p>
          </address>
        </section>

        <section>
          <h2 className={H2} style={H2_STYLE}>8. Sécurité</h2>
          <p>
            Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour
            garantir la confidentialité, l&apos;intégrité et la disponibilité de vos données :
          </p>
          <ul className="list-disc list-inside text-sm space-y-1 text-[#4B5563] mt-2">
            <li>Chiffrement des communications de bout en bout (HTTPS / TLS 1.3)</li>
            <li>Hachage des mots de passe avec algorithme bcrypt (jamais stockés en clair)</li>
            <li>Authentification à double facteur disponible sur le compte</li>
            <li>Politique de sécurité du contenu (CSP) stricte</li>
            <li>Sécurité au niveau base de données (RLS Supabase, accès restreint par rôle)</li>
            <li>Audits de sécurité réguliers et veille des vulnérabilités</li>
            <li>Sauvegarde quotidienne chiffrée des données</li>
          </ul>
          <p className="mt-3 text-sm">
            En cas de violation de données susceptible d&apos;engendrer un risque pour vos droits et
            libertés, nous nous engageons à notifier la CNIL dans les <strong>72 heures</strong> et
            à vous en informer sans délai déraisonnable, conformément aux articles 33 et 34 RGPD.
          </p>
        </section>

        <section>
          <h2 className={H2} style={H2_STYLE}>9. Mineurs</h2>
          <p>
            Le Service n&apos;est <strong>pas destiné aux personnes de moins de 18 ans</strong>.
            Nous ne collectons pas sciemment de données concernant des mineurs. Si vous estimez
            qu&apos;un mineur a transmis des données personnelles via la Plateforme, contactez-nous
            à <a href="mailto:dpo@terranova.fr" className="text-[#4F46E5] hover:underline">dpo@terranova.fr</a> :
            nous procéderons à la suppression dans les meilleurs délais.
          </p>
        </section>

        <section>
          <h2 className={H2} style={H2_STYLE}>10. Cookies</h2>
          <p>
            L&apos;utilisation de cookies et traceurs est détaillée dans notre{' '}
            <a href="/legal/cookies" className="text-[#4F46E5] hover:underline">
              Politique de gestion des cookies
            </a>.
          </p>
        </section>

        <section>
          <h2 className={H2} style={H2_STYLE}>11. Modifications de la politique</h2>
          <p>
            La présente politique peut être mise à jour à tout moment afin de tenir compte de
            l&apos;évolution réglementaire ou de nos pratiques. Toute modification substantielle
            sera notifiée par email aux utilisateurs inscrits, au moins 15 jours avant son entrée
            en vigueur.
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
