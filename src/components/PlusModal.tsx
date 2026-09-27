import { useState } from "react";
import { useGame } from "../game/GameContext";
import { getAudio } from "../audio/engine";

export function PlusModal({ onClose }: { onClose: () => void }) {
  const { state, unlockPlus } = useGame();
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const isAlreadyPlus = state.plus?.isPlus;

  const handlePurchase = () => {
    setLoading(true);
    setStatusMessage(null);
    // Simulação determinística de compra vitalícia com fallback seguro para ambiente web/local
    setTimeout(() => {
      unlockPlus(`tide_lifetime_${Date.now()}`, "purchase");
      getAudio().chime();
      setLoading(false);
      setStatusMessage("Parabéns! Você agora é um Patrono do Oceano com Acesso Vitalício.");
    }, 600);
  };

  const handleRestore = () => {
    setLoading(true);
    setStatusMessage(null);
    setTimeout(() => {
      if (state.plus?.isPlus) {
        setStatusMessage("Sua compra vitalícia já está ativa neste dispositivo.");
      } else {
        // Restaura compra caso tenha chave salva ou simula restauração
        unlockPlus(`tide_restored_${Date.now()}`, "restore");
        getAudio().chime();
        setStatusMessage("Compra restaurada com sucesso! Bem-vindo de volta ao TIDE Plus.");
      }
      setLoading(false);
    }, 500);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="TIDE Plus - Oferta de Acesso Vitalício"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md"
    >
      <div className="relative max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-xl border border-white/20 bg-[#07131d]/95 p-6 shadow-2xl text-[var(--foam)]">
        {/* Botão Fechar */}
        <button
          onClick={onClose}
          aria-label="Fechar janela"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-white/20 text-sm text-white/60 hover:border-white/40 hover:text-white"
        >
          ✕
        </button>

        {/* Cabeçalho */}
        <div className="text-center pt-2">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-[var(--gold)]/40 bg-[var(--gold)]/10 text-[var(--gold)]">
            ✦
          </div>
          <p className="mt-3 font-pixel text-[11px] tracking-[0.45em] text-[var(--gold)] uppercase">
            TIDE PLUS
          </p>
          <h2 className="mt-1 font-serif text-2xl text-white italic">
            Onde o silêncio se aprofunda
          </h2>
          <p className="mt-2 text-xs text-white/60 leading-relaxed max-w-md mx-auto">
            Uma experiência contemplativa e sensorial ampliada para quem busca mergulhos ainda mais profundos.
          </p>
        </div>

        {/* Compromisso Ético */}
        <div className="mt-5 rounded-lg border border-emerald-400/25 bg-emerald-950/20 p-3 text-center">
          <p className="text-[11px] font-medium tracking-wide text-emerald-300">
            🌿 Nosso Compromisso Ético
          </p>
          <p className="mt-1 text-[11px] text-white/70 leading-relaxed">
            O cronômetro essencial, todos os 6 biomas e todas as espécies do códice são e sempre serão 100% gratuitos.
          </p>
        </div>

        {/* Benefícios Concretos */}
        <div className="mt-5 space-y-3">
          <BenefitItem
            icon="♫"
            title="Paisagens Sonoras Estendidas"
            desc="Mixer avançado com chuva suave na superfície, marulho de praia e batimentos binaurais de foco (Alpha 10Hz e Theta 6Hz)."
          />
          <BenefitItem
            icon="✦"
            title="Modo Santuário (Ambient Display)"
            desc="Visualização em tela cheia sem botões ou contadores para transformar seu monitor ou tablet em uma janela viva do oceano."
          />
          <BenefitItem
            icon="☵"
            title="Métricas Profundas & Heatmap Anual"
            desc="Mapa de constância estilo constelação com 365 dias de histórico e análise do seu ritmo circadiano de foco."
          />
          <BenefitItem
            icon="🗎"
            title="Caderno do Naturalista"
            desc="Cartões poéticos e ilustrações em alta resolução de todas as criaturas marinhas descobertas para salvar como fundo de tela."
          />
        </div>

        {/* Caixa de Oferta / Status */}
        <div className="mt-6 rounded-lg border border-white/20 bg-white/5 p-4 text-center">
          {isAlreadyPlus ? (
            <div>
              <span className="inline-block rounded-full bg-[var(--gold)]/20 px-3 py-1 text-[11px] font-medium text-[var(--gold)] tracking-wider uppercase">
                ✦ Patrono do Oceano Ativo
              </span>
              <p className="mt-2 font-serif text-sm text-white/90 italic">
                Seu acesso vitalício ao TIDE Plus está desbloqueado para sempre neste dispositivo.
              </p>
              {state.plus.unlockedAt && (
                <p className="mt-1 text-[10px] text-white/50">
                  Desbloqueado em: {new Date(state.plus.unlockedAt).toLocaleDateString("pt-BR")}
                </p>
              )}
            </div>
          ) : (
            <div>
              <p className="text-[10px] tracking-[0.25em] text-white/60 uppercase">
                Acesso Permanente · Compra Única
              </p>
              <div className="mt-1 flex items-baseline justify-center gap-1">
                <span className="font-serif text-3xl font-light text-[var(--gold)]">R$ 29,90</span>
                <span className="text-xs text-white/50">/ vitalício</span>
              </div>
              <p className="mt-1 text-[11px] text-white/60">
                Sem assinaturas mensais · Sem renovações surpresa
              </p>
            </div>
          )}
        </div>

        {/* Mensagem de Feedback */}
        {statusMessage && (
          <div className="mt-3 rounded border border-emerald-400/40 bg-emerald-950/40 p-2.5 text-center text-xs text-emerald-300">
            {statusMessage}
          </div>
        )}

        {/* Botões de Ação */}
        <div className="mt-5 space-y-2.5">
          {!isAlreadyPlus ? (
            <button
              onClick={handlePurchase}
              disabled={loading}
              className="w-full rounded border border-[var(--gold)] bg-[var(--gold)]/20 py-3 text-center text-xs font-medium tracking-[0.2em] text-[var(--gold)] uppercase transition hover:bg-[var(--gold)]/30 disabled:opacity-50"
            >
              {loading ? "Processando..." : "Desbloquear TIDE Plus Vitalício"}
            </button>
          ) : (
            <button
              onClick={onClose}
              className="w-full rounded border border-white/30 bg-white/10 py-3 text-center text-xs tracking-[0.2em] text-white uppercase hover:bg-white/20"
            >
              Concluir & Aproveitar
            </button>
          )}

          <div className="flex items-center justify-between pt-2 text-[11px] text-white/50">
            <button
              onClick={handleRestore}
              disabled={loading}
              className="hover:text-white/80 underline underline-offset-4 disabled:opacity-50"
            >
              Restaurar compra anterior
            </button>
            <span>Garantia de acesso permanente</span>
          </div>
        </div>

        <p className="mt-4 text-center text-[10px] text-white/40">
          O TIDE é um projeto independente. Sua compra apoia diretamente a criação de novos sons e espécies marinhas.
        </p>
      </div>
    </div>
  );
}

function BenefitItem({
  icon,
  title,
  desc,
}: {
  icon: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-white/10 bg-[#0b1b28]/60 p-3">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-white/15 bg-white/5 text-xs text-[var(--foam)]">
        {icon}
      </div>
      <div>
        <p className="text-xs font-medium text-white/90">{title}</p>
        <p className="mt-0.5 text-[11px] leading-relaxed text-white/60">{desc}</p>
      </div>
    </div>
  );
}
