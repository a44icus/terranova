import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mentions légales — Terranova',
  description: 'Mentions légales de la plateforme immobilière Terranova : éditeur, hébergeur, propriété intellectuelle, signalement de contenu.',
}

const H2 = "text-2xl text-[#0F172A] mb-3"
const H2_STYLE = { fontFamily: "'DM Serif Display', serif" }

export default function MentionsLegalesPage() {
  return (
    <>
      {/* Hero */}
      <div className="bg-navy relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse at 85% 40%, rgba(79,70,229,0.18) 0%, transparent 65%), radial-gradient(ellipse at 15% 80%, rgba(124,58,237,0.10) 0%, transparent 55%)',
        }} />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 pt-10 pb-12">
          <p className="text-[11px] font-bold text-primary uppercase tracking-[0.18em] mb-3">Informations légales</p>
          <h1 className="font-serif text-4xl sm:text-5xl text-white leading-tight">Mentions légales</h1>
          <p className="text-white/60 text-sm mt-4 max-w-xl">
            Conformément aux articles 6-III et 19 de la loi n°2004-575 du 21 juin 2004 pour la confiance dans l&apos;économie numérique (LCEN).
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="space-y-8 text-[#374151] leading-relaxed">

        <section>
          <h2 className={H2} style={H2_STYLE}>1. Éditeur du site</h2>
          <p>
            Le site <strong>terranova.fr</strong> (ci-après « le Site » ou « la Plateforme ») est édité par :
          </p>
          <ul className="mt-3 space-y-1 text-sm">
            <li><span className="text-[#6B7280]">Dénomination sociale :</span> <strong>Terranova</strong></li>
            <li><span className="text-[#6B7280]">Forme juridique :</span> [SASU / SAS / EURL / Auto-entrepreneur — à compléter]</li>
            <li><span className="text-[#6B7280]">Capital social :</span> [Montant en € — à compléter si société]</li>
            <li><span className="text-[#6B7280]">Siège social :</span> [Adresse complète — à compléter]</li>
            <li><span className="text-[#6B7280]">Numéro SIRET :</span> [À compléter dès immatriculation]</li>
            <li><span className="text-[#6B7280]">Numéro RCS :</span> [À compléter — Ville d&apos;immatriculation]</li>
            <li><span className="text-[#6B7280]">N° TVA intracommunautaire :</span> [À compléter si assujetti]</li>
            <li><span className="text-[#6B7280]">Téléphone :</span> [Numéro à compléter]</li>
            <li><span className="text-[#6B7280]">Email :</span>{' '}
              <a href="mailto:contact@terranova.fr" className="text-[#4F46E5] hover:underline">contact@terranova.fr</a>
            </li>
          </ul>
        </section>

        <section>
          <h2 className={H2} style={H2_STYLE}>2. Directeur de la publication</h2>
          <p>
            Le directeur de la publication est <strong>[Prénom NOM — à compléter]</strong>, en qualité de
            représentant légal de l&apos;éditeur. Toute correspondance peut lui être adressée à l&apos;adresse
            postale du siège social ou par email à{' '}
            <a href="mailto:contact@terranova.fr" className="text-[#4F46E5] hover:underline">contact@terranova.fr</a>.
          </p>
        </section>

        <section>
          <h2 className={H2} style={H2_STYLE}>3. Hébergeur du site</h2>
          <p>Le Site est hébergé par :</p>
          <address className="mt-2 not-italic text-sm space-y-1">
            <p><strong>Vercel Inc.</strong></p>
            <p>340 Pine Street, Suite 701</p>
            <p>San Francisco, CA 94104 — États-Unis</p>
            <p>
              <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-[#4F46E5] hover:underline">
                vercel.com
              </a>
            </p>
          </address>
          <p className="mt-4 text-sm">
            Les données utilisateurs (compte, annonces, photos, messages) sont hébergées au sein de l&apos;Union
            Européenne par <strong>Supabase Inc.</strong> (région UE-Ouest), 970 Toa Payoh North #07-04,
            Singapour 318992 —{' '}
            <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-[#4F46E5] hover:underline">
              supabase.com
            </a>.
          </p>
        </section>

        <section>
          <h2 className={H2} style={H2_STYLE}>4. Activité et statut juridique</h2>
          <p>
            Terranova est une plateforme en ligne de mise en relation entre vendeurs/bailleurs et
            acheteurs/locataires de biens immobiliers situés en France.
          </p>
          <p className="mt-3">
            <strong>Terranova n&apos;agit pas en qualité d&apos;agent immobilier</strong> au sens de la loi
            n°70-9 du 2 janvier 1970 (loi Hoguet). Terranova ne reçoit ni mandat de vente, ni mandat de
            location, ne perçoit aucune commission sur les transactions et n&apos;intervient pas dans la
            négociation, la conclusion ou la rédaction des actes.
          </p>
          <p className="mt-3">
            Terranova exerce une activité d&apos;<strong>hébergeur de contenu</strong> au sens de
            l&apos;article 6-I-2 de la LCEN. À ce titre, elle n&apos;est pas soumise à une obligation
            générale de surveillance des contenus publiés par les utilisateurs, mais s&apos;engage à
            retirer promptement tout contenu manifestement illicite qui lui serait notifié.
          </p>
        </section>

        <section>
          <h2 className={H2} style={H2_STYLE}>5. Propriété intellectuelle</h2>
          <p>
            L&apos;ensemble des éléments composant le Site — notamment la marque « Terranova », le nom
            de domaine, les logos, l&apos;identité graphique, l&apos;arborescence, les textes, les
            illustrations, les photographies, les vidéos, les bases de données, le code source, les
            algorithmes (notamment le score de quartier, le simulateur de crédit, l&apos;estimateur de
            prix), ainsi que toute création protégeable — sont la propriété exclusive de Terranova ou
            font l&apos;objet d&apos;une autorisation d&apos;utilisation. Ils sont protégés par le Code
            de la propriété intellectuelle (notamment articles L.111-1 et suivants).
          </p>
          <p className="mt-3">
            Toute reproduction, représentation, modification, publication, adaptation, traduction,
            extraction substantielle, totale ou partielle, par quelque procédé que ce soit et sur
            quelque support que ce soit, est strictement interdite sans l&apos;autorisation écrite
            préalable de Terranova. Toute exploitation non autorisée engage la responsabilité civile
            et pénale de son auteur (articles L.335-2 et L.343-1 du CPI).
          </p>
          <p className="mt-3 text-sm">
            Les contenus publiés par les utilisateurs (annonces, photos, descriptions) restent la propriété
            de leurs auteurs ; ces derniers concèdent à Terranova une licence non-exclusive d&apos;utilisation
            aux fins d&apos;exploitation du Service, dans les conditions précisées dans les CGU.
          </p>
        </section>

        <section>
          <h2 className={H2} style={H2_STYLE}>6. Liens hypertextes</h2>
          <p>
            Le Site peut contenir des liens hypertextes vers des sites tiers. Terranova n&apos;exerce
            aucun contrôle sur ces sites et décline toute responsabilité quant à leur contenu, leur
            disponibilité, leurs pratiques en matière de données personnelles ou tout dommage résultant
            de leur consultation.
          </p>
          <p className="mt-3">
            La création d&apos;un lien hypertexte vers le Site est libre, sous réserve qu&apos;elle ne
            porte pas atteinte aux intérêts de Terranova et qu&apos;elle mentionne clairement la source.
          </p>
        </section>

        <section>
          <h2 className={H2} style={H2_STYLE}>7. Données personnelles</h2>
          <p>
            Les modalités de collecte, d&apos;utilisation et de protection des données personnelles sont
            décrites dans notre{' '}
            <a href="/legal/confidentialite" className="text-[#4F46E5] hover:underline">
              Politique de confidentialité
            </a>
            . L&apos;utilisation des cookies est détaillée dans notre{' '}
            <a href="/legal/cookies" className="text-[#4F46E5] hover:underline">
              Politique cookies
            </a>.
          </p>
        </section>

        <section>
          <h2 className={H2} style={H2_STYLE}>8. Signalement de contenu illicite</h2>
          <p>
            Conformément à l&apos;article 6-I-5 de la LCEN, toute personne peut signaler un contenu
            qu&apos;elle estime manifestement illicite (annonce frauduleuse, photo volée, contenu
            diffamatoire, discrimination, contrefaçon, etc.) en envoyant une notification à :
          </p>
          <p className="mt-2">
            <a href="mailto:abuse@terranova.fr" className="text-[#4F46E5] hover:underline">
              abuse@terranova.fr
            </a>
          </p>
          <p className="mt-3 text-sm">
            La notification doit comporter, à peine d&apos;irrecevabilité : (a) la date de notification,
            (b) l&apos;identité du notifiant (nom, prénom, adresse, profession, domicile, nationalité,
            ou pour une personne morale : forme, dénomination, siège social, organe représentant),
            (c) la description précise du contenu litigieux et son URL, (d) les motifs pour lesquels
            le contenu doit être retiré (avec mention des dispositions légales et justifications),
            (e) la copie de la correspondance adressée à l&apos;auteur ou éditeur du contenu lui demandant
            le retrait, ou la justification de ce que cet auteur n&apos;a pu être contacté.
          </p>
          <p className="mt-3 text-sm text-[#DC2626]">
            <strong>Attention :</strong> tout signalement abusif peut engager la responsabilité civile
            et pénale de son auteur (article 6-I-4 LCEN, peine de 1 an d&apos;emprisonnement et
            15 000 € d&apos;amende).
          </p>
        </section>

        <section>
          <h2 className={H2} style={H2_STYLE}>9. Médiation de la consommation</h2>
          <p>
            Conformément aux articles L.612-1 et suivants du Code de la consommation, l&apos;utilisateur
            consommateur a la possibilité, en cas de litige non résolu par voie amiable, de recourir
            gratuitement au médiateur de la consommation suivant :
          </p>
          <address className="mt-2 not-italic text-sm space-y-1">
            <p><strong>[Nom du médiateur — à désigner avant lancement commercial]</strong></p>
            <p>[Adresse postale]</p>
            <p>[Site web de saisine en ligne]</p>
          </address>
          <p className="mt-3 text-sm">
            La plateforme européenne de règlement en ligne des litiges (RLL) est accessible à l&apos;adresse :{' '}
            <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer"
              className="text-[#4F46E5] hover:underline">
              ec.europa.eu/consumers/odr
            </a>.
          </p>
        </section>

        <section>
          <h2 className={H2} style={H2_STYLE}>10. Droit applicable et juridiction</h2>
          <p>
            Les présentes mentions légales sont régies par le <strong>droit français</strong>. Tout
            litige relatif à leur interprétation ou à leur exécution relève, à défaut de résolution
            amiable, de la compétence exclusive des <strong>tribunaux français compétents</strong>,
            sous réserve des dispositions impératives applicables aux consommateurs.
          </p>
        </section>

        <section>
          <h2 className={H2} style={H2_STYLE}>11. Crédits</h2>
          <p className="text-sm">
            Données cartographiques : © OpenStreetMap contributors (ODbL), OpenFreeMap, Esri World
            Imagery. Données POI : OpenStreetMap via Overpass API. Données prix immobilier : DVF
            (Demandes de Valeurs Foncières — open data Etalab). Polices : DM Sans, DM Serif Display
            (Google Fonts, OFL).
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
