-- ============================================================
-- Messagerie en temps réel
-- À exécuter dans Supabase > SQL Editor
-- ============================================================
--
-- La page de conversation s'abonne aux nouvelles réponses (src/components/compte/ConversationLive.tsx).
-- Supabase Realtime ne diffuse une ligne qu'aux utilisateurs qui ont le droit de la lire (RLS) :
-- on publie la table et on autorise la lecture aux deux participants de la conversation.

-- 1. Publier la table dans Realtime
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'contact_replies'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE contact_replies;
  END IF;
END $$;

-- 2. Lecture réservée au vendeur et à l'acheteur de la conversation
ALTER TABLE contact_replies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Participants lisent la conversation" ON contact_replies;
CREATE POLICY "Participants lisent la conversation" ON contact_replies
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM contacts c
    WHERE c.id = contact_replies.contact_id
      AND (c.vendeur_id = auth.uid() OR c.acheteur_id = auth.uid())
  ));
