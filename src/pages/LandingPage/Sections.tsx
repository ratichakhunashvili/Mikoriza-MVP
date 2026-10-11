import type { ComponentType } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle,
  CaretDown,
  Cpu,
  Drop,
  Flask,
  Gear,
  HandHeart,
  Lightning,
  Plant,
  Broadcast,
  SlidersHorizontal,
  Thermometer,
  ArrowsClockwise,
  type IconProps,
} from '@phosphor-icons/react';
import { Button } from '../../components/ui/Button';
import { Chip } from '../../components/ui/Chip';
import { Logo } from '../../components/brand/Logo';
import { FAQ, HUMAN_TASKS, PROBLEMS, SOLUTION_BLOCKS, STEPS, SYSTEM_TASKS, TECH } from '../../data/content/landing';

type Icon = ComponentType<IconProps>;

export function ProblemSection() {
  return (
    <section className="container-x grid gap-10 py-16 lg:grid-cols-12 lg:gap-16 lg:py-24">
      <div className="lg:col-span-5">
        <div className="lg:sticky lg:top-28">
          <h2 className="h-section">პრობლემა ხშირად მაშინ ჩანს, როცა უკვე გვიანია.</h2>
          <p className="mt-5 max-w-md text-lg text-espresso/85">
            ორგანული ნარჩენის გადამუშავება ცოცხალი პროცესია. ის ყოველდღიურ ყურადღებას მოითხოვს, მაგრამ ადამიანს ყველაფრის ერთდროულად დაკვირვება არ შეუძლია.
          </p>
        </div>
      </div>
      <ul className="lg:col-span-7">
        {PROBLEMS.map((p, i) => (
          <li key={p.title} className={`py-6 ${i === 0 ? 'border-t' : ''} border-b border-umber/30`}>
            <h3 className="text-xl font-semibold leading-snug sm:text-2xl">{p.title}</h3>
            <p className="mt-2 max-w-xl text-espresso/85">{p.text}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

const SOLUTION_ICON: Record<string, Icon> = {
  bio: Plant,
  mech: Gear,
  sens: Thermometer,
  auto: SlidersHorizontal,
  remote: Broadcast,
  human: HandHeart,
};

export function SolutionSection() {
  const b = (id: string) => SOLUTION_BLOCKS.find((x) => x.id === id)!;
  const block = (id: string, cls: string, dark = false) => {
    const x = b(id);
    const I = SOLUTION_ICON[id];
    return (
      <article className={`${cls} flex flex-col justify-between gap-8 rounded-2xl p-6 sm:p-7 ${dark ? 'on-dark bg-espresso text-cream' : ''}`}>
        <I size={30} weight="regular" className={dark ? 'text-sand' : 'text-umber'} aria-hidden />
        <div>
          <h3 className={`font-semibold leading-tight ${id === 'bio' ? 'text-3xl sm:text-4xl' : 'text-xl sm:text-2xl'}`}>{x.title}</h3>
          <p className={`mt-3 max-w-md ${dark ? 'text-cream/85' : 'text-espresso/85'}`}>{x.text}</p>
        </div>
      </article>
    );
  };
  return (
    <section id="system" className="bg-sand/35 py-16 lg:py-24">
      <div className="container-x">
        <h2 className="h-section max-w-3xl">ბიოპროცესი ცენტრშია, ტექნოლოგია მას ეხმარება.</h2>
        <p className="mt-5 max-w-2xl text-lg text-espresso/85">
          მიკორიზა არ ცვლის ბუნებრივ პროცესს. ის ქმნის პირობებს, რომლებშიც პროცესი უკეთ იმართება და მისი ისტორია ჩანს.
        </p>
        <div className="mt-10 grid gap-4 lg:grid-cols-12">
          {block('bio', 'lg:col-span-6 lg:row-span-2 min-h-[18rem]', true)}
          {block('mech', 'lg:col-span-3 border border-umber/30')}
          {block('sens', 'lg:col-span-3 border border-umber/30')}
          {block('auto', 'lg:col-span-3 border border-umber/30')}
          {block('remote', 'lg:col-span-3 border border-umber/30')}
          {block('human', 'lg:col-span-12 bg-sand sm:flex-row sm:items-end')}
        </div>
      </div>
    </section>
  );
}

export function HowSection() {
  return (
    <section id="how" className="container-x py-16 lg:py-24">
      <h2 className="h-section max-w-3xl">ხუთი ეტაპი ნარჩენიდან ბიოჰუმუსამდე</h2>
      <ol className="relative mt-12 grid gap-0 lg:grid-cols-5 lg:gap-6">
        <span aria-hidden className="absolute left-5 top-5 hidden h-px w-[calc(100%-2.5rem)] bg-umber/40 lg:block" />
        <span aria-hidden className="absolute bottom-6 left-5 top-5 w-px bg-umber/40 lg:hidden" />
        {STEPS.map((s, i) => (
          <li key={s.title} className="relative pb-9 pl-16 last:pb-0 lg:pb-0 lg:pl-0 lg:pt-16">
            <span className="num absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-espresso text-lg font-semibold text-cream">
              {i + 1}
            </span>
            <h3 className="text-2xl font-semibold">{s.title}</h3>
            <p className="mt-2 text-espresso/85">{s.text}</p>
            <Chip tone={s.who === 'სისტემა' ? 'dark' : 'neutral'} className="mt-3">
              {s.who}
            </Chip>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function ResponsibilitySection() {
  return (
    <section className="container-x pb-16 lg:pb-24">
      <h2 className="h-section max-w-3xl">ვინ რას აკეთებს</h2>
      <div className="mt-10 grid gap-4 lg:grid-cols-12">
        <div className="rounded-2xl bg-sand p-6 sm:p-8 lg:col-span-5">
          <h3 className="text-2xl font-semibold">ადამიანი</h3>
          <ul className="mt-5 space-y-3">
            {HUMAN_TASKS.map((t) => (
              <li key={t} className="flex items-start gap-3">
                <CheckCircle size={22} weight="fill" className="mt-0.5 shrink-0 text-espresso" aria-hidden />
                {t}
              </li>
            ))}
          </ul>
        </div>
        <div className="on-dark rounded-2xl bg-espresso p-6 text-cream sm:p-8 lg:col-span-7">
          <h3 className="text-2xl font-semibold">სისტემა</h3>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {SYSTEM_TASKS.map((t) => (
              <li key={t} className="flex items-start gap-3">
                <Cpu size={22} className="mt-0.5 shrink-0 text-sand" aria-hidden />
                {t}
              </li>
            ))}
          </ul>
          <p className="mt-7 border-t border-cream/20 pt-5 text-cream/85">
            სისტემა ადამიანს არ ცვლის. ის ეხმარება, რომ სწორი მოქმედება დროულად შესრულდეს.
          </p>
        </div>
      </div>
    </section>
  );
}

const TECH_ICON: Record<string, Icon> = {
  ph: Flask,
  temp: Thermometer,
  hum: Drop,
  humidifier: Drop,
  mixer: ArrowsClockwise,
  ctrl: Lightning,
  platform: Broadcast,
};

export function TechSection() {
  return (
    <section id="tech" className="bg-sand/35 py-16 lg:py-24">
      <div className="container-x grid gap-10 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <h2 className="h-section">რისგან შედგება სისტემა</h2>
          <p className="mt-5 max-w-md text-lg text-espresso/85">
            მარტივი სენსორები, მარტივი მოწყობილობები და პლატფორმა, რომელიც მათ ერთ სურათად აერთიანებს.
          </p>
          <p className="mt-6 max-w-md rounded-xl border border-umber/40 p-4 text-[15px]">
            ეს კომპონენტები სისტემის კონცეფციის ნაწილია. დემო ვერსიაში რეალური მოწყობილობები და სენსორები მიერთებული არ არის.
          </p>
        </div>
        <ul className="lg:col-span-7">
          {TECH.map((t, i) => {
            const I = TECH_ICON[t.id];
            return (
              <li key={t.id} className={`flex items-start gap-4 border-b border-umber/30 py-5 ${i === 0 ? 'border-t' : ''}`}>
                <I size={28} className="mt-0.5 shrink-0 text-umber" aria-hidden />
                <div>
                  <h3 className="text-xl font-semibold leading-snug">{t.title}</h3>
                  <p className="mt-1 text-espresso/85">{t.text}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

export function GuideSection() {
  return (
    <section id="guide" className="container-x py-16 lg:py-24">
      <h2 className="h-section">ცნობარი</h2>
      <p className="mt-4 max-w-xl text-lg text-espresso/85">მოკლე პასუხები კითხვებზე, რომლებიც ვერმიკომპოსტირების დაწყებისას ყველაზე ხშირად ჩნდება.</p>
      <div className="mt-8 max-w-3xl border-t border-umber/30">
        {FAQ.map((f) => (
          <details key={f.q} className="group border-b border-umber/30">
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 text-lg font-semibold marker:hidden [&::-webkit-details-marker]:hidden">
              {f.q}
              <CaretDown size={20} className="shrink-0 transition-transform group-open:rotate-180" aria-hidden />
            </summary>
            <p className="max-w-2xl pb-5 pr-8 text-espresso/90">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

export function FinalCta({ onDemo }: { onDemo: () => void }) {
  return (
    <section className="container-x pb-16 lg:pb-24">
      <div className="on-dark relative overflow-hidden rounded-3xl bg-espresso px-6 py-14 text-cream sm:px-14 sm:py-20">
        <h2 className="max-w-3xl text-[clamp(2rem,5vw,3.6rem)] font-semibold leading-[1.12]">ნარჩენიდან ნიადაგის სიცოცხლემდე.</h2>
        <p className="mt-5 max-w-xl text-lg text-cream/85">დაიწყეთ ორგანული ნარჩენის უფრო კონტროლირებადი და ეფექტური გადამუშავება.</p>
        <Button variant="light" size="lg" className="mt-8" onClick={onDemo}>
          დაგვიკავშირდით
        </Button>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-umber/30 py-10">
      <div className="container-x flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Logo />
          <p className="mt-3 max-w-md text-sm text-espresso/80">
            ორგანული ნარჩენის ჭკვიანი გადამუშავებისა და ვერმიკომპოსტირების სისტემა.
          </p>
        </div>
        <div className="max-w-sm text-sm text-espresso/80">
          <p>ეს არის დემო ვერსია. სენსორების მონაცემები სატესტოა და რეალურ მოწყობილობებს არ ასახავს.</p>
          <Link to="/admin" className="mt-3 inline-block font-semibold text-espresso underline underline-offset-4">
            ოპერატორის პანელი
          </Link>
        </div>
      </div>
      <p className="container-x mt-8 text-center text-sm text-espresso/70">Made by AppaRati And Ekuna</p>
    </footer>
  );
}
