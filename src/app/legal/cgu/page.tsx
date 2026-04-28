import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Conditions Générales d'Utilisation — Terranova",
  description: "Conditions Générales d'Utilisation de la plateforme immobilière Terranova.",
}

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
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="space-y-8 text-[#374151] leading-relaxed">

        <section>
          <h2
            className="text-2xl text-[#0F172A] mb-3"
            style={{ fontFamily: "'DM Serif Display', serif" }}
          >
            1. Objet
          </h2>
          <p>
            Les présentes Conditions Générales d'Utilisation (CGU) régissent l'accès et
            l'utilisation de la plateforme <strong>Terranova</strong>, accessible à l'adresse
            terranova.fr. Terranova est une plateforme de mise en relation entre particuliers
            ou professionnels souhaitant vendre, louer, acheter ou louer des biens immobiliers.
          </p>
          <p className="mt-2">
            <strong>Terranova n'agit pas en qualité d'agent immobilier</strong> et n'est pas
            mandatée pour la réalisation des transactions. Terranova est un hébergeur de contenu
            au sens de la loi pour la confiance dans l'économie numérique (LCEN).
          </p>
        </section>

        <section>
          <h2
            className="text-2xl text-[#0F172A] mb-3"
            style={{ fontFamily: "'DM Serif Display', serif" }}
          >
            2. Inscription et compte utilisateur
          </h2>
          <p className="mb-3">Pour accéder aux fonctionnalités complètes de Terranova, vous devez créer un compte. En vous inscrivant, vous vous engagez à :</p>
          <ul className="list-disc list-inside text-sm space-y-2 text-[#4B5563]">
            <li>Être âgé d'au moins <strong>18 ans</strong></li>
            <li>Fournir des informations exactes, complètes et à jour</li>
            <li>Maintenir la confidentialité de vos identifiants de connexion</li>
            <li>Ne pas créer plusieurs comptes pour un même utilisateur</li>
            <li>Notifier immédiatement Terranova de toute utilisation non autorisée de votre compte</li>
          </ul>
          <p className="mt-3 text-sm">
            Terranova se réserve le droit de suspendre ou supprimer tout compte ne respectant
            pas ces engagements.
          </p>
        </section>

        <section>
          <h2
            className="text-2xl text-[#0F172A] mb-3"
            style={{ fontFamily: "'DM Serif Display', serif" }}
          >
            3. Publication d'annonces
          </h2>
          <p className="mb-3">
            En publiant une annonce sur Terranova, vous déclarez et garantissez que :
          </p>
          <ul className="list-disc list-inside text-sm space-y-2 text-[#4B5563]">
            <li>Le contenu publié est <strong>légal</strong> et ne viole aucun droit tiers</li>
            <li>Les <strong>photos sont authentiques</strong> et correspondent au bien décrit</li>
            <li>Le <strong>prix affiché est réel</strong> et reflète votre intention de vente ou location</li>
            <li>Vous êtes habilité à proposer le bien (propriétaire, mandataire légal ou professionnel autorisé)</li>
            <li>Les informations sur le bien sont exactes et à jour</li>
          </ul>
          <p className="mt-3 text-sm">
            Les annonces sont soumises à <strong>validation par notre équipe</strong> avant publication.
            Terranova se réserve le droit de refuser ou supprimer toute annonce ne respectant
            pas ces conditions.
          </p>
        </section>

        <section>
          <h2
            className="text-2xl text-[#0F172A] mb-3"
            style={{ fontFamily: "'DM Serif Display', serif" }}
          >
            4. Responsabilité de Terranova
          </h2>
          <p>
            Terranova agit en qualité d'hébergeur au sens de la LCEN et n'est pas responsable
            du contenu publié par les utilisateurs. En cas de signalement d'un contenu illicite,
            Terranova s'engage à agir promptement pour le retirer.
          </p>
          <p className="mt-2">
            Terranova ne garantit pas la disponibilité permanente du service ni l'exactitude
            des annonces publiées. Terranova décline toute responsabilité pour les transactions
            réalisées entre utilisateurs.
          </p>
        </section>

        <section>
          <h2
            className="text-2xl text-[#0F172A] mb-3"
            style={{ fontFamily: "'DM Serif Display', serif" }}
          >
            5. Modération
          </h2>
          <p>
            Terranova met en place une modération des annonces publiées. Toute annonce peut
            être refusée ou retirée si elle contient :
          </p>
          <ul className="list-disc list-inside text-sm space-y-1 text-[#4B5563] mt-2">
            <li>Des informations fausses ou trompeuses</li>
            <li>Du contenu illicite, offensant ou discriminatoire</li>
            <li>Des photos volées ou ne correspondant pas au bien</li>
            <li>Un prix manifestement erroné ou une offre frauduleuse</li>
            <li>Du contenu faisant la promotion de produits ou services non liés à l'immobilier</li>
          </ul>
          <p className="mt-3 text-sm">
            En cas de non-respect répété des CGU, Terranova peut suspendre ou supprimer définitivement
            le compte de l'utilisateur concerné.
          </p>
        </section>

        <section>
          <h2
            className="text-2xl text-[#0F172A] mb-3"
            style={{ fontFamily: "'DM Serif Display', serif" }}
          >
            6. Offres et abonnements
          </h2>
          <div className="space-y-4">
            <div className="bg-white border border-[#E5E7EB] rounded-lg p-4">
              <h3 className="font-semibold text-[#0F172A] mb-1">Plan Gratuit</h3>
              <p className="text-sm text-[#6B7280]">
                Accès aux fonctionnalités de base : consultation d'annonces, envoi de messages,
                publication d'un nombre limité d'annonces.
              </p>
            </div>
            <div className="bg-white border border-[#E5E7EB] rounded-lg p-4">
              <h3 className="font-semibold text-[#0F172A] mb-1">Plans Payants</h3>
              <p className="text-sm text-[#6B7280]">
                Des abonnements payants permettent d'accéder à des fonctionnalités avancées :
                publication illimitée, mise en avant des annonces, accès aux statistiques.
                Les tarifs sont disponibles sur la page de tarification.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2
            className="text-2xl text-[#0F172A] mb-3"
            style={{ fontFamily: "'DM Serif Display', serif" }}
          >
            7. Résiliation
          </h2>
          <p>
            Vous pouvez résilier votre compte à tout moment depuis votre espace membre, section
            "Mon profil". La suppression du compte entraîne la désactivation immédiate de toutes
            vos annonces et la suppression de vos données personnelles dans les délais prévus par
            notre politique de confidentialité.
          </p>
          <p className="mt-2">
            En cas d'abonnement payant en cours, la résiliation prend effet à la fin de la période
            d'abonnement. Aucun remboursement au prorata ne sera effectué sauf disposition légale
            contraire.
          </p>
        </section>

        <section>
          <h2
            className="text-2xl text-[#0F172A] mb-3"
            style={{ fontFamily: "'DM Serif Display', serif" }}
          >
            8. Droit applicable
          </h2>
          <p>
            Les présentes CGU sont soumises au droit français. Tout litige relatif à leur
            interprétation ou à leur exécution relève de la compétence exclusive des tribunaux
            français compétents.
          </p>
        </section>

        <section>
          <h2
            className="text-2xl text-[#0F172A] mb-3"
            style={{ fontFamily: "'DM Serif Display', serif" }}
          >
            9. Modifications des CGU
          </h2>
          <p>
            Terranova se réserve le droit de modifier les présentes CGU à tout moment. Les
            utilisateurs seront informés de toute modification substantielle par email ou via
            une notification sur la plateforme. La poursuite de l'utilisation du service après
            modification vaut acceptation des nouvelles CGU.
          </p>
        </section>

        <p className="text-xs text-[#9CA3AF] pt-4 border-t border-[#E5E7EB]">
          Dernière mise à jour : avril 2026
        </p>
      </div>
      </div>
    </>
  )
}
