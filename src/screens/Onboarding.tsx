import { useState } from "react";
import { IMAGES } from "../assets/images";
import { WaveMark } from "../components/WaveMark";
import { useGame } from "../game/GameContext";
import { getAudio } from "../audio/engine";

export function Onboarding() {
  const { finishOnboarding } = useGame();
  const [step, setStep] = useState(0);

  const advance = () => {
    void getAudio().start("reef");
    if (step === 0) setStep(1);
    else finishOnboarding();
  };

  return (
    <div className="relative z-20 flex min-h-dvh flex-col items-center justify-end px-6 pb-[max(32px,env(safe-area-inset-bottom))] pt-[max(24px,env(safe-area-inset-top))] text-center sm:px-8">
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-80"
        style={{
          backgroundImage: `url(${step === 0 ? IMAGES.surface : IMAGES.reefDead})`,
          imageRendering: "pixelated",
          filter: step === 0 ? "none" : "saturate(0.7) brightness(0.7)",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#061018]/30 via-[#061018]/40 to-[#061018]/92" />

      <div className="relative rise w-full max-w-md pb-4">
        {step === 0 ? (
          <>
            <WaveMark className="mx-auto text-white/70" />
            <p className="mt-3 font-pixel text-[11px] tracking-[0.55em] text-white/70">MERGULHE</p>
            <h1 className="mt-6 font-serif text-4xl leading-tight text-[var(--foam)] italic sm:text-5xl">
              Quanto mais você se concentra,
              <br />
              mais vida existe no seu oceano.
            </h1>
            <p className="mt-6 text-sm font-light tracking-wide text-white/55">
              Um pequeno mundo que cresce no silêncio do seu foco.
            </p>
          </>
        ) : (
          <>
            <p className="font-pixel text-[10px] tracking-[0.4em] text-white/50 uppercase">
              Recife de coral
            </p>
            <h2 className="mt-5 font-serif text-3xl text-[var(--foam)] italic sm:text-4xl">
              Este oceano está em silêncio.
            </h2>
            <p className="mt-5 text-sm font-light leading-relaxed text-white/60">
              Cada minuto de concentração devolve um pouco de vida.
              Não há nada para coletar. Só permanecer.
            </p>
          </>
        )}

        <button
          onClick={advance}
          className="mt-9 min-h-12 w-full border border-white/20 bg-white/5 py-4 text-[12px] tracking-[0.3em] text-[var(--foam)] uppercase hover:border-white/40 hover:bg-white/10 sm:mt-12 sm:tracking-[0.42em]"
        >
          {step === 0 ? "Continuar" : "Mergulhar"}
        </button>
      </div>
    </div>
  );
}
