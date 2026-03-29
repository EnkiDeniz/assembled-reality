import { createContext, useContext } from "react";

export const ReactionContext = createContext({
  emojiReactions: {},
  toggleReaction: () => {},
  reader: null,
});

export function useReactions() {
  return useContext(ReactionContext);
}
