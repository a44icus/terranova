import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Conditions Générales d'Utilisation — Terranova",
  description: "Conditions Générales d'Utilisation de la plateforme immobilière Terranova : inscription, publication d'annonces, modération, droits et obligations.",
}

const H2 = "text-2xl text-[#0F172A] mb-3"
const H2_STYLE = { fontFamily: "'DM Serif Display', serif" }

export default function CGUPage() {
  return (
    <>
      {/* Hero */}
      <div className="bg-navy relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse at 85% 40%, rgba(79,70,229,0.18) 0%, transparent 65%), radial-gradient(ellipse at 15% 80%, rgba(124,58,237,0.10) 0%, transparent 55%)',
        }} />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 pt-10 pb-12">
          <p className="text-[11px] font-bold text-primary uppercase tracking-[0.18em] mb-3">Informations légales</p>
          <h1 className="font-serif text-4xl sm:text-5xl text-white leading-tight">Conditions Générales d&apos;Utilisation</h1>
          <p className="text-white/60 text-sm mt-4 max-w-xl">
            En vigueur au 1<sup>er</sup> mai 2026. Les abonnements payants sont régis en complément
            par les{' '}
            <a href="/legal/cgv" className="text-white hover:underline">Conditions Générales de Vente</a>.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="space-y-8 text-[#374151] leading-relaxed">

        <section>
          <h2 className={H2} style={H2_STYLE}>1. Définitions</h2>
          <ul className="space-y-2 text-sm">
            <li><strong>« Plateforme » / « Service »</strong> : le site terranova.fr et l&apos;ensemble des fonctionnalités proposées.</li>
            <li><strong>« Éditeur »</strong> : la société Terranova, telle que désignée dans les{' '}
              <a href="/legal/mentions-legales" className="text-[#4F46E5] hover:underline">mentions légales</a>.</li>
            <li><strong>« Utilisateur »</strong> : toute personne physique ou morale accédant au Service, qu&apos;elle soit visiteur ou inscrite.</li>
            <li><strong>« Membre »</strong> : Utilisateur ayant créé un compte.</li>
            <li><strong>« Annonce »</strong> : tout contenu publié par un Membre proposant un bien immobilier à la vente, location ou recherche.</li>
            <li><strong>« Contenu Utilisateur »</strong> : tout texte, photo, vidéo, message ou donnée publié par un Membre.</li>
          </ul>
        </section>

        <section>
          <h2 className={H2} style={H2_STYLE}>2. Objet</h2>
          <p>
            Les présentes Conditions Générales d&apos;Utilisation (ci-après les « CGU ») ont pour objet
            de définir les modalités et conditions d&apos;accès et d&apos;utilisation de la Plateforme
            Terranova, ainsi que les droits et obligations des Utilisateurs.
          </p>
          <p className="mt-3">
            Terranova est une plateforme de mise en relation entre vendeurs/bailleurs et acheteurs/
            locataires de biens immobiliers. <strong>Terranova n&apos;agit pas en qualité d&apos;agent
            immobilier</strong> au sens de la loi Hoguet, ne reçoit aucun mandat et ne perçoit aucune
            commission sur les transactions.
          </p>
          <p className="mt-3">
            Terranova exerce son activité en qualité d&apos;<strong>hébergeur</strong> au sens de
            l&apos;article 6-I-2 de la loi LCEN du 21 juin 2004.
          </p>
        </section>

        <section>
          <h2 className={H2} style={H2_STYLE}>3. Acceptation des CGU</h2>
          <p>
            L&apos;accès et l&apos;utilisation de la Plateforme impliquent l&apos;acceptation pleine,
            entière et sans réserve des présentes CGU. Lors de la création d&apos;un compte,
            l&apos;Utilisateur accepte expressément les CGU en cochant la case prévue à cet effet.
          </p>
          <p className="mt-3">
            Si l&apos;Utilisateur n&apos;accepte pas tout ou partie des CGU, il doit renoncer à
            utiliser la Plateforme.
          </p>
        </section>

        <section>
          <h2 className={H2} style={H2_STYLE}>4. Inscription et compte utilisateur</h2>
          <p className="mb-3">L&apos;inscription est ouverte à toute personne physique majeure ou
            personne morale légalement constituée. En s&apos;inscrivant, l&apos;Utilisateur s&apos;engage à :</p>
          <ul className="list-disc list-inside text-sm space-y-2 text-[#4B5563]">
            <li>Être âgé d&apos;au moins <strong>18 ans</strong> et disposer de la capacité juridique pour contracter</li>
            <li>Fournir des informations exactes, complètes, sincères et tenues à jour</li>
            <li>Maintenir la <strong>confidentialité</strong> de ses identifiants et mot de passe</li>
            <li>Ne créer qu&apos;<strong>un seul compte</strong> par personne physique</li>
            <li>Ne pas utiliser un compte tiers sans autorisation expresse</li>
            <li>Notifier sans délai à Terranova toute utilisation non autorisée de son compte</li>
          </ul>
          <p className="mt-3 text-sm">
            Tout manquement à ces engagements expose le Membre à la suspension immédiate ou la
            suppression définitive de son compte, sans préavis ni indemnité.
          </p>
        </section>

        <section>
          <h2 className={H2} style={H2_STYLE}>5. Publication d&apos;annonces immobilières</h2>
          <p className="mb-3">
            En publiant une Annonce, le Membre déclare et garantit, sous sa seule responsabilité, que :
          </p>
          <ul className="list-disc list-inside text-sm space-y-2 text-[#4B5563]">
            <li>Le contenu publié est <strong>licite</strong> et ne porte atteinte à aucun droit de tiers</li>
            <li>Il est <strong>habilité</strong> à proposer le bien (propriétaire, mandataire, ou professionnel disposant des autorisations requises)</li>
            <li>Les <strong>photographies sont authentiques</strong>, libres de droits ou que le Membre dispose des autorisations nécessaires à leur publication</li>
            <li>Le <strong>prix affiché est réel</strong> et reflète une intention sérieuse de vente ou location</li>
            <li>Les informations relatives au bien sont <strong>exactes, complètes et à jour</strong> (surface, nombre de pièces, adresse, etc.)</li>
            <li>Le Membre dispose et fournit le <strong>diagnostic de performance énergétique (DPE)</strong> et l&apos;<strong>indice GES</strong> conformément aux articles L.126-26 et suivants du Code de la construction et de l&apos;habitation</li>
            <li>L&apos;annonce respecte la <strong>loi ALUR</strong> et notamment les mentions obligatoires (honoraires, type de bail, etc. lorsque applicables)</li>
            <li>Le bien n&apos;est pas frappé d&apos;une <strong>interdiction légale de mise en location</strong> (notamment passoire thermique classée G à compter du 1<sup>er</sup> janvier 2025)</li>
          </ul>
          <p className="mt-3 text-sm">
            Les annonces sont soumises à <strong>validation préalable</strong> par l&apos;équipe Terranova.
            Cette validation ne constitue pas un engagement de Terranova quant à l&apos;exactitude ou
            la conformité du contenu, dont la responsabilité incombe exclusivement au Membre publieur.
          </p>
        </section>

        <section>
          <h2 className={H2} style={H2_STYLE}>6. Engagements de l&apos;Utilisateur</h2>
          <p className="mb-3">L&apos;Utilisateur s&apos;interdit en toute hypothèse de :</p>
          <ul className="list-disc list-inside text-sm space-y-1 text-[#4B5563]">
            <li>Publier tout contenu illicite, diffamatoire, injurieux, raciste, discriminatoire, pornographique, violent ou contraire aux bonnes mœurs</li>
            <li>Usurper l&apos;identité d&apos;un tiers ou créer un compte sous une fausse identité</li>
            <li>Utiliser le Service à des fins frauduleuses, notamment de phishing, escroquerie, blanchiment</li>
            <li>Collecter automatiquement des données du Service (scraping, robots, crawlers, exception faite des moteurs de recherche conformes au robots.txt)</li>
            <li>Tenter de contourner les mesures de sécurité, modifier ou décompiler le code de la Plateforme</li>
            <li>Surcharger ou perturber le bon fonctionnement du Service (DDoS, requêtes massives, etc.)</li>
            <li>Détourner la messagerie ou les fonctionnalités du Service à des fins non liées à l&apos;immobilier (publicité, démarchage, spam)</li>
            <li>Reproduire, copier, vendre ou exploiter commercialement tout ou partie du Service</li>
          </ul>
        </section>

        <section>
          <h2 className={H2} style={H2_STYLE}>7. Statut d&apos;hébergeur — Responsabilité</h2>
          <p>
            Terranova exerce son activité en qualité d&apos;<strong>hébergeur de contenu</strong>
            (article 6-I-2 LCEN). À ce titre, Terranova n&apos;est pas soumise à une obligation
            générale de surveillance des contenus publiés.
          </p>
          <p className="mt-3">
            Terranova ne saurait être tenue responsable :
          </p>
          <ul className="list-disc list-inside text-sm space-y-1 text-[#4B5563] mt-2">
            <li>Des contenus, déclarations, photos ou informations publiés par les Membres</li>
            <li>De la véracité, l&apos;exactitude, la conformité ou la légalité des Annonces</li>
            <li>Des transactions, négociations ou accords conclus entre Utilisateurs</li>
            <li>De tout préjudice résultant d&apos;une mauvaise utilisation du Service par l&apos;Utilisateur</li>
            <li>D&apos;une indisponibilité temporaire du Service due à une maintenance, mise à jour ou cas de force majeure</li>
          </ul>
          <p className="mt-3 text-sm">
            Terranova s&apos;engage à mettre tous les moyens raisonnables en œuvre pour assurer la
            disponibilité du Service mais ne garantit pas un fonctionnement permanent et ininterrompu.
          </p>
        </section>

        <section>
          <h2 className={H2} style={H2_STYLE}>8. Modération et suppression de contenu</h2>
          <p>
            Terranova met en œuvre une modération <em>a priori</em> et <em>a posteriori</em> des
            Annonces. Toute Annonce ou tout Contenu Utilisateur peut être refusé, modifié ou
            supprimé sans préavis ni indemnité s&apos;il :
          </p>
          <ul className="list-disc list-inside text-sm space-y-1 text-[#4B5563] mt-2">
            <li>Contient des informations fausses, trompeuses, ou prix manifestement erroné</li>
            <li>Présente un caractère illicite, frauduleux, offensant ou discriminatoire</li>
            <li>Comporte des photos volées, retouchées de manière trompeuse, ou ne correspondant pas au bien</li>
            <li>Ne respecte pas les obligations légales applicables (DPE, mentions ALUR, mandat…)</li>
            <li>Est en doublon ou fait l&apos;objet de signalements multiples</li>
            <li>Détourne le Service de sa finalité immobilière</li>
          </ul>
        </section>

        <section>
          <h2 className={H2} style={H2_STYLE}>9. Procédure de signalement de contenu illicite</h2>
          <p>
            Tout Utilisateur peut signaler un contenu manifestement illicite à l&apos;adresse{' '}
            <a href="mailto:abuse@terranova.fr" className="text-[#4F46E5] hover:underline">
              abuse@terranova.fr
            </a>{' '}
            en respectant les conditions de l&apos;article 6-I-5 LCEN détaillées dans nos{' '}
            <a href="/legal/mentions-legales" className="text-[#4F46E5] hover:underline">
              mentions légales
            </a>.
          </p>
          <p className="mt-3 text-sm">
            Terranova s&apos;engage à examiner toute notification recevable dans les meilleurs délais
            et à retirer promptement tout contenu manifestement illicite. Tout signalement abusif ou
            de mauvaise foi engage la responsabilité civile et pénale de son auteur.
          </p>
        </section>

        <section>
          <h2 className={H2} style={H2_STYLE}>10. Suspension et résiliation</h2>
          <p>
            <strong>Par l&apos;Utilisateur :</strong> le Membre peut résilier son compte à tout
            moment depuis son espace personnel ou par demande écrite à{' '}
            <a href="mailto:contact@terranova.fr" className="text-[#4F46E5] hover:underline">
              contact@terranova.fr
            </a>. La suppression entraîne la désactivation immédiate des Annonces et la suppression
            des données dans les conditions de notre{' '}
            <a href="/legal/confidentialite" className="text-[#4F46E5] hover:underline">
              politique de confidentialité
            </a>.
          </p>
          <p className="mt-3">
            <strong>Par Terranova :</strong> en cas de manquement grave ou répété aux CGU, Terranova
            peut suspendre ou résilier le compte du Membre, sans préavis ni indemnité, sans préjudice
            des dommages-intérêts qui pourraient être réclamés.
          </p>
          <p className="mt-3 text-sm">
            En cas d&apos;abonnement payant, les modalités de résiliation et de remboursement
            éventuel sont détaillées dans les{' '}
            <a href="/legal/cgv" className="text-[#4F46E5] hover:underline">CGV</a>.
          </p>
        </section>

        <section>
          <h2 className={H2} style={H2_STYLE}>11. Propriété intellectuelle — Licence des contenus utilisateurs</h2>
          <p>
            La Plateforme et l&apos;ensemble de ses éléments sont protégés par le droit de la
            propriété intellectuelle, comme précisé dans les{' '}
            <a href="/legal/mentions-legales" className="text-[#4F46E5] hover:underline">mentions légales</a>.
          </p>
          <p className="mt-3">
            Les contenus publiés par les Membres restent la propriété de leurs auteurs. Cependant,
            en publiant un contenu sur la Plateforme, le Membre concède à Terranova une{' '}
            <strong>licence non-exclusive, gratuite, mondiale et pour la durée de publication</strong>{' '}
            de reproduire, représenter, adapter et diffuser ledit contenu, dans la limite stricte
            de ce qui est nécessaire au fonctionnement et à la promotion du Service (notamment :
            affichage public sur le Site, partage social, indexation par les moteurs de recherche,
            inclusion dans des sélections ou newsletters Terranova).
          </p>
          <p className="mt-3 text-sm">
            Cette licence prend fin automatiquement à la suppression du contenu, sous réserve des
            exemplaires conservés à des fins de preuve ou d&apos;archivage technique.
          </p>
        </section>

        <section>
          <h2 className={H2} style={H2_STYLE}>12. Données personnelles</h2>
          <p>
            Les modalités de collecte et de traitement des données personnelles sont décrites dans
            notre{' '}
            <a href="/legal/confidentialite" className="text-[#4F46E5] hover:underline">
              Politique de confidentialité
            </a>. L&apos;utilisation des cookies est détaillée dans notre{' '}
            <a href="/legal/cookies" className="text-[#4F46E5] hover:underline">
              Politique cookies
            </a>.
          </p>
        </section>

        <section>
          <h2 className={H2} style={H2_STYLE}>13. Force majeure</h2>
          <p>
            La responsabilité de Terranova ne pourra être engagée en cas de force majeure ou de
            faits indépendants de sa volonté, notamment : panne d&apos;hébergeur, attaque
            informatique, défaillance d&apos;un service tiers (Supabase, Vercel, Stripe…), grève,
            émeute, guerre, catastrophe naturelle, pandémie, ou décision d&apos;une autorité
            administrative.
          </p>
        </section>

        <section>
          <h2 className={H2} style={H2_STYLE}>14. Modification des CGU</h2>
          <p>
            Terranova se réserve le droit de modifier les présentes CGU à tout moment afin
            d&apos;adapter le Service à l&apos;évolution juridique, technique ou commerciale. Les
            Utilisateurs seront informés de toute modification substantielle par email et/ou par
            une notification sur la Plateforme, au moins <strong>15 jours avant</strong> son
            entrée en vigueur. La poursuite de l&apos;utilisation du Service après ce délai vaut
            acceptation des nouvelles CGU.
          </p>
        </section>

        <section>
          <h2 className={H2} style={H2_STYLE}>15. Nullité partielle — Cession</h2>
          <p>
            Si une ou plusieurs stipulations des présentes CGU étaient déclarées nulles ou
            inapplicables par une décision de justice, les autres stipulations conserveraient toute
            leur force et leur portée.
          </p>
          <p className="mt-3 text-sm">
            Terranova se réserve le droit de céder tout ou partie de ses droits et obligations
            résultant des présentes CGU à un tiers, notamment dans le cadre d&apos;une cession,
            fusion, scission ou apport partiel d&apos;actif.
          </p>
        </section>

        <section>
          <h2 className={H2} style={H2_STYLE}>16. Médiation et règlement des litiges</h2>
          <p>
            En cas de litige, l&apos;Utilisateur est invité à contacter Terranova en priorité à
            l&apos;adresse{' '}
            <a href="mailto:contact@terranova.fr" className="text-[#4F46E5] hover:underline">
              contact@terranova.fr
            </a>{' '}
            afin de rechercher une solution amiable.
          </p>
          <p className="mt-3 text-sm">
            À défaut, l&apos;Utilisateur consommateur peut recourir gratuitement au médiateur de la
            consommation désigné dans nos{' '}
            <a href="/legal/mentions-legales" className="text-[#4F46E5] hover:underline">
              mentions légales
            </a>, ou à la plateforme européenne de règlement en ligne des litiges (RLL) :{' '}
            <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer"
              className="text-[#4F46E5] hover:underline">
              ec.europa.eu/consumers/odr
            </a>.
          </p>
        </section>

        <section>
          <h2 className={H2} style={H2_STYLE}>17. Droit applicable et juridiction compétente</h2>
          <p>
            Les présentes CGU sont régies par le <strong>droit français</strong>. Tout litige
            relatif à leur formation, interprétation ou exécution relève, à défaut de résolution
            amiable, de la compétence exclusive des <strong>tribunaux français compétents</strong>,
            sous réserve des règles impératives de protection du consommateur permettant à ce
            dernier de saisir la juridiction du lieu où il demeurait au moment de la conclusion
            du contrat ou de la survenance du fait dommageable.
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
