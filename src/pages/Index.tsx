import { useWordDatabase } from "@/hooks/useWordDatabase";
import { useWordTrie } from "@/hooks/useWordTrie";
import Anagramador from "@/components/Anagramador";

export const Index = () => {
  // Initialize word database and trie
  useWordDatabase();
  const { isLoading: isTrieLoading } = useWordTrie();

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto">
        <Anagramador />
      </div>
    </main>
  );
};