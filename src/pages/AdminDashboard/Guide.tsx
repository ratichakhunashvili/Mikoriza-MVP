import { useSearchParams } from 'react-router-dom';
import { GUIDE } from '../../data/mockData/guide';
import { PageHeader } from './parts';

export default function Guide() {
  const [params, setParams] = useSearchParams();
  const topic = params.get('topic') ?? GUIDE[0].id;
  const current = GUIDE.find((g) => g.id === topic) ?? GUIDE[0];

  return (
    <div>
      <PageHeader title="ცნობარი" text="მოკლე და პრაქტიკული ინსტრუქციები ოპერატორისთვის. გაფრთხილებებიდან პირდაპირ აქ მოხვდებით." />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <nav aria-label="ინსტრუქციების სია" className="lg:col-span-5">
          <ul className="border-t border-umber/30">
            {GUIDE.map((g) => (
              <li key={g.id} className="border-b border-umber/30">
                <button
                  type="button"
                  aria-current={g.id === current.id ? 'true' : undefined}
                  onClick={() => setParams({ topic: g.id })}
                  className={`block w-full px-3 py-3.5 text-left ${g.id === current.id ? 'bg-espresso text-cream' : 'hover:bg-espresso/10'}`}
                >
                  <span className="font-semibold">{g.title}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <article className="panel lg:col-span-7" aria-labelledby="guide-title" data-testid="guide-detail">
          <h2 id="guide-title" className="text-2xl font-semibold leading-tight">
            {current.title}
          </h2>
          <p className="mt-2 text-espresso/85">{current.summary}</p>
          <ol className="mt-5 space-y-4">
            {current.steps.map((s, i) => (
              <li key={s} className="flex gap-4">
                <span className="num flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-espresso text-sm font-semibold text-cream">{i + 1}</span>
                <p className="pt-0.5">{s}</p>
              </li>
            ))}
          </ol>
        </article>
      </div>
    </div>
  );
}
