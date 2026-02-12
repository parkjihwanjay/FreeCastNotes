import { Extension } from "@tiptap/core";
import { Plugin, PluginKey, TextSelection } from "@tiptap/pm/state";
import type { Node as PMNode } from "@tiptap/pm/model";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

interface SearchResult {
  from: number;
  to: number;
}

export interface SearchStorage {
  searchTerm: string;
  caseSensitive: boolean;
  results: SearchResult[];
  currentIndex: number;
}

const searchPluginKey = new PluginKey("searchAndReplace");

function findMatches(
  doc: PMNode,
  searchTerm: string,
  caseSensitive: boolean,
): SearchResult[] {
  const results: SearchResult[] = [];
  if (!searchTerm) return results;

  const term = caseSensitive ? searchTerm : searchTerm.toLowerCase();

  doc.descendants((node, pos) => {
    if (!node.isText || !node.text) return;
    const text = caseSensitive ? node.text : node.text.toLowerCase();
    let index = text.indexOf(term);
    while (index !== -1) {
      results.push({
        from: pos + index,
        to: pos + index + searchTerm.length,
      });
      index = text.indexOf(term, index + 1);
    }
  });

  return results;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    searchAndReplace: {
      setSearchTerm: (term: string) => ReturnType;
      setCaseSensitive: (value: boolean) => ReturnType;
      goToNextMatch: () => ReturnType;
      goToPrevMatch: () => ReturnType;
      replaceCurrent: (replaceWith: string) => ReturnType;
      replaceAll: (replaceWith: string) => ReturnType;
      clearSearch: () => ReturnType;
    };
  }
}

export const SearchAndReplace = Extension.create<object, SearchStorage>({
  name: "searchAndReplace",

  addStorage() {
    return {
      searchTerm: "",
      caseSensitive: false,
      results: [] as SearchResult[],
      currentIndex: 0,
    };
  },

  addCommands() {
    return {
      setSearchTerm:
        (term: string) =>
        ({ tr, dispatch }) => {
          if (!dispatch) return true;
          this.storage.searchTerm = term;
          this.storage.currentIndex = 0;
          tr.setMeta(searchPluginKey, true);
          dispatch(tr);
          return true;
        },

      setCaseSensitive:
        (value: boolean) =>
        ({ tr, dispatch }) => {
          if (!dispatch) return true;
          this.storage.caseSensitive = value;
          this.storage.currentIndex = 0;
          tr.setMeta(searchPluginKey, true);
          dispatch(tr);
          return true;
        },

      goToNextMatch:
        () =>
        ({ tr, dispatch }) => {
          if (this.storage.results.length === 0) return false;
          if (!dispatch) return true;
          this.storage.currentIndex =
            (this.storage.currentIndex + 1) % this.storage.results.length;
          const match = this.storage.results[this.storage.currentIndex];
          tr.setSelection(TextSelection.create(tr.doc, match.from));
          tr.setMeta(searchPluginKey, true);
          tr.scrollIntoView();
          dispatch(tr);
          return true;
        },

      goToPrevMatch:
        () =>
        ({ tr, dispatch }) => {
          if (this.storage.results.length === 0) return false;
          if (!dispatch) return true;
          this.storage.currentIndex =
            (this.storage.currentIndex - 1 + this.storage.results.length) %
            this.storage.results.length;
          const match = this.storage.results[this.storage.currentIndex];
          tr.setSelection(TextSelection.create(tr.doc, match.from));
          tr.setMeta(searchPluginKey, true);
          tr.scrollIntoView();
          dispatch(tr);
          return true;
        },

      replaceCurrent:
        (replaceWith: string) =>
        ({ tr, dispatch }) => {
          const match = this.storage.results[this.storage.currentIndex];
          if (!match) return false;
          if (!dispatch) return true;
          tr.insertText(replaceWith, match.from, match.to);
          dispatch(tr);
          return true;
        },

      replaceAll:
        (replaceWith: string) =>
        ({ tr, dispatch }) => {
          if (this.storage.results.length === 0) return false;
          if (!dispatch) return true;
          // Replace from end to start to keep positions valid
          const results = [...this.storage.results].reverse();
          for (const m of results) {
            tr.insertText(replaceWith, m.from, m.to);
          }
          dispatch(tr);
          return true;
        },

      clearSearch:
        () =>
        ({ tr, dispatch }) => {
          if (!dispatch) return true;
          this.storage.searchTerm = "";
          this.storage.caseSensitive = false;
          this.storage.results = [];
          this.storage.currentIndex = 0;
          tr.setMeta(searchPluginKey, true);
          dispatch(tr);
          return true;
        },
    };
  },

  addProseMirrorPlugins() {
    const storage = this.storage;

    return [
      new Plugin({
        key: searchPluginKey,
        state: {
          init() {
            return DecorationSet.empty;
          },
          apply(tr, old, _oldState, newState) {
            const meta = tr.getMeta(searchPluginKey);
            if (!meta && !tr.docChanged) return old;

            const { searchTerm, caseSensitive } = storage;
            if (!searchTerm) {
              storage.results = [];
              return DecorationSet.empty;
            }

            const results = findMatches(
              newState.doc,
              searchTerm,
              caseSensitive,
            );
            storage.results = results;

            if (storage.currentIndex >= results.length) {
              storage.currentIndex = 0;
            }

            const decorations = results.map((match, i) =>
              Decoration.inline(match.from, match.to, {
                class:
                  i === storage.currentIndex
                    ? "search-match-active"
                    : "search-match",
              }),
            );

            return DecorationSet.create(newState.doc, decorations);
          },
        },
        props: {
          decorations(state) {
            return searchPluginKey.getState(state);
          },
        },
      }),
    ];
  },
});
