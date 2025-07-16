import React, { createContext, useContext, useState, ReactNode } from 'react';

export type TestType = 'words' | 'quotes' | 'punctuation' | 'numbers' | 'code' | 'custom';
export type Language = 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'ru' | 'zh' | 'ja' | 'ko' | 'ar' | 'hi' | 'bn' | 'tr' | 'pl' | 'other';
export type Domain = 'general' | 'medical' | 'legal' | 'technical' | 'business' | 'custom';

export interface ContentItem {
  id: string;
  type: TestType;
  language: Language;
  domain: Domain;
  label: string;
  content: string;
}

export interface ContentLibraryState {
  items: ContentItem[];
  selected: ContentItem | null;
}

const defaultState: ContentLibraryState = {
  items: [
    { id: '1', type: 'words', language: 'en', domain: 'general', label: 'Common English Words', content: 'the, be, to, of, and, a, in, that, have, I' },
    { id: '2', type: 'quotes', language: 'en', domain: 'general', label: 'Famous Quote', content: 'The only limit to our realization of tomorrow is our doubts of today.' },
    { id: '3', type: 'code', language: 'en', domain: 'technical', label: 'Hello World (Python)', content: 'print("Hello, world!")' },
    { id: '4', type: 'numbers', language: 'en', domain: 'general', label: 'Numbers Practice', content: '12345 67890 24680 13579' },
    { id: '5', type: 'punctuation', language: 'en', domain: 'general', label: 'Punctuation Practice', content: 'Hello, world! How are you? (I am fine.)' },
    { id: '6', type: 'words', language: 'es', domain: 'general', label: 'Palabras Comunes (Español)', content: 'el, la, de, que, y, a, en, un, ser, se' },
    { id: '7', type: 'quotes', language: 'fr', domain: 'general', label: 'Citation Française', content: 'Le succès est la somme de petits efforts, répétés jour après jour.' },
    { id: '8', type: 'code', language: 'en', domain: 'technical', label: 'Hello World (JavaScript)', content: 'console.log("Hello, world!");' },
    { id: '9', type: 'words', language: 'de', domain: 'general', label: 'Häufige Wörter (Deutsch)', content: 'der, die, und, in, den, von, zu, mit, sich, auf' },
    { id: '10', type: 'words', language: 'en', domain: 'medical', label: 'Medical Terms', content: 'diagnosis, therapy, patient, symptom, treatment' },
    { id: '11', type: 'words', language: 'en', domain: 'legal', label: 'Legal Terms', content: 'contract, agreement, liability, plaintiff, defendant' },
    { id: '12', type: 'words', language: 'en', domain: 'business', label: 'Business Terms', content: 'revenue, profit, loss, investment, shareholder' },
    { id: '13', type: 'words', language: 'en', domain: 'technical', label: 'Technical Terms', content: 'algorithm, function, variable, object, class' },
  ],
  selected: null,
};

const ContentLibraryContext = createContext<{
  state: ContentLibraryState;
  addItem: (item: ContentItem) => void;
  selectItem: (id: string) => void;
  setItems: (items: ContentItem[]) => void;
} | undefined>(undefined);

export const ContentLibraryProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<ContentLibraryState>(defaultState);
  const addItem = (item: ContentItem) => setState(prev => ({ ...prev, items: [...prev.items, item] }));
  const selectItem = (id: string) => setState(prev => ({ ...prev, selected: prev.items.find(i => i.id === id) || null }));
  const setItems = (items: ContentItem[]) => setState(prev => ({ ...prev, items }));
  return (
    <ContentLibraryContext.Provider value={{ state, addItem, selectItem, setItems }}>
      {children}
    </ContentLibraryContext.Provider>
  );
};

export function useContentLibrary() {
  const ctx = useContext(ContentLibraryContext);
  if (!ctx) throw new Error('useContentLibrary must be used within ContentLibraryProvider');
  return ctx;
} 