import type { BiomeId } from "../types";

export const FOCUS_QUOTES = [
  "Mantenha o foco.",
  "O oceano não tem pressa.",
  "Respire. A maré respira com você.",
  "A vida cresce no silêncio.",
  "Só a água se move.",
  "Permaneça.",
  "Cada segundo é uma maré.",
  "O recife espera em paz.",
  "Não há nada para coletar aqui.",
  "Você já está fazendo o suficiente.",
];

export const COMPLETE_QUOTES: Record<BiomeId, string[]> = {
  reef: [
    "Seu foco trouxe vida de volta ao recife.",
    "Uma cor nova encontrou o coral.",
    "O silêncio foi fértil.",
  ],
  kelp: [
    "A floresta ganhou mais um palmo de luz.",
    "As folhas aprenderam o seu ritmo.",
    "Há sombra boa entre os kelps agora.",
  ],
  mangrove: [
    "As raízes respiraram um pouco mais fundo.",
    "A água rasa ficou menos sozinha.",
    "Um caranguejo terá onde se esconder.",
  ],
  island: [
    "A ilha emerge um pouco mais.",
    "A areia lembra os seus minutos.",
    "O horizonte ficou mais claro.",
  ],
  deep: [
    "No escuro, algo se moveu em paz.",
    "A pressão do fundo reconheceu você.",
    "Uma luz mínima acendeu longe.",
  ],
  abyss: [
    "O abismo, que não pede nada, recebeu mesmo assim.",
    "O silêncio ficou menos vazio.",
    "Há um brilho que não estava aqui ontem.",
  ],
};

export const IDLE_WHISPERS = [
  "Quanto mais você se concentra, mais vida existe no seu oceano.",
  "Isso existe porque você conseguiu manter o foco.",
  "O mundo cresce quando você desaparece nele.",
];

export function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}
