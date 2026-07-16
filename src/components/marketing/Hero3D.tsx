"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  CalendarCheck,
  Check,
  Clock,
  MapPin,
  MessageCircle,
  Phone,
  Star,
} from "lucide-react";

const EASE = [0.22, 1, 0.36, 1] as const;
const SLOTS = ["10:00", "11:30", "4:30", "6:00"];

/** A single product canvas showing source-to-site transformation. */
export function Hero3D() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative mx-auto w-full max-w-[38rem] select-none" aria-hidden>
      <div className="absolute -inset-8 -z-10 rounded-full bg-[#214f43]/10 blur-3xl" />
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 28, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.15, ease: EASE }}
        className="overflow-hidden rounded-[1.35rem] border border-white/10 bg-[#111311] shadow-[0_40px_100px_-40px_rgba(9,24,19,0.55)]"
      >
        <div className="flex h-11 items-center justify-between border-b border-white/10 px-4">
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-white/20" />
            <span className="size-2 rounded-full bg-white/20" />
            <span className="size-2 rounded-full bg-white/20" />
          </div>
          <span className="font-mono text-[9px] tracking-wide text-white/35">
            paperchaiapp.com/studio
          </span>
          <div className="flex items-center gap-1.5 text-[9px] font-medium text-[#9cc2b3]">
            <span className="size-1.5 rounded-full bg-[#67b99a]" />
            Preview ready
          </div>
        </div>

        <div className="grid min-h-[410px] grid-cols-[0.86fr_1.14fr] sm:min-h-[450px]">
          <div className="border-r border-white/10 bg-[#171a17] p-4 sm:p-5">
            <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.14em] text-white/40">
              <MapPin className="size-3.5 text-[#79a894]" />
              Source
            </div>
            <div className="mt-8">
              <p className="text-base font-semibold text-white sm:text-lg">
                Glow &amp; Grace
              </p>
              <p className="mt-1 text-[11px] leading-5 text-white/45">
                Beauty salon in Bhubaneswar
              </p>
            </div>
            <div className="mt-5 flex items-center gap-2 border-y border-white/10 py-3">
              <span className="flex items-center gap-1 text-xs font-semibold text-white">
                <Star className="size-3.5 fill-[#d8ba70] text-[#d8ba70]" />
                4.9
              </span>
              <span className="text-[10px] text-white/40">182 reviews</span>
            </div>
            <div className="mt-4 space-y-3 text-[10px] text-white/50">
              <div className="flex items-center gap-2">
                <Clock className="size-3.5" />
                Open until 8 pm
              </div>
              <div className="flex items-center gap-2">
                <Phone className="size-3.5" />
                Phone and directions
              </div>
              <div className="flex items-center gap-2">
                <MessageCircle className="size-3.5" />
                Customer reviews
              </div>
            </div>

            <motion.div
              animate={reduceMotion ? undefined : { x: [0, 5, 0] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              className="mt-8 flex items-center gap-2 text-[10px] font-medium text-[#9cc2b3]"
            >
              Importing details
              <ArrowRight className="size-3.5" />
            </motion.div>
          </div>

          <div className="bg-[#f5f5f0] p-3 sm:p-4">
            <div className="h-full overflow-hidden rounded-xl bg-white shadow-[0_12px_32px_-20px_rgba(0,0,0,0.35)]">
              <div className="flex h-9 items-center justify-between border-b border-black/[0.07] px-3">
                <span className="text-[9px] font-semibold text-[#171917]">Glow &amp; Grace</span>
                <span className="rounded-full bg-[#214f43] px-2 py-1 text-[8px] font-semibold text-white">
                  Book
                </span>
              </div>

              <div className="bg-[#214f43] px-4 py-7 text-white sm:px-5 sm:py-8">
                <p className="text-[9px] font-medium uppercase tracking-[0.16em] text-white/55">
                  Salon &amp; skin studio
                </p>
                <p className="mt-3 text-xl font-semibold leading-tight tracking-tight sm:text-2xl">
                  Feel like yourself,
                  <br />only more radiant.
                </p>
                <p className="mt-3 max-w-[13rem] text-[9px] leading-4 text-white/60">
                  Thoughtful hair, skin, and bridal care in a calm neighbourhood studio.
                </p>
              </div>

              <div className="p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-black/35">
                      Book an appointment
                    </p>
                    <p className="mt-1 text-xs font-semibold text-[#171917]">Today</p>
                  </div>
                  <span className="flex items-center gap-1 text-[8px] font-medium text-[#214f43]">
                    <CalendarCheck className="size-3" />
                    Live availability
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                  {SLOTS.map((slot) => (
                    <span
                      key={slot}
                      className={
                        slot === "4:30"
                          ? "rounded-md bg-[#214f43] px-1 py-2 text-center text-[9px] font-semibold text-white"
                          : "rounded-md border border-black/10 px-1 py-2 text-center text-[9px] text-black/45"
                      }
                    >
                      {slot}
                    </span>
                  ))}
                </div>
                <div className="mt-4 grid gap-1.5 sm:grid-cols-2">
                  <span className="flex items-center justify-center gap-1.5 rounded-md bg-[#e7efe9] py-2 text-[9px] font-semibold text-[#214f43]">
                    <MessageCircle className="size-3" />
                    WhatsApp
                  </span>
                  <span className="flex items-center justify-center gap-1.5 rounded-md border border-black/10 py-2 text-[9px] font-semibold text-[#171917]">
                    <Phone className="size-3" />
                    Call
                  </span>
                </div>
                <div className="mt-4 flex items-center gap-1.5 text-[8px] text-black/40">
                  <Check className="size-3 text-[#214f43]" />
                  Reviews, photos, and hours imported
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
