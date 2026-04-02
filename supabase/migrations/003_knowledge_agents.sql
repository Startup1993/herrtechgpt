-- Agenten-spezifische Wissensbasis: relevant_agents Spalte
ALTER TABLE knowledge_base ADD COLUMN IF NOT EXISTS relevant_agents text[] DEFAULT '{}';
CREATE INDEX IF NOT EXISTS idx_knowledge_agents ON knowledge_base USING GIN(relevant_agents);
