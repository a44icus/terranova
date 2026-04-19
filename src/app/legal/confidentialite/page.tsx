import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Politique de confidentialité — Terranova',
  description: 'Politique de confidentialité et protection des données personnelles (RGPD) de Terranova.',
}

export default function ConfidentialitePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1
        className="text-4xl text-[#0F172A] mb-8"
        style={{ fontFamily: "'DM Serif Display', serif" }}
      >
        Politique de confidentialité
      </h1>

      <div className="space-y-8 text-[#374151] leading-relaxed">

        <section>
          <h2
            className="text-2xl text-[#0F172A] mb-3"
            style={{ fontFamily: "'DM Serif Display', serif" }}
          >
            1. Responsable du traitement
          </h2>
          <p>
            Le responsable du traitement de vos données personnelles est <strong>Terranova</strong>,
            plateforme immobilière en ligne. Pour toute question relative à vos données, contactez-nous
            à l'adresse :{' '}
            <a href="mailto:contact@terranova.fr" className="text-[#4F46E5] hover:underline">
              contact@terranova.fr
            </a>
          </p>
        </section>

        <section>
          <h2
            className="text-2xl text-[#0F172A] mb-3"
            style={{ fontFamily: "'DM Serif Display', serif" }}
          >
            2. Données collectées
          </h2>
          <p className="mb-3">
            Dans le cadre de l'utilisation de la plateforme Terranova, nous collectons les données
            suivantes :
          </p>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-[#0F172A] mb-1">Lors de l'inscription</h3>
              <ul className="list-disc list-inside text-sm space-y-1 text-[#4B5563]">
                <li>Nom et prénom</li>
                <li>Adresse email</li>
                <li>Numéro de téléphone (facultatif)</li>
                <li>Mot de passe (stocké sous forme hashée)</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-[#0F172A] mb-1">Lors de la publication d'une annonce</h3>
              <ul className="list-disc list-inside text-sm space-y-1 text-[#4B5563]">
                <li>Informations sur le bien immobilier (adresse, prix, description, photos)</li>
                <li>Coordonnées de contact associées à l'annonce</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-[#0F172A] mb-1">Données de navigation</h3>
              <ul className="list-disc list-inside text-sm space-y-1 text-[#4B5563]">
                <li>Adresse IP (anonymisée)</li>
                <li>Pages visitées et durée de visite</li>
                <li>Type de navigateur et système d'exploitation</li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h2
            className="text-2xl text-[#0F172A] mb-3"
            style={{ fontFamily: "'DM Serif Display', serif" }}
          >
            3. Bases légales du traitement
          </h2>
          <ul className="space-y-2 text-sm">
            <li className="flex gap-2">
              <span className="text-[#4F46E5] font-semibold shrink-0">Consentement :</span>
              <span>collecte de données lors de l'inscription, envoi de communications.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-[#4F46E5] font-semibold shrink-0">Exécution du contrat :</span>
              <span>traitement nécessaire à la fourniture du service (publication d'annonces, messagerie).</span>
            </li>
            <li className="flex gap-2">
              <span className="text-[#4F46E5] font-semibold shrink-0">Intérêt légitime :</span>
              <span>sécurité de la plateforme, prévention des fraudes et abus.</span>
            </li>
          </ul>
        </section>

        <section>
          <h2
            className="text-2xl text-[#0F172A] mb-3"
            style={{ fontFamily: "'DM Serif Display', serif" }}
          >
            4. Durée de conservation
          </h2>
          <p>
            Vos données personnelles sont conservées pendant <strong>3 ans</strong> à compter
            de votre dernière activité sur la plateforme. À l'issue de cette période, vos données
            sont supprimées ou anonymisées. Les données relatives aux transactions peuvent être
            conservées 5 ans à des fins comptables et légales.
          </p>
        </section>

        <section>
          <h2
            className="text-2xl text-[#0F172A] mb-3"
            style={{ fontFamily: "'DM Serif Display', serif" }}
          >
            5. Vos droits
          </h2>
          <p className="mb-3">
            Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez
            des droits suivants sur vos données :
          </p>
          <ul className="list-disc list-inside text-sm space-y-2 text-[#4B5563]">
            <li><strong className="text-[#374151]">Droit d'accès</strong> : obtenir une copie de vos données personnelles</li>
            <li><strong className="text-[#374151]">Droit de rectification</strong> : corriger vos données inexactes ou incomplètes</li>
            <li><strong className="text-[#374151]">Droit à l'effacement</strong> : demander la suppression de vos données</li>
            <li><strong className="text-[#374151]">Droit à la portabilité</strong> : recevoir vos données dans un format structuré</li>
            <li><strong className="text-[#374151]">Droit d'opposition</strong> : vous opposer au traitement de vos données</li>
            <li><strong className="text-[#374151]">Droit à la limitation</strong> : demander la suspension du traitement</li>
          </ul>
          <p className="mt-3 text-sm">
            Pour exercer ces droits, contactez-nous à :{' '}
            <a href="mailto:contact@terranova.fr" className="text-[#4F46E5] hover:underline">
              contact@terranova.fr
            </a>
            . Nous répondrons dans un délai maximum de 30 jours.
          </p>
          <p className="mt-2 text-sm">
            Vous pouvez également introduire une réclamation auprès de la{' '}
            <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer"
              className="text-[#4F46E5] hover:underline">
              CNIL
            </a>{' '}
            (Commission Nationale de l'Informatique et des Libertés).
          </p>
        </section>

        <section>
          <h2
            className="text-2xl text-[#0F172A] mb-3"
            style={{ fontFamily: "'DM Serif Display', serif" }}
          >
            6. Cookies
          </h2>
          <p>
            Terranova utilise uniquement des <strong>cookies techniques strictement nécessaires</strong>{' '}
            au fonctionnement du service :
          </p>
          <ul className="list-disc list-inside text-sm space-y-1 text-[#4B5563] mt-2">
            <li>Cookie de session d'authentification (nécessaire à la connexion)</li>
            <li>Cookie de préférences d'affichage (carte, filtres)</li>
          </ul>
          <p className="mt-3 text-sm">
            Aucun cookie publicitaire ou de suivi tiers n'est utilisé. Aucun consentement
            explicite n'est requis pour ces cookies essentiels.
          </p>
        </section>

        <section>
          <h2
            className="text-2xl text-[#0F172A] mb-3"
            style={{ fontFamily: "'DM Serif Display', serif" }}
          >
            7. Transfert des données
          </h2>
          <p>
            Vos données sont hébergées au sein de l'Union Européenne via{' '}
            <strong>Supabase</strong> (région EU West). Aucun transfert de données vers des
            pays tiers n'est effectué sans garanties appropriées. L'hébergement du site utilise
            Vercel Inc. (États-Unis) dans le cadre du Data Privacy Framework UE-États-Unis.
          </p>
        </section>

        <section>
          <h2
            className="text-2xl text-[#0F172A] mb-3"
            style={{ fontFamily: "'DM Serif Display', serif" }}
          >
            8. Sécurité
          </h2>
          <p>
            Nous mettons en œuvre des mesures techniques et organisationnelles appropriées
            pour protéger vos données contre tout accès non autorisé, divulgation, modification
            ou destruction : chiffrement des communications (HTTPS/TLS), hachage des mots de
            passe, accès restreint aux données personnelles.
          </p>
        </section>

        <p className="text-xs text-[#9CA3AF] pt-4 border-t border-[#E5E7EB]">
          Dernière mise à jour : avril 2026
        </p>
      </div>
    </div>
  )
}
