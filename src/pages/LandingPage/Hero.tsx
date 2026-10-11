import { Button } from '../../components/ui/Button';
import { CompostCrossSection } from './CompostCrossSection';
import { scrollToId } from './Header';

export function Hero({ onDemo }: { onDemo: () => void }) {
  return (
    <section id="top" className="container-x grid items-center gap-10 pb-16 pt-10 sm:pt-14 lg:grid-cols-12 lg:gap-8 lg:pb-24 lg:pt-16">
      <div className="lg:col-span-7">
        <h1 className="text-[clamp(2.2rem,5.2vw,4.1rem)] font-semibold leading-[1.08] tracking-tight">
          ორგანული ნარჩენი გადააქციეთ ბიოჰუმუსად.
        </h1>
        <p className="mt-6 max-w-[34rem] text-lg leading-relaxed text-espresso/85 sm:text-xl">
          მიკორიზა აერთიანებს ბუნებრივ ბიოპროცესს, სენსორებსა და დისტანციურ კონტროლს ერთ მარტივ და ეფექტურ სისტემაში.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button size="lg" onClick={onDemo}>
            მოითხოვეთ დემო
          </Button>
          <Button size="lg" variant="secondary" onClick={() => scrollToId('how')}>
            როგორ მუშაობს
          </Button>
        </div>
        <p className="mt-10 max-w-md border-t border-umber/30 pt-4 text-[15px] text-espresso/80">
          ადამიანი რჩება პროცესის ცენტრში. სისტემა მას ეხმარება, დროულად შეამჩნიოს გადახრა და იცოდეს, რა გააკეთოს.
        </p>
      </div>
      <div className="lg:col-span-5 lg:translate-y-8">
        <CompostCrossSection />
      </div>
    </section>
  );
}
