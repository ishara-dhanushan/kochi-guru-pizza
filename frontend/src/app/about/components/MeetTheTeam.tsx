// src/app/about/components/MeetTheTeam.tsx
"use client";

import React from "react";
import { ChefHat, Flame, Heart } from "lucide-react";
import { motion } from "framer-motion";
import ScrollAnimatedList from "@components/ScrollAnimatedList";
import ScrollAnimatedItem from "@components/ScrollAnimatedItem";

const team = [
  {
    initials: "KG",
    name: "The Founder",
    role: "Head Chef & Owner",
    quote:
      "I wanted Walasmulla to have a place where every bite felt like a little celebration. That dream became Kochi Guru Pizza.",
    icon: <Flame className="w-5 h-5" />,
    gradient: "from-orange-400 to-red-500"
  },
  {
    initials: "PK",
    name: "Pizzaiolo",
    role: "Wood-Fired Oven Specialist",
    quote:
      "The oven is alive. Each pizza needs its own attention, its own timing. I love that no two days are ever the same.",
    icon: <ChefHat className="w-5 h-5" />,
    gradient: "from-amber-400 to-orange-500"
  },
  {
    initials: "SR",
    name: "The Kitchen Heart",
    role: "Prep & Ingredients Lead",
    quote:
      "Fresh is not a marketing word for us — it is a rule. I make sure every sauce, every topping meets the standard before it reaches the oven.",
    icon: <Heart className="w-5 h-5" />,
    gradient: "from-rose-400 to-orange-400"
  }
];

export default function MeetTheTeam() {
  return (
    <section className="py-20 md:py-24 bg-surface transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14 gpu-fix"
        >
          <span className="inline-block text-brand font-semibold text-sm uppercase tracking-widest mb-3">
            The People Behind the Pizza
          </span>
          <h2 className="font-heading text-3xl md:text-5xl font-bold text-content-main mb-4">
            Meet Our Team
          </h2>
          <p className="text-lg text-content-muted max-w-2xl mx-auto">
            Every great pizza starts with great people. These are the hands,
            hearts, and stories behind every slice.
          </p>
        </motion.div>

        <ScrollAnimatedList className="grid grid-cols-1 md:grid-cols-3 gap-7">
          {team.map((member) => (
            <ScrollAnimatedItem key={member.name} className="h-full">
              <motion.div
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
                className="group relative bg-surface-card rounded-2xl shadow-md hover:shadow-xl transition-smooth border border-divider-card p-8 flex flex-col items-center text-center overflow-hidden gpu-fix h-full"
              >
                {/* Subtle background glow */}
                <div
                  className={`absolute top-0 left-0 right-0 h-1 bg-linear-to-r ${member.gradient} opacity-80`}
                />

                {/* Avatar */}
                <div
                  className={`flex items-center justify-center w-20 h-20 rounded-full bg-linear-to-br ${member.gradient} text-brand-on text-2xl font-bold font-heading mb-5 shadow-lg group-hover:scale-105 transition-transform`}
                >
                  {member.initials}
                </div>

                {/* Name & Role */}
                <h3 className="font-heading text-xl font-bold text-content-main mb-1">
                  {member.name}
                </h3>
                <div className="inline-flex items-center gap-1.5 text-brand text-sm font-semibold mb-5">
                  {member.icon}
                  {member.role}
                </div>

                {/* Quote */}
                <div className="relative">
                  <span className="absolute -top-2 -left-1 text-4xl text-brand-decoration font-serif leading-none select-none">
                    &ldquo;
                  </span>
                  <p className="text-content-muted leading-relaxed italic pl-4">
                    {member.quote}
                  </p>
                </div>
              </motion.div>
            </ScrollAnimatedItem>
          ))}
        </ScrollAnimatedList>

        {/* Bottom note */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: false, amount: 0.5 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center text-sm text-content-faint mt-10 gpu-fix"
        >
          Plus our wonderful front-of-house crew who make every visit memorable.
        </motion.p>
      </div>
    </section>
  );
}
