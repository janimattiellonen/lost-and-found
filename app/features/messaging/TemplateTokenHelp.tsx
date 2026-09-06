import type { JSX } from 'react';

/**
 * What a template may substitute in.
 *
 * Written down where the templates are edited: the tokens were only discoverable
 * by reading replaceTokensWithValues or copying an existing template.
 */
export default function TemplateTokenHelp(): JSX.Element {
  return (
    <p className="mb-4 text-sm text-gray-600">
      Voit käyttää viestissä seuraavia: <code>[disc]</code> kiekon nimi, <code>[colour]</code> kiekon väri,{' '}
      <code>[course]</code> radan nimi (Äijänpelto), <code>[courses]</code> radan nimi genetiivissä (Äijänpellon, esim.
      &rdquo;on löytynyt [courses] radalta&rdquo;), <code>[link]</code> linkki, josta omistaja voi kertoa haluaako
      kiekon takaisin ja miten.
    </p>
  );
}
