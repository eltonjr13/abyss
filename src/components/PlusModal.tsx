import { createPortal } from "react-dom";

const benefits = [
  {
    title: "Paisagens sonoras estendidas",
    description: "Chuva suave e marulho de praia, com volume independente do áudio essencial.",
  },
  {
    title: "Modo Santuário",
    description: "O oceano em tela cheia, sem cronômetro nem controles durante a contemplação.",
  },
  {
    title: "Mapa anual de foco",
    description: "Histórico diário dos últimos 365 dias para enxergar sua constância.",
  },
];

export function PlusModal({ onClose }: { onClose: () => void }) {
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="plus-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md"
    >
      <div className="relative max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-xl border border-white/20 bg-[#07131d]/95 p-6 text-[var(--foam)] shadow-2xl">
        <button
          onClick={onClose}
          aria-label="Fechar oferta Plus"
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-white/70 hover:text-white"
        >
          ✕
        </button>

        <header className="pr-8">
          <p className="font-pixel text-[11px] tracking-[0.35em] text-[var(--gold)] uppercase">MERGULHE PLUS</p>
          <h2 id="plus-title" className="mt-2 font-serif text-3xl text-white italic">
            Mais espaço para mergulhar
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-white/65">
            Extras para personalizar a experiência, sem limitar o caminho pelo oceano.
          </p>
        </header>

        <section className="mt-5 rounded-lg border border-emerald-400/25 bg-emerald-950/20 p-4">
          <h3 className="text-xs font-medium text-emerald-300">O essencial continua grátis</h3>
          <p className="mt-1 text-xs leading-relaxed text-white/75">
            Sessões de foco, todos os 6 biomas e todas as descobertas de espécies.
          </p>
        </section>

        <section aria-label="Benefícios do Plus" className="mt-5 space-y-2">
          {benefits.map((benefit, index) => (
            <div key={benefit.title} className="flex gap-3 rounded-lg border border-white/10 bg-white/5 p-3">
              <span aria-hidden="true" className="font-pixel text-sm text-[var(--gold)]">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <h3 className="text-xs font-medium text-white/95">{benefit.title}</h3>
                <p className="mt-1 text-[11px] leading-relaxed text-white/60">{benefit.description}</p>
              </div>
            </div>
          ))}
        </section>

        <div className="mt-5 rounded-lg border border-[var(--gold)]/30 bg-[var(--gold)]/10 p-4 text-center">
          <p className="text-xs font-medium text-[var(--gold)]">Compra única · acesso permanente</p>
          <p className="mt-1 text-[11px] text-white/65">Sem assinatura. O preço será mostrado pela loja antes da compra.</p>
        </div>

        <button disabled className="mt-4 min-h-12 w-full rounded border border-white/20 bg-white/5 px-3 text-xs font-medium text-white/55">
          Compra disponível em breve
        </button>
        <p className="mt-3 text-center text-[11px] leading-relaxed text-white/55">
          A compra e a restauração serão ativadas após a integração com as lojas.
        </p>
        <button onClick={onClose} className="mt-3 w-full py-2 text-xs text-white/70 underline underline-offset-4 hover:text-white">
          Continuar gratuitamente
        </button>
      </div>
    </div>,
    document.body,
  );
}
