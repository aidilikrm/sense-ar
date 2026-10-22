"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

type Difficulty = "Easy" | "Moderate" | "Advanced";

type Activity = {
  id: number;
  title: string;
  description: string;
  difficulty: Difficulty;
  skill: string;
  emoji: string;
  href: string;
};

const activities: Activity[] = [
  {
    id: 1,
    title: "Animals & Texture",
    description:
      "Explore animals, listen to sounds and discover different textures through touch.",
    difficulty: "Easy",
    skill: "Sensory Exploration",
    emoji: "🐑",
    href: "/animals",
  },
  {
    id: 2,
    title: "Soft Texture",
    description:
      "Explore soft materials and learn to recognise different tactile sensations.",
    difficulty: "Easy",
    skill: "Tactile Recognition",
    emoji: "🧸",
    href: "/soft-texture",
  },
  {
    id: 3,
    title: "Sensory Wall",
    description:
      "Touch and compare different surfaces to develop tactile discrimination skills.",
    difficulty: "Easy",
    skill: "Tactile Discrimination",
    emoji: "✋",
    href: "/sensory-wall",
  },
  {
    id: 4,
    title: "Our Farm",
    description:
      "Explore familiar farm objects and recognise them through interactive learning.",
    difficulty: "Easy",
    skill: "Visual Recognition",
    emoji: "🍓",
    href: "/our-farm",
  },
  {
    id: 5,
    title: "Zipper Skills",
    description:
      "Practise opening and closing a zipper to strengthen fine motor coordination.",
    difficulty: "Moderate",
    skill: "Fine Motor Skills",
    emoji: "🤐",
    href: "/zipper-skills",
  },
  {
    id: 6,
    title: "Shape Match",
    description:
      "Match shapes correctly and strengthen visual-spatial recognition skills.",
    difficulty: "Moderate",
    skill: "Shape Recognition",
    emoji: "🔺",
    href: "/shape-match",
  },
  {
    id: 7,
    title: "Creative Pizza",
    description:
      "Create your own pizza while developing creativity and fine motor skills.",
    difficulty: "Moderate",
    skill: "Creativity & Fine Motor",
    emoji: "🍕",
    href: "/creative-pizza",
  },
  {
    id: 8,
    title: "Shoelace Skills",
    description:
      "Practise shoelace skills through an interactive daily living activity.",
    difficulty: "Advanced",
    skill: "Daily Living Skills",
    emoji: "👟",
    href: "/shoelace-skills",
  },
  {
    id: 9,
    title: "Brush My Teeth",
    description:
      "Explore crocodile teeth and learn through a fun self-care sensory activity.",
    difficulty: "Advanced",
    skill: "Self-Care Skills",
    emoji: "🐊",
    href: "/brush-my-teeth",
  },
];

