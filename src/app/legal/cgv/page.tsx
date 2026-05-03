import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Conditions Générales de Vente — Terranova',
  description: 'Conditions Générales de Vente des abonnements payants Terranova : prix, paiement Stripe, rétractation, résiliation.',
}

const H2 = "text-2xl text-[#0F172A] mb-3"
const H2_STYLE = { fontFamily: "'DM Serif Display', serif" }

export default function CGVPage() {
  return (
    <>
      {/* Hero */}
      <div className="bg-navy relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse at 85% 40%, rgba(79,70,229,0.18) 0%, transparent 65%), radial-gradient(ellipse at 15% 80%, rgba(124,58,237,0.10) 0%, transparent 55%)',
        }} />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 pt-10 pb-12">
          <p className="text-[11px] font-bold text-primary uppercase tracking-[0.18em] mb-3">Informations légales</p>
          <h1 className="font-serif text-4xl sm:text-5xl text-white leading-tight">Conditions Générales de Vente</h1>
          <p className="text-white/60 text-sm mt-4 max-w-xl">
            Applicables aux abonnements payants à compter du 1<sup>er</sup> mai 2026. Ces CGV
            complètent les{' '}
            <a href="/legal/cgu" className="text-white hover:underline">CGU</a>.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="space-y-8 text-[#374151] leading-relaxed">

        <section>
          <h2 className={H2} style={H2_STYLE}>1. Objet</h2>
          <p>
            Les présentes Conditions Générales de Vente (« CGV ») régissent les relations contractuelles
            entre Terranova (le « Vendeur ») et tout utilisateur souscrivant à un abonnement payant
            (« Abonné »), particulier (consommateur) ou professionnel.
          </p>
          <p className="mt-3">
            En souscrivant un abonnement, l&apos;Abonné déclare avoir pris connaissance et accepté
            sans réserve les présentes CGV ainsi que les{' '}
            <a href="/legal/cgu" className="text-[#4F46E5] hover:underline">CGU</a> et la{' '}
            <a href="/legal/confidentialite" className="text-[#4F46E5] hover:underline">
              politique de confidentialité
            </a>.
          </p>
        </section>

        <section>
          <h2 className={H2} style={H2_STYLE}>2. Plans et tarifs</h2>
          <p>
            Terranova propose les plans suivants, dont le détail est accessible sur la page d&apos;accueil
            ou dans l&apos;espace abonné :
          </p>
          <div className="space-y-3 mt-3">
            <div className="bg-white border border-[#E5E7EB] rounded-lg p-4">
              <h3 className="font-semibold text-[#0F172A]">Plan Gratuit — 0 €</h3>
              <p className="text-sm text-[#6B7280] mt-1">
                1 annonce active, jusqu&apos;à 5 photos, contact direct, statistiques de base.
                Sans engagement, durée illimitée.
              </p>
            </div>
            <div className="bg-white border border-[#E5E7EB] rounded-lg p-4">
              <h3 className="font-semibold text-[#0F172A]">Plan Essentiel — 19 € TTC / mois</h3>
              <p className="text-sm text-[#6B7280] mt-1">
                5 annonces actives, jusqu&apos;à 20 photos par bien, mise en avant sur la carte,
                statistiques avancées, support email prioritaire.
              </p>
            </div>
            <div className="bg-white border border-[#E5E7EB] rounded-lg p-4">
              <h3 className="font-semibold text-[#0F172A]">Plan Agence — 49 € TTC / mois</h3>
              <p className="text-sm text-[#6B7280] mt-1">
                Annonces illimitées, page agence dédiée, badge PRO, statistiques + export CSV,
                support téléphonique dédié.
              </p>
            </div>
          </div>
          <p className="mt-3 text-sm">
            Les prix sont indiqués en euros, toutes taxes comprises (TVA française au taux en vigueur).
            Pour les Abonnés professionnels établis dans un pays de l&apos;UE hors France, l&apos;autoliquidation
            de la TVA s&apos;applique sur présentation d&apos;un numéro de TVA intracommunautaire valide.
          </p>
        </section>

        <section>
          <h2 className={H2} style={H2_STYLE}>3. Souscription</h2>
          <p>
            La souscription à un abonnement payant s&apos;effectue en ligne depuis l&apos;espace
            abonné. Le processus de commande comprend les étapes suivantes :
          </p>
          <ol className="list-decimal list-inside text-sm space-y-1 text-[#4B5563] mt-2">
            <li>Sélection du plan et de la périodicité</li>
            <li>Récapitulatif détaillé de la commande (montant, taxes, plan choisi)</li>
            <li>Acceptation explicite des CGV par case à cocher</li>
            <li>Validation et redirection vers la page sécurisée de paiement Stripe</li>
            <li>Confirmation par email de la souscription et envoi de la première facture</li>
          </ol>
          <p className="mt-3 text-sm">
            La validation finale du paiement vaut formation du contrat entre l&apos;Abonné et Terranova.
          </p>
        </section>

        <section>
          <h2 className={H2} style={H2_STYLE}>4. Prix et paiement</h2>
          <p>
            Le paiement est exclusivement effectué en ligne par carte bancaire (Visa, Mastercard,
            American Express) ou par prélèvement SEPA, via le prestataire de paiement{' '}
            <strong>Stripe Payments Europe Ltd</strong>, certifié PCI-DSS niveau 1.
          </p>
          <p className="mt-3 text-sm">
            <strong>Aucune donnée bancaire n&apos;est collectée ou stockée par Terranova.</strong>{' '}
            La saisie et le traitement des coordonnées bancaires sont opérés directement par Stripe
            sur ses infrastructures sécurisées.
          </p>
          <p className="mt-3 text-sm">
            Le prélèvement intervient à la souscription, puis automatiquement à chaque échéance
            (mensuelle ou annuelle selon le plan choisi). Tout retard ou défaut de paiement entraîne
            la suspension immédiate de l&apos;accès aux fonctionnalités payantes après notification
            par email et délai de régularisation de 7 jours.
          </p>
        </section>

        <section>
          <h2 className={H2} style={H2_STYLE}>5. Facturation</h2>
          <p>
            Une facture électronique est générée à chaque prélèvement et envoyée par email à
            l&apos;Abonné. Toutes les factures sont également accessibles à tout moment depuis
            l&apos;espace abonné, rubrique « Facturation ».
          </p>
          <p className="mt-3 text-sm">
            Les factures sont conservées par Terranova pendant <strong>10 ans</strong> conformément
            à l&apos;article L.123-22 du Code de commerce.
          </p>
        </section>

        <section>
          <h2 className={H2} style={H2_STYLE}>6. Reconduction tacite</h2>
          <p>
            Les abonnements sont renouvelés <strong>tacitement</strong> à chaque échéance pour une
            durée identique à la période initiale, sauf résiliation par l&apos;Abonné dans les
            conditions ci-dessous.
          </p>
          <p className="mt-3 text-sm">
            Conformément à l&apos;article L.215-1 du Code de la consommation (loi Chatel), Terranova
            informe l&apos;Abonné consommateur, par email, au plus tôt 3 mois et au plus tard 1 mois
            avant la fin de la période, de sa faculté de ne pas reconduire le contrat.
          </p>
        </section>

        <section>
          <h2 className={H2} style={H2_STYLE}>7. Droit de rétractation (consommateurs)</h2>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-3">
            <p className="text-sm text-amber-900">
              <strong>Important :</strong> en souscrivant un abonnement payant, vous demandez
              expressément l&apos;exécution immédiate du Service. Conformément à l&apos;article
              L.221-28-1° du Code de la consommation, vous renoncez à votre droit de rétractation
              dès lors que le Service a été pleinement exécuté avant la fin du délai de 14 jours,
              ou que son exécution a commencé avec votre accord exprès.
            </p>
          </div>
          <p className="text-sm">
            Si l&apos;Abonné consommateur souhaite conserver son droit de rétractation de{' '}
            <strong>14 jours</strong> à compter de la souscription, il doit cocher la case
            correspondante au moment de la commande, ce qui retardera la mise à disposition des
            fonctionnalités payantes jusqu&apos;à expiration du délai.
          </p>
          <p className="mt-3 text-sm">
            Pour exercer le droit de rétractation, l&apos;Abonné doit notifier sa décision par email
            à <a href="mailto:contact@terranova.fr" className="text-[#4F46E5] hover:underline">contact@terranova.fr</a>{' '}
            ou par courrier au siège social, en utilisant le{' '}
            <a href="https://www.economie.gouv.fr/files/files/directions_services/dgccrf/documentation/fiches_pratiques/fiches/formulaire-retractation.pdf" target="_blank" rel="noopener noreferrer" className="text-[#4F46E5] hover:underline">
              formulaire-type de rétractation
            </a>{' '}
            ou toute autre déclaration dénuée d&apos;ambiguïté. Le remboursement intervient dans
            les 14 jours suivant la rétractation.
          </p>
        </section>

        <section>
          <h2 className={H2} style={H2_STYLE}>8. Résiliation</h2>
          <p>
            <strong>Par l&apos;Abonné :</strong> l&apos;Abonné peut résilier son abonnement à tout
            moment depuis son espace personnel (rubrique « Abonnement → Résilier »). La résiliation
            prend effet à la fin de la période d&apos;abonnement en cours, sans frais ni pénalités.
            <strong> Aucun remboursement au prorata</strong> n&apos;est dû pour la période engagée,
            sauf disposition légale contraire.
          </p>
          <p className="mt-3">
            <strong>Par Terranova :</strong> Terranova peut résilier l&apos;abonnement de plein droit,
            sans préavis ni indemnité, en cas de manquement grave de l&apos;Abonné aux CGU ou aux
            CGV (notamment : utilisation frauduleuse, contenu illicite, défaut de paiement persistant
            au-delà de 30 jours).
          </p>
        </section>

        <section>
          <h2 className={H2} style={H2_STYLE}>9. Modification des prix</h2>
          <p>
            Terranova se réserve le droit de modifier ses tarifs à tout moment. Toute modification
            applicable aux abonnements en cours sera notifiée par email <strong>au moins 60 jours
            avant son entrée en vigueur</strong>. L&apos;Abonné qui refuse les nouveaux tarifs peut
            résilier son abonnement sans frais à tout moment avant la date d&apos;application.
          </p>
        </section>

        <section>
          <h2 className={H2} style={H2_STYLE}>10. Garantie légale de conformité</h2>
          <p>
            Le Service est fourni « tel quel ». Terranova s&apos;engage à fournir un Service conforme
            à la description du plan choisi et garantit l&apos;Abonné contre tout défaut de
            conformité dans les conditions des articles L.217-3 et suivants du Code de la consommation.
          </p>
          <p className="mt-3 text-sm">
            En cas de dysfonctionnement, l&apos;Abonné est invité à contacter le support à{' '}
            <a href="mailto:support@terranova.fr" className="text-[#4F46E5] hover:underline">
              support@terranova.fr
            </a>. Terranova s&apos;engage à intervenir dans les meilleurs délais.
          </p>
        </section>

        <section>
          <h2 className={H2} style={H2_STYLE}>11. Limitation de responsabilité</h2>
          <p>
            La responsabilité de Terranova est limitée au montant des sommes effectivement payées
            par l&apos;Abonné au titre des 12 derniers mois précédant le fait générateur. Cette
            limitation ne s&apos;applique pas en cas de faute lourde, dol, ou atteinte aux droits
            personnels et libertés fondamentales.
          </p>
          <p className="mt-3 text-sm">
            Terranova ne saurait être tenue responsable de tout dommage indirect (perte de chance,
            d&apos;exploitation, de données, manque à gagner) résultant de l&apos;utilisation ou
            de l&apos;impossibilité d&apos;utilisation du Service.
          </p>
        </section>

        <section>
          <h2 className={H2} style={H2_STYLE}>12. Service client</h2>
          <p>
            Le service client est joignable :
          </p>
          <ul className="list-disc list-inside text-sm space-y-1 text-[#4B5563] mt-2">
            <li>Par email : <a href="mailto:support@terranova.fr" className="text-[#4F46E5] hover:underline">support@terranova.fr</a> (réponse sous 48 h ouvrées)</li>
            <li>Par téléphone (Plan Agence uniquement) : [Numéro à compléter]</li>
            <li>Du lundi au vendredi, de 9h à 18h (hors jours fériés)</li>
          </ul>
        </section>

        <section>
          <h2 className={H2} style={H2_STYLE}>13. Médiation et règlement des litiges</h2>
          <p>
            En cas de litige, l&apos;Abonné est invité à contacter Terranova en priorité afin de
            rechercher une solution amiable. À défaut, l&apos;Abonné consommateur peut recourir
            gratuitement au médiateur de la consommation désigné dans nos{' '}
            <a href="/legal/mentions-legales" className="text-[#4F46E5] hover:underline">
              mentions légales
            </a>.
          </p>
          <p className="mt-3 text-sm">
            La plateforme européenne de règlement en ligne des litiges (RLL) est accessible à :{' '}
            <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="text-[#4F46E5] hover:underline">
              ec.europa.eu/consumers/odr
            </a>.
          </p>
        </section>

        <section>
          <h2 className={H2} style={H2_STYLE}>14. Droit applicable et juridiction</h2>
          <p>
            Les présentes CGV sont soumises au <strong>droit français</strong>. Tout litige relève,
            à défaut de résolution amiable, de la compétence exclusive des tribunaux français
            compétents, sous réserve des règles impératives applicables aux consommateurs.
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
