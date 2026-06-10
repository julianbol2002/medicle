import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Medicle",
  description:
    "Learn about Medicle, a free suite of Wordle-style clinical case games for medical students, veterinary students, dental students, psychiatry learners, and law students.",
};

const FEEDBACK_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSe6EvwFZl8bNjuiICiyTB-lekERWn_L32p_fR6Wu8qIETYBmw/viewform";

export default function AboutPage() {
  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');`}</style>
      <main
        className="min-h-screen"
        style={{
          background: "#f5f5f5",
          color: "#1a1a1a",
          fontFamily: "'Poppins', sans-serif",
        }}
      >
        <article className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
          <p className="mb-8">
            <Link
              href="/"
              className="text-sm font-medium hover:underline"
              style={{ color: "#dc2626" }}
            >
              ← Back to Medicle
            </Link>
          </p>

          <header className="mb-10">
            <h1
              className="text-3xl font-bold tracking-tight sm:text-4xl"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              About Medicle
            </h1>
            <p className="mt-3 text-base leading-relaxed text-neutral-600">
              Medicle is a free, browser-based suite of daily and endless diagnosis games built for
              learners who want to practice clinical reasoning in a familiar, low-pressure format.
            </p>
          </header>

          <div className="space-y-10 text-base leading-relaxed text-neutral-800">
            <section>
              <h2 className="mb-3 text-xl font-semibold text-neutral-900">What is Medicle?</h2>
              <p>
                Medicle is a free, browser-based daily and endless clinical case diagnosis game
                inspired by Wordle and{" "}
                <a
                  href="https://doctordle.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium underline decoration-neutral-400 underline-offset-2 hover:decoration-neutral-700"
                >
                  Doctordle
                </a>
                . Players are presented with progressive clinical vignettes one clue at a time and
                must identify the correct diagnosis before running out of guesses. Each vignette is
                written to feel like a real patient presentation: demographics, history, physical
                exam findings, laboratory results, and imaging clues arrive in sequence, mimicking how
                clinicians narrow a differential diagnosis in practice.
              </p>
              <p className="mt-4">
                A new daily case is released every day, giving you a shared challenge you can
                complete once and compare with classmates or friends. If you miss a day or want more
                practice, you can browse the archive of past daily cases and replay any case you
                have not yet solved. For unlimited practice, Endless Mode draws from a rotating pool
                of AI-generated cases covering Step 1–level medicine across major organ systems and
                common presentations seen on board exams and in clinical clerkships.
              </p>
              <p className="mt-4">
                Medicle is designed to be quick enough for a coffee break but substantive enough to
                reinforce pattern recognition, pathophysiology, and the kind of structured thinking
                that high-stakes exams reward. You do not need an account, a download, or a
                subscription—just open the site and start diagnosing.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-neutral-900">How to Play</h2>
              <p>
                The core gameplay loop is simple. When you start a case, you see the first clinical
                clue—a short piece of the vignette, such as the patient&apos;s age and chief
                complaint. You type your best diagnosis into the autocomplete field and submit your
                answer. The diagnosis bank includes hundreds of terms drawn from a curated list and
                from cases in the game, so you can search by partial name rather than typing an
                exact string from memory.
              </p>
              <p className="mt-4">
                If your guess is incorrect, a new clue is revealed and you lose one of your six
                total guesses. Clues continue to unfold in order until you either identify the
                correct diagnosis or exhaust your guesses. Wrong answers do not end the round
                immediately; they cost a guess and unlock the next piece of the story. This mirrors
                the real clinical process of gathering more data when your initial impression does
                not fit.
              </p>
              <p className="mt-4">
                After you complete a case—whether you solved it in one clue or used all six—you can
                share your result as a compact score grid, similar to Wordle. From there you can
                jump to another archived daily case, return to today&apos;s case, or switch into
                Endless Mode for a random case from the broader pool. You can also filter cases by
                body system when you want to focus your study on cardiology, neurology, infectious
                disease, or any other tagged category available in the case files.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-neutral-900">The Games</h2>
              <p className="mb-4">
                Medicle is the flagship game, but the same daily-and-endless format extends across
                five specialty sites under the medicle.net umbrella. Each game uses its own case
                library, diagnosis bank, and color theme while sharing the same clean interface and
                rules.
              </p>

              <h3 className="mb-2 text-lg font-semibold text-neutral-900">
                <a href="https://medicle.net" className="hover:underline">
                  Medicle
                </a>
              </h3>
              <p className="mb-6">
                Medicle at{" "}
                <a href="https://medicle.net" className="font-medium hover:underline">
                  medicle.net
                </a>{" "}
                focuses on clinical medicine at the Step 1 level. Cases span internal medicine,
                surgery, pediatrics, obstetrics, psychiatry cross-over presentations, and other
                high-yield topics tested on the USMLE and similar qualifying exams. Whether you are
                consolidating pathology from coursework or warming up before a question bank
                session, Medicle gives you bite-sized vignettes that emphasize diagnosis over
                memorizing isolated facts.
              </p>

              <h3 className="mb-2 text-lg font-semibold text-neutral-900">
                <a href="https://medicle.net/vettle" className="hover:underline">
                  Vettle
                </a>
              </h3>
              <p className="mb-6">
                Vettle at{" "}
                <a href="https://medicle.net/vettle" className="font-medium hover:underline">
                  medicle.net/vettle
                </a>{" "}
                delivers NAVLE-style veterinary cases across canine, feline, equine, bovine, and
                exotic species. Presentations cover small-animal internal medicine, toxicology,
                cardiology, dermatology, theriogenology, and large-animal emergencies. Veterinary
                students can use Vettle to practice species-specific differentials and to review
                board-relevant patterns without needing a full multi-hour practice exam.
              </p>

              <h3 className="mb-2 text-lg font-semibold text-neutral-900">
                <a href="https://medicle.net/psychodle" className="hover:underline">
                  Psychodle
                </a>
              </h3>
              <p className="mb-6">
                Psychodle at{" "}
                <a href="https://medicle.net/psychodle" className="font-medium hover:underline">
                  medicle.net/psychodle
                </a>{" "}
                presents DSM-5–aligned psychiatry cases covering mood disorders, psychotic disorders,
                personality disorders, substance use disorders, anxiety and trauma-related conditions,
                and other psychiatric syndromes commonly tested on shelf exams and in residency
                training. Clues emphasize history, mental status findings, and contextual factors
                that point toward a primary psychiatric diagnosis.
              </p>

              <h3 className="mb-2 text-lg font-semibold text-neutral-900">
                <a href="https://medicle.net/dentdle" className="hover:underline">
                  Dentdle
                </a>
              </h3>
              <p className="mb-6">
                Dentdle at{" "}
                <a href="https://medicle.net/dentdle" className="font-medium hover:underline">
                  medicle.net/dentdle
                </a>{" "}
                focuses on dental and oral medicine, including periodontics, endodontics, oral
                pathology, oral surgery, and restorative considerations. Cases describe
                intraoral findings, radiographic patterns, patient history, and management context so
                dental students can sharpen diagnostic skills relevant to board preparation and
                clinical rotations.
              </p>

              <h3 className="mb-2 text-lg font-semibold text-neutral-900">
                <a href="https://medicle.net/crimindle" className="hover:underline">
                  Crimindle
                </a>
              </h3>
              <p>
                Crimindle at{" "}
                <a href="https://medicle.net/crimindle" className="font-medium hover:underline">
                  medicle.net/crimindle
                </a>{" "}
                applies the same clue-by-clue format to criminal law fact patterns. Players work
                through scenarios involving homicide, property crimes, white-collar offenses,
                inchoate crimes, and related doctrines tested on law school exams and the bar. Each
                case asks you to identify the most appropriate charge or legal conclusion given the
                facts as they are revealed.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-neutral-900">Who Is This For?</h2>
              <p>
                Medicle and its sister games are built for anyone who learns best through repeated,
                low-stakes practice. Medical students preparing for USMLE Step 1 and Step 2 will find
                cases that reinforce differential diagnosis and classic presentations. Veterinary
                students studying for the NAVLE can drill species-specific patterns in Vettle. Dental
                students preparing for board exams can use Dentdle for oral medicine review.
                Psychiatry residents and medical students on psychiatry rotations can sharpen DSM-5
                diagnostic thinking with Psychodle. Law students studying for the bar or criminal
                law courses can use Crimindle to apply elements and doctrines to novel fact
                patterns.
              </p>
              <p className="mt-4">
                You do not need to be enrolled in a formal program to enjoy the games. Many players
                treat a daily case as a five-minute brain exercise—similar to a crossword or
                Wordle—for anyone interested in how clinicians, veterinarians, dentists, and lawyers
                reason from incomplete information toward a conclusion.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-neutral-900">
                Case Quality and Disclaimer
              </h2>
              <p>
                Transparency matters. All cases across Medicle, Vettle, Psychodle, Dentdle, and
                Crimindle are AI-generated for educational and entertainment purposes only. They are
                designed to resemble exam-style vignettes and to stimulate thinking, but they may
                contain inaccuracies, oversimplifications, or outdated details. They are not
                intended as clinical advice and must not be used as a substitute for professional
                medical, veterinary, dental, or legal judgment.
              </p>
              <p className="mt-4">
                Never use these games to make real decisions about patient care, animal health,
                dental treatment, or legal matters. Always consult qualified professionals and
                authoritative sources when accuracy matters. We review and refine cases over time
                based on community feedback, but no educational game can replace supervised training,
                textbooks, question banks, or live clinical experience.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-neutral-900">Feedback</h2>
              <p>
                We welcome corrections, suggestions for new case topics, and reports of confusing or
                misleading clues. Your feedback helps us improve diagnosis banks, fix tagging, and
                prioritize which body systems and specialties to expand next. If you spot an error
                or have an idea for the project, please use our{" "}
                <a
                  href={FEEDBACK_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium underline decoration-neutral-400 underline-offset-2 hover:decoration-neutral-700"
                >
                  feedback form
                </a>
                . We read every submission and use it to guide future updates to the case libraries
                and game experience.
              </p>
            </section>
          </div>

          <footer className="mt-12 border-t border-neutral-200 pt-8 text-sm text-neutral-500">
            <p>
              <Link href="/" className="font-medium hover:underline" style={{ color: "#dc2626" }}>
                Play Medicle
              </Link>
              {" · "}
              <a href={FEEDBACK_URL} target="_blank" rel="noopener noreferrer" className="hover:underline">
                Feedback
              </a>
            </p>
            <p className="mt-2">© {new Date().getFullYear()} Medicle. For educational use only.</p>
          </footer>
        </article>
      </main>
    </>
  );
}