export default function Home() {
  const [difficultyFilter, setDifficultyFilter] =
    useState("All");

  const [skillFilter, setSkillFilter] =
    useState("All");

  const skills = useMemo(() => {
    return Array.from(
      new Set(
        activities.map((activity) => activity.skill)
      )
    );
  }, []);

  const filteredActivities = activities.filter(
    (activity) => {
      const difficultyMatch =
        difficultyFilter === "All" ||
        activity.difficulty === difficultyFilter;

      const skillMatch =
        skillFilter === "All" ||
        activity.skill === skillFilter;

      return difficultyMatch && skillMatch;
    }
  );

  function getDifficultyStyle(
    difficulty: Difficulty
  ) {
    if (difficulty === "Easy") {
      return "bg-emerald-100 text-emerald-700";
    }

    if (difficulty === "Moderate") {
      return "bg-orange-100 text-orange-700";
    }

    return "bg-purple-100 text-purple-700";
  }

  return (
    <main className="min-h-screen bg-[#fffdf8] text-slate-800">

      {/* HEADER */}

      <header className="sticky top-0 z-50 border-b border-orange-100 bg-white/95 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3">

          <Link href="/">
            <Image
              src="/images/sense-ar-logo.png"
              alt="SENSE-AR Logo"
              width={170}
              height={100}
              className="h-[62px] w-auto object-contain"
              priority
            />
          </Link>

          <div className="hidden rounded-full bg-orange-50 px-5 py-2 text-sm font-bold text-orange-600 sm:block">
            Touch • Learn • Explore
          </div>

        </div>
      </header>

      {/* HERO */}

      <section className="relative overflow-hidden">

        <div className="absolute -left-20 top-10 h-64 w-64 rounded-full bg-orange-100/50 blur-3xl" />

        <div className="absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-emerald-100/50 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-5 py-16 text-center md:py-24">

          <div className="mx-auto inline-flex rounded-full bg-emerald-100 px-5 py-2 text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
            Augmented Reality Learning
          </div>

          <h1 className="mx-auto mt-6 max-w-4xl text-4xl font-black leading-tight text-slate-900 md:text-6xl">
            Learn Through
            <span className="text-orange-500">
              {" "}Touch
            </span>
            , Play &
            <span className="text-emerald-500">
              {" "}Explore
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
            An augmented reality multisensory
            learning book designed to make learning
            more interactive, engaging and meaningful.
          </p>

          <div className="mx-auto mt-10 grid max-w-2xl grid-cols-3 gap-3">

            <div className="rounded-3xl border border-orange-100 bg-white p-5 shadow-sm">
              <div className="text-3xl font-black text-orange-500">
                9
              </div>

              <p className="mt-1 text-xs font-bold text-slate-500">
                Activities
              </p>
            </div>

            <div className="rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm">
              <div className="text-3xl">
                👀✋
              </div>

              <p className="mt-1 text-xs font-bold text-slate-500">
                Multisensory
              </p>
            </div>

            <div className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm">
              <div className="text-3xl">
                📱
              </div>

              <p className="mt-1 text-xs font-bold text-slate-500">
                AR Learning
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* HOW IT WORKS */}

      <section className="bg-white">

        <div className="mx-auto max-w-7xl px-5 py-16">

          <div className="text-center">

            <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-500">
              Simple & Interactive
            </p>

            <h2 className="mt-2 text-3xl font-black text-slate-900 md:text-4xl">
              How It Works
            </h2>

            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">
              Combine the physical sensory book
              with digital AR activities for an
              engaging learning experience.
            </p>

          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">

            <div className="rounded-[30px] border border-orange-100 bg-orange-50/60 p-7 text-center">

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-3xl shadow-sm">
                📖
              </div>

              <div className="mx-auto mt-4 flex h-7 w-7 items-center justify-center rounded-full bg-orange-500 text-xs font-black text-white">
                1
              </div>

              <h3 className="mt-3 text-lg font-black text-slate-900">
                Open the Sensory Book
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Choose an activity from the physical
                SENSE-AR sensory book.
              </p>

            </div>

            <div className="rounded-[30px] border border-blue-100 bg-blue-50/60 p-7 text-center">

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-3xl shadow-sm">
                📱
              </div>

              <div className="mx-auto mt-4 flex h-7 w-7 items-center justify-center rounded-full bg-blue-500 text-xs font-black text-white">
                2
              </div>

              <h3 className="mt-3 text-lg font-black text-slate-900">
                Scan & Explore
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Scan the QR code and start the
                interactive AR activity.
              </p>

            </div>

            <div className="rounded-[30px] border border-emerald-100 bg-emerald-50/60 p-7 text-center">

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-3xl shadow-sm">
                ✋
              </div>

              <div className="mx-auto mt-4 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-xs font-black text-white">
                3
              </div>

              <h3 className="mt-3 text-lg font-black text-slate-900">
                Touch, Learn & Play
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Follow the audio instructions and
                interact with the sensory book.
              </p>

            </div>

          </div>

        </div>
      </section>

      {/* ACTIVITIES */}

      <section
        id="activities"
        className="mx-auto max-w-7xl px-5 py-16"
      >

        <div className="text-center">

          <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600">
            Learning Activities
          </p>

          <h2 className="mt-2 text-3xl font-black text-slate-900 md:text-4xl">
            Choose an Activity
          </h2>

          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">
            Each activity supports different sensory,
            motor and daily living skills.
          </p>

        </div>

        {/* FILTER */}

        <div className="mt-10 rounded-[28px] border border-orange-100 bg-white p-5 shadow-sm">

          <div className="grid gap-4 md:grid-cols-2">

            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                Difficulty
              </label>

              <select
                value={difficultyFilter}
                onChange={(event) =>
                  setDifficultyFilter(
                    event.target.value
                  )
                }
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-orange-400"
              >
                <option value="All">
                  All Levels
                </option>

                <option value="Easy">
                  Easy
                </option>

                <option value="Moderate">
                  Moderate
                </option>

                <option value="Advanced">
                  Advanced
                </option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                Skill
              </label>

              <select
                value={skillFilter}
                onChange={(event) =>
                  setSkillFilter(
                    event.target.value
                  )
                }
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-orange-400"
              >
                <option value="All">
                  All Skills
                </option>

                {skills.map((skill) => (
                  <option
                    key={skill}
                    value={skill}
                  >
                    {skill}
                  </option>
                ))}
              </select>
            </div>

          </div>
        </div>

        {/* ACTIVITY CARDS */}

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">

          {filteredActivities.map(
            (activity) => (
              <div
                key={activity.id}
                className="group flex flex-col overflow-hidden rounded-[30px] border border-slate-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
              >

                <div className="relative flex min-h-[180px] items-center justify-center bg-gradient-to-br from-orange-50 via-white to-emerald-50">

                  <div className="text-7xl transition duration-300 group-hover:scale-110">
                    {activity.emoji}
                  </div>

                  <div
                    className={`absolute left-4 top-4 rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-wider ${getDifficultyStyle(
                      activity.difficulty
                    )}`}
                  >
                    {activity.difficulty}
                  </div>

                  {/* SEMUA UNLOCK */}

                  <div className="absolute right-4 top-4 rounded-full bg-emerald-500 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-white">
                    Activity
                  </div>

                </div>

                <div className="flex flex-1 flex-col p-6">

                  <div className="text-xs font-black uppercase tracking-wider text-orange-500">
                    {activity.skill}
                  </div>

                  <h3 className="mt-2 text-xl font-black text-slate-900">
                    {activity.title}
                  </h3>

                  <p className="mt-3 flex-1 text-sm leading-6 text-slate-500">
                    {activity.description}
                  </p>

                  {/* SEMUA LINK AKTIF */}

                  <Link
                    href={activity.href}
                    className="mt-6 flex w-full items-center justify-center rounded-2xl bg-orange-500 px-5 py-3.5 text-sm font-black text-white shadow-md transition hover:bg-orange-600"
                  >
                    Start Activity
                    <span className="ml-2">
                      →
                    </span>
                  </Link>

                </div>

              </div>
            )
          )}

        </div>

        {filteredActivities.length === 0 && (
          <div className="mt-10 rounded-[30px] bg-white p-10 text-center shadow-sm">
            <div className="text-5xl">
              🔍
            </div>

            <h3 className="mt-3 text-xl font-black text-slate-800">
              No Activities Found
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Try selecting a different difficulty
              level or skill.
            </p>
          </div>
        )}

      </section>

      {/* MULTISENSORY */}

      <section className="bg-slate-900 text-white">

        <div className="mx-auto max-w-7xl px-5 py-16">

          <div className="text-center">

            <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-400">
              Multisensory Learning
            </p>

            <h2 className="mt-2 text-3xl font-black md:text-4xl">
              Learning Through Multiple Senses
            </h2>

            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-300">
              SENSE-AR combines physical sensory
              activities with digital interaction
              to support engaging and meaningful
              learning experiences.
            </p>

          </div>

          <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">

            <div className="rounded-3xl bg-white/10 p-6 text-center">
              <div className="text-4xl">👀</div>

              <h3 className="mt-3 font-black">
                Visual
              </h3>

              <p className="mt-1 text-xs text-slate-300">
                See and recognise
              </p>
            </div>

            <div className="rounded-3xl bg-white/10 p-6 text-center">
              <div className="text-4xl">🔊</div>

              <h3 className="mt-3 font-black">
                Auditory
              </h3>

              <p className="mt-1 text-xs text-slate-300">
                Listen and follow
              </p>
            </div>

            <div className="rounded-3xl bg-white/10 p-6 text-center">
              <div className="text-4xl">✋</div>

              <h3 className="mt-3 font-black">
                Tactile
              </h3>

              <p className="mt-1 text-xs text-slate-300">
                Touch and feel
              </p>
            </div>

            <div className="rounded-3xl bg-white/10 p-6 text-center">
              <div className="text-4xl">📱</div>

              <h3 className="mt-3 font-black">
                Interactive
              </h3>

              <p className="mt-1 text-xs text-slate-300">
                Explore with AR
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* FOOTER */}

      <footer className="border-t border-orange-100 bg-white">

        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-5 py-7 sm:flex-row">

          <Image
            src="/images/sense-ar-logo.png"
            alt="SENSE-AR Logo"
            width={120}
            height={70}
            className="h-[48px] w-auto object-contain"
          />

          <div className="text-center sm:text-right">

            <p className="text-sm font-black text-slate-700">
              Touch • Learn • Explore
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Augmented Reality Multisensory Learning Book
            </p>

          </div>

        </div>
      </footer>

    </main>
  );
}