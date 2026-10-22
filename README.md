# Sweets store

An online store for an Indian sweets brand, with a full admin panel. Built with Next.js and deployed on Vercel.

## What's included

**Storefront:** homepage, shop with categories and search, product pages with pack sizes, cart, checkout with coupons, pincode check, Razorpay online payments and cash on delivery, order confirmation, order tracking, contact form and editable information pages.

**Admin panel (`/admin`):** dashboard, orders (status updates, Shiprocket shipping, manual tracking, refunds, printable invoices), products (photos, sizes, prices, stock), categories, coupons, messages, all website content (brand, colours, homepage, footer, SEO), pages, payment settings, delivery settings and account.

## First-time setup

1. Open `/admin` on your site and create the admin account.
2. In Vercel, connect a Postgres database (Project → Storage → Neon). Without it, data is temporary.
3. In the admin panel, add your brand details, Razorpay keys (Payments) and delivery settings (Delivery).

## Environment variables

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` or `POSTGRES_URL` | Postgres connection (added automatically by Neon on Vercel) |
| `AUTH_SECRET` | Signs admin sessions and encrypts stored API keys |
| `BLOB_READ_WRITE_TOKEN` | Image uploads to Vercel Blob (added automatically when a Blob store is connected) |

## Local development

```bash
npm install
npm run dev
```

Without `DATABASE_URL`, an embedded database is created in `.data/`.
