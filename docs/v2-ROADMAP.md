# PaperChai v2 — roadmap

High-level plan for what we're building next. Each doc has phases, checklists, and file lists.

| Feature | Doc | Status | Priority |
|---------|-----|--------|----------|
| Post-publish editing | [TODO-post-publish-editing.md](./TODO-post-publish-editing.md) | **Shipped** | — |
| Booking (email → WhatsApp → calendar → native) | [TODO-booking.md](./TODO-booking.md) | **Shipped** | — |
| Custom domains UX | [CUSTOM-DOMAINS.md](./CUSTOM-DOMAINS.md) | **Owner connect flow shipped** | — |
| Remove branding | `plan-features.ts` | **Shipped** (Basic+) | — |
| Payments (Razorpay) | — | Not planned yet | **P1** |
| Analytics | — | Not planned yet | P2 |

## Suggested sequence

```
1. ~~Post-publish editing~~   ✅
2. ~~Booking (all phases)~~   ✅
3. ~~Custom domain connect~~  ✅
4. ~~Remove branding~~        ✅
5. Razorpay + plan gates      → monetize (next)
6. Analytics MVP              → Pro tier
```

## Dev / staging flags

Until Razorpay is live, gate Basic features with env overrides:

- `BRANDING_ALLOW_FREE=true` — hide PaperChai footer for all plans
- `CUSTOM_DOMAIN_ALLOW_FREE=true` — allow domain connect on free plan

Or set `accounts.plan` to `basic` in Postgres (`pro` is treated as Basic for legacy rows).

---

*Last updated: 2026-06-10*
