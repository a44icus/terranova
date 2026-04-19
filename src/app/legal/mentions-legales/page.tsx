import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mentions légales — Terranova',
  description: 'Mentions légales de la plateforme immobilière Terranova.',
}

export default function MentionsLegalesPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1
        className="text-4xl text-[#0F172A] mb-8"
        style={{ fontFamily: "'DM Serif Display', serif" }}
      >
        Mentions légales
      </h1>

      <div className="space-y-8 text-[#374151] leading-relaxed">

        <section>
          <h2
            className="text-2xl text-[#0F172A] mb-3"
            style={{ fontFamily: "'DM Serif Display', serif" }}
          >
            1. Éditeur du site
          </h2>
          <p>
            Le site <strong>terranova.fr</strong> est édité par <strong>Terranova</strong>,
            plateforme immobilière en ligne actuellement en phase de développement.
          </p>
          <ul className="mt-3 space-y-1 text-sm">
            <li><span className="text-[#6B7280]">Dénomination :</span> Terranova</li>
            <li><span className="text-[#6B7280]">Statut :</span> Projet en développement</li>
            <li><span className="text-[#6B7280]">Email de contact :</span>{' '}
              <a href="mailto:contact@terranova.fr" className="text-[#4F46E5] hover:underline">
                contact@terranova.fr
              </a>
            </li>
            <li><span className="text-[#6B7280]">Responsable de publication :</span> [Nom à renseigner]</li>
          </ul>
        </section>

        <section>
          <h2
            className="text-2xl text-[#0F172A] mb-3"
            style={{ fontFamily: "'DM Serif Display', serif" }}
          >
            2. Hébergeur
          </h2>
          <p>Le site est hébergé par :</p>
          <address className="mt-2 not-italic text-sm space-y-1">
            <p><strong>Vercel Inc.</strong></p>
            <p>340 Pine Street, Suite 701</p>
            <p>San Francisco, CA 94104 — États-Unis</p>
            <p>
              <a href="https://vercel.com" target="_blank" rel="noopener noreferrer"
                className="text-[#4F46E5] hover:underline">
                vercel.com
              </a>
            </p>
          </address>
        </section>

        <section>
          <h2
            className="text-2xl text-[#0F172A] mb-3"
            style={{ fontFamily: "'DM Serif Display', serif" }}
          >
            3. Activité
          </h2>
          <p>
            Terranova est une plateforme immobilière en ligne permettant la mise en relation entre
            vendeurs/bailleurs et acheteurs/locataires de biens immobiliers. Terranova n'agit pas
            en qualité d'agent immobilier et n'est pas mandatée par les parties pour la réalisation
            des transactions.
          </p>
        </section>

        <section>
          <h2
            className="text-2xl text-[#0F172A] mb-3"
            style={{ fontFamily: "'DM Serif Display', serif" }}
          >
            4. Propriété intellectuelle
          </h2>
          <p>
            L'ensemble des éléments composant le site Terranova (textes, graphismes, logiciels,
            photographies, images, sons, plans, noms, logos, marques, créations et œuvres
            protégeables diverses) sont la propriété exclusive de Terranova ou font l'objet d'une
            autorisation d'utilisation. Toute reproduction, représentation, modification, publication
            ou adaptation de tout ou partie de ces éléments est strictement interdite sans
            l'accord écrit préalable de Terranova.
          </p>
        </section>

        <section>
          <h2
            className="text-2xl text-[#0F172A] mb-3"
            style={{ fontFamily: "'DM Serif Display', serif" }}
          >
            5. Limitation de responsabilité
          </h2>
          <p>
            Terranova s'efforce d'assurer l'exactitude et la mise à jour des informations diffusées
            sur ce site. Toutefois, Terranova ne peut garantir l'exactitude, la précision ou
            l'exhaustivité des informations mises à disposition sur ce site. En conséquence,
            Terranova décline toute responsabilité pour toute imprécision, inexactitude ou omission
            portant sur des informations disponibles sur ce site.
          </p>
        </section>

        <section>
          <h2
            className="text-2xl text-[#0F172A] mb-3"
            style={{ fontFamily: "'DM Serif Display', serif" }}
          >
            6. Contact
          </h2>
          <p>
            Pour toute question relative au fonctionnement du site ou à son contenu, vous pouvez
            nous contacter à l'adresse suivante :{' '}
            <a href="mailto:contact@terranova.fr" className="text-[#4F46E5] hover:underline">
              contact@terranova.fr
            </a>
          </p>
        </section>

        <p className="text-xs text-[#9CA3AF] pt-4 border-t border-[#E5E7EB]">
          Dernière mise à jour : avril 2026
        </p>
      </div>
    </div>
  )
}
