import { useState } from "react";
import { createPortal } from "react-dom";

export type LegalDocType = "privacy" | "terms";

interface LegalModalProps {
  initialDoc?: LegalDocType;
  onClose: () => void;
}

export function LegalModal({ initialDoc = "privacy", onClose }: LegalModalProps) {
  const [activeDoc, setActiveDoc] = useState<LegalDocType>(initialDoc);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
    >
      <div className="relative flex max-h-[90dvh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/20 bg-[#07131d] text-[var(--foam)] shadow-2xl">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div>
            <p className="font-pixel text-[10px] tracking-[0.3em] text-[var(--gold)] uppercase">
              Documentos Legais
            </p>
            <h2 id="legal-modal-title" className="font-serif text-xl italic text-white">
              {activeDoc === "privacy" ? "Política de Privacidade" : "Termos de Uso"}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar janela"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 text-white/70 hover:bg-white/10 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Abas seletoras */}
        <div className="flex border-b border-white/10 bg-white/5 px-6 pt-2">
          <button
            onClick={() => setActiveDoc("privacy")}
            className={`border-b-2 px-4 py-2 text-xs font-medium tracking-wider uppercase transition-colors ${
              activeDoc === "privacy"
                ? "border-[var(--foam)] text-white"
                : "border-transparent text-white/50 hover:text-white/80"
            }`}
          >
            Privacidade (LGPD)
          </button>
          <button
            onClick={() => setActiveDoc("terms")}
            className={`border-b-2 px-4 py-2 text-xs font-medium tracking-wider uppercase transition-colors ${
              activeDoc === "terms"
                ? "border-[var(--foam)] text-white"
                : "border-transparent text-white/50 hover:text-white/80"
            }`}
          >
            Termos de Uso
          </button>
        </div>

        {/* Conteúdo rolável */}
        <div className="flex-1 overflow-y-auto px-6 py-5 text-xs leading-relaxed text-white/80 space-y-4">
          {activeDoc === "privacy" ? <PrivacyContent /> : <TermsContent />}
        </div>

        {/* Rodapé */}
        <div className="flex items-center justify-between border-t border-white/10 bg-white/5 px-6 py-3">
          <span className="text-[10px] text-white/45">Mergulhe · Versão 1.0 · Setembro/2026</span>
          <button
            onClick={onClose}
            className="rounded border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-medium text-white hover:bg-white/20"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function PrivacyContent() {
  return (
    <>
      <div className="rounded-lg border border-emerald-400/20 bg-emerald-950/20 p-3 text-[11px] text-emerald-300 leading-relaxed">
        <strong>Privacidade por padrão:</strong> O Mergulhe armazena todo o seu histórico de foco e
        progresso localmente no seu aparelho. Não vendemos seus dados nem exibimos anúncios de terceiros.
      </div>

      <section>
        <h3 className="font-serif text-sm text-[var(--foam)] font-semibold">1. Princípios de Privacidade</h3>
        <p className="mt-1 text-white/70">
          Operamos sob o princípio da minimização de dados. O uso do aplicativo é possível de forma 100%
          anônima sem criação de conta. Cumprimos integralmente a LGPD (Lei nº 13.709/2018) e o GDPR (Regulamento UE 2016/679).
        </p>
      </section>

      <section>
        <h3 className="font-serif text-sm text-[var(--foam)] font-semibold">2. Dados Coletados</h3>
        <ul className="mt-1 list-disc list-inside space-y-1 text-white/70">
          <li><strong>Uso Local:</strong> Tempo de foco, biomas, XP e espécies ficam gravados no seu dispositivo (`localStorage`).</li>
          <li><strong>Login com Google (Opcional):</strong> Armazena ID único, e-mail e nome de exibição no Supabase para autenticação.</li>
          <li><strong>Mergulhe Plus:</strong> Transações processadas pelas lojas oficiais (Google Play e Apple App Store). Não coletamos nem armazenamos dados de cartão de crédito.</li>
        </ul>
      </section>

      <section>
        <h3 className="font-serif text-sm text-[var(--foam)] font-semibold">3. Permissões do Aparelho</h3>
        <p className="mt-1 text-white/70">
          • <strong>Notificações:</strong> Somente para avisar quando seu foco terminar.<br />
          • <strong>Vibração (Háptica):</strong> Feedback tátil local de conclusão de timer.<br />
          • <strong>Bateria:</strong> Ajuste local de taxa de quadros (modo economia a 30 FPS). Sem envio a servidores.<br />
          • <strong>Áudio:</strong> Geração de paisagens sonoras oceânicas relaxantes no navegador.
        </p>
      </section>

      <section>
        <h3 className="font-serif text-sm text-[var(--foam)] font-semibold">4. Seus Direitos (LGPD / GDPR)</h3>
        <p className="mt-1 text-white/70">
          Você tem direito a acessar, corrigir, exportar via JSON ou solicitar a exclusão de seus dados.
          Para exclusão de conta e perfil associado, envie um e-mail para{" "}
          <span className="text-[var(--gold)] select-all">privacidade@mergulhe.app</span>.
        </p>
      </section>
    </>
  );
}

function TermsContent() {
  return (
    <>
      <div className="rounded-lg border border-amber-400/25 bg-amber-950/20 p-3 text-[11px] text-amber-200 leading-relaxed">
        <strong>Aviso de Bem-Estar:</strong> O Mergulhe é uma ferramenta de produtividade e gerenciamento
        de tempo. Não substitui tratamentos ou diagnósticos médicos para TDAH, ansiedade ou depressão.
      </div>

      <section>
        <h3 className="font-serif text-sm text-[var(--foam)] font-semibold">1. Aceitação e Licença</h3>
        <p className="mt-1 text-white/70">
          Concedemos a você uma licença pessoal, revogável, não comercial e não exclusiva para utilizar o
          Mergulhe em seus aparelhos pessoais.
        </p>
      </section>

      <section>
        <h3 className="font-serif text-sm text-[var(--foam)] font-semibold">2. Propriedade Intelectual</h3>
        <p className="mt-1 text-white/70">
          Todas as artes em pixel art, sprites de espécies marinhas, paisagens sonoras e código-fonte são
          de propriedade do Mergulhe e protegidos pelas leis de direitos autorais.
        </p>
      </section>

      <section>
        <h3 className="font-serif text-sm text-[var(--foam)] font-semibold">3. Mergulhe Plus e Reembolsos</h3>
        <p className="mt-1 text-white/70">
          O Mergulhe Plus é uma compra única com desbloqueio de extras de contemplação. As compras são
          processadas pela Google Play Store e Apple App Store, sujeitas às regras e políticas de reembolso
          das respectivas lojas e ao Código de Defesa do Consumidor.
        </p>
      </section>

      <section>
        <h3 className="font-serif text-sm text-[var(--foam)] font-semibold">4. Legislação e Contato</h3>
        <p className="mt-1 text-white/70">
          Estes Termos são regidos pelas leis da República Federativa do Brasil. Para dúvidas ou suporte,
          contate-nos em <span className="text-[var(--gold)] select-all">suporte@mergulhe.app</span>.
        </p>
      </section>
    </>
  );
}
