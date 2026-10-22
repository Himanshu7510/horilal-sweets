// Starter content so the store looks complete on first launch.
// Everything here can be edited or deleted from the admin panel.
import type { Db } from './db';

const v = (label: string, price: number, mrp: number, stock = 50, weightGrams = 500) => ({
  label,
  price,
  mrp,
  stock,
  sku: '',
  weightGrams,
});

const CATEGORIES = [
  { name: 'Ladoo', slug: 'ladoo', description: 'Hand-rolled, ghee-roasted classics.', image: '/sweets/ladoo.svg', sort: 1 },
  { name: 'Barfi & Katli', slug: 'barfi-katli', description: 'Silver-leafed slabs of khoya, kaju and pista.', image: '/sweets/katli.svg', sort: 2 },
  { name: 'Bengali Sweets', slug: 'bengali-sweets', description: 'Soft chhena sweets in light syrup.', image: '/sweets/rasgulla.svg', sort: 3 },
  { name: 'Dry Fruit & Sugar-free', slug: 'dry-fruit', description: 'Sweetened with dates and figs.', image: '/sweets/dryfruit.svg', sort: 4 },
  { name: 'Namkeen', slug: 'namkeen', description: 'Crunchy savouries to balance the sweet.', image: '/sweets/namkeen.svg', sort: 5 },
  { name: 'Gift Boxes', slug: 'gift-boxes', description: 'Assorted boxes for festivals and occasions.', image: '/sweets/giftbox.svg', sort: 6 },
];

const PRODUCTS = [
  {
    name: 'Motichoor Ladoo', slug: 'motichoor-ladoo', cat: 'ladoo', img: 'ladoo', featured: true, badge: 'Bestseller',
    short: 'Tiny gram-flour pearls fried in ghee and bound with cardamom syrup.',
    desc: 'Our motichoor is made from fine boondi fried in pure desi ghee, soaked in saffron-cardamom syrup and rolled by hand while still warm. Soft, fragrant and just sweet enough.',
    ingredients: 'Gram flour, desi ghee, sugar, cardamom, saffron, melon seeds', shelf: '7 days at room temperature',
    variants: [v('250 g', 180, 200, 60, 250), v('500 g', 340, 380, 60, 500), v('1 kg', 660, 740, 30, 1000)],
  },
  {
    name: 'Kaju Katli', slug: 'kaju-katli', cat: 'barfi-katli', img: 'katli', featured: true, badge: 'Bestseller',
    short: 'Thin cashew diamonds finished with edible silver leaf.',
    desc: 'Made with premium W240 cashews ground fresh each morning and cooked low and slow for a smooth, melt-in-the-mouth bite.',
    ingredients: 'Cashew nuts, sugar, desi ghee, edible silver leaf', shelf: '15 days at room temperature',
    variants: [v('250 g', 320, 360, 60, 250), v('500 g', 620, 700, 60, 500), v('1 kg', 1200, 1380, 30, 1000)],
  },
  {
    name: 'Besan Ladoo', slug: 'besan-ladoo', cat: 'ladoo', img: 'besan', featured: true, badge: '',
    short: 'Slow-roasted gram flour, ghee and a hint of cardamom.',
    desc: 'Besan roasted for nearly an hour until nutty and golden, then rolled with powdered sugar and a little crushed almond.',
    ingredients: 'Gram flour, desi ghee, sugar, almonds, cardamom', shelf: '20 days at room temperature',
    variants: [v('250 g', 160, 180, 60, 250), v('500 g', 300, 340, 60, 500), v('1 kg', 580, 660, 30, 1000)],
  },
  {
    name: 'Rasgulla (Tin)', slug: 'rasgulla-tin', cat: 'bengali-sweets', img: 'rasgulla', featured: false, badge: '',
    short: 'Spongy chhena balls in light sugar syrup, sealed in a tin.',
    desc: 'Fresh chhena kneaded by hand and simmered in syrup until airy. Packed in sealed tins so they travel well.',
    ingredients: 'Milk solids (chhena), sugar, water, rose water', shelf: '30 days unopened; refrigerate after opening',
    variants: [v('500 g tin', 220, 250, 80, 600), v('1 kg tin', 420, 480, 40, 1150)],
  },
  {
    name: 'Gulab Jamun (Tin)', slug: 'gulab-jamun-tin', cat: 'bengali-sweets', img: 'jamun', featured: true, badge: '',
    short: 'Khoya dumplings fried golden-brown and soaked in rose syrup.',
    desc: 'Made with fresh khoya and fried slowly so the centre stays soft. Warm them for a few seconds before serving.',
    ingredients: 'Khoya, refined flour, desi ghee, sugar, rose water, cardamom', shelf: '30 days unopened; refrigerate after opening',
    variants: [v('500 g tin', 220, 250, 80, 600), v('1 kg tin', 420, 480, 40, 1150)],
  },
  {
    name: 'Milk Cake', slug: 'milk-cake', cat: 'barfi-katli', img: 'milkcake', featured: false, badge: '',
    short: 'Caramelised, grainy milk fudge from slowly reduced milk.',
    desc: 'Full-cream milk reduced for hours until it caramelises at the centre, giving the classic two-tone grain.',
    ingredients: 'Full-cream milk, sugar, desi ghee, cardamom', shelf: '7 days refrigerated',
    variants: [v('250 g', 190, 210, 40, 250), v('500 g', 360, 400, 40, 500)],
  },
  {
    name: 'Pista Barfi', slug: 'pista-barfi', cat: 'barfi-katli', img: 'barfi', featured: true, badge: 'New',
    short: 'Khoya barfi layered with crushed Iranian pistachios.',
    desc: 'A khoya base topped with a generous layer of crushed pistachio and finished with silver leaf.',
    ingredients: 'Khoya, pistachios, sugar, desi ghee, edible silver leaf', shelf: '7 days refrigerated',
    variants: [v('250 g', 360, 400, 40, 250), v('500 g', 700, 780, 40, 500)],
  },
  {
    name: 'Soan Papdi', slug: 'soan-papdi', cat: 'barfi-katli', img: 'soanpapdi', featured: false, badge: '',
    short: 'Flaky, airy cubes of pulled sugar and gram flour.',
    desc: 'Pulled by hand into hundreds of fine strands, then pressed into light, crumbly cubes with pistachio slivers.',
    ingredients: 'Gram flour, refined flour, sugar, desi ghee, pistachios, cardamom', shelf: '60 days at room temperature',
    variants: [v('250 g', 140, 160, 80, 250), v('500 g', 260, 300, 80, 500)],
  },
  {
    name: 'Dry Fruit Ladoo (No Added Sugar)', slug: 'dry-fruit-ladoo', cat: 'dry-fruit', img: 'dryfruit', featured: true, badge: 'Sugar-free',
    short: 'Dates, figs, almonds and cashews — sweetened only by fruit.',
    desc: 'A dense, chewy ladoo of seedless dates and figs packed with roasted almonds, cashews and pistachios.',
    ingredients: 'Dates, figs, almonds, cashews, pistachios, desi ghee', shelf: '30 days at room temperature',
    variants: [v('250 g', 380, 420, 40, 250), v('500 g', 740, 820, 40, 500)],
  },
  {
    name: 'Aloo Bhujia', slug: 'aloo-bhujia', cat: 'namkeen', img: 'namkeen', featured: false, badge: '',
    short: 'Fine potato and gram-flour sev with a peppery kick.',
    desc: 'Crunchy sev made with potato and moth-bean flour, seasoned with black pepper and black salt.',
    ingredients: 'Gram flour, potato, moth bean flour, groundnut oil, spices', shelf: '90 days at room temperature',
    variants: [v('200 g', 90, 100, 100, 200), v('400 g', 170, 190, 100, 400)],
  },
  {
    name: 'Festive Assorted Gift Box', slug: 'festive-assorted-gift-box', cat: 'gift-boxes', img: 'giftbox', featured: true, badge: 'Gift',
    short: 'Kaju katli, besan ladoo, pista barfi and soan papdi in one box.',
    desc: 'A hand-packed assortment of our four most-loved sweets in a keepsake box, with space for a handwritten note.',
    ingredients: 'See individual sweets', shelf: '7 days (barfi), 15–60 days (others)',
    variants: [v('500 g box', 650, 720, 50, 650), v('1 kg box', 1250, 1400, 50, 1200)],
  },
];

const PAGES = [
  {
    slug: 'about', title: 'About us', in_header: true, sort: 1,
    content: `## Our story\n\nWe began in a small family kitchen with one recipe for besan ladoo and a lot of patience. Today we make more than twenty kinds of mithai and namkeen, but the method hasn't changed: small batches, pure desi ghee and no shortcuts.\n\n## How we make our sweets\n\n- Milk and khoya sourced fresh every morning\n- Pure desi ghee only — never vanaspati\n- No preservatives in our fresh range\n- Packed on the day of dispatch\n\nThank you for letting us be part of your celebrations.`,
  },
  {
    slug: 'shipping-policy', title: 'Shipping policy', sort: 2,
    content: `## Where we deliver\n\nWe ship across India through trusted courier partners.\n\n## Dispatch times\n\nOrders placed before 2 pm are packed and dispatched the same day. Orders after 2 pm ship the next working day.\n\n## Delivery times\n\nMost orders arrive in 3–6 business days. You'll receive a tracking link once your order ships.\n\n## Delivery charges\n\nA flat delivery charge applies to orders below the free-delivery limit shown at checkout.`,
  },
  {
    slug: 'refund-policy', title: 'Returns & refunds', sort: 3,
    content: `Because sweets are perishable, we can't accept returns. If your order arrives damaged or incorrect, write to us within 24 hours of delivery with a photo of the package and we'll send a replacement or a full refund.\n\nRefunds are processed to the original payment method within 5–7 business days.`,
  },
  {
    slug: 'privacy-policy', title: 'Privacy policy', sort: 4,
    content: `We collect only the details we need to deliver your order: your name, phone number, email and address. We never sell your data.\n\nPayments are processed securely by our payment partner; we don't store your card or UPI details.\n\nTo request deletion of your data, contact us using the details on our contact page.`,
  },
  {
    slug: 'terms', title: 'Terms & conditions', sort: 5,
    content: `By placing an order you agree to these terms.\n\n- Prices include applicable taxes unless stated otherwise.\n- Product images are for illustration; handmade sweets vary slightly in shape and colour.\n- We may cancel an order if an item is out of stock, in which case you'll receive a full refund.`,
  },
];

export async function seedDatabase(db: Db) {
  // Only one instance seeds: the one that manages to insert the marker row.
  const marker = await db.query(
    `INSERT INTO settings (key, value) VALUES ('_seeded', '{"at":"now"}'::jsonb) ON CONFLICT (key) DO NOTHING RETURNING key`
  );
  if (!marker.length) return;

  const catIds: Record<string, number> = {};
  for (const c of CATEGORIES) {
    const rows = await db.query(
      `INSERT INTO categories (name, slug, description, image, sort) VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
      [c.name, c.slug, c.description, c.image, c.sort]
    );
    catIds[c.slug] = rows[0].id;
  }

  let sort = 0;
  for (const p of PRODUCTS) {
    sort++;
    await db.query(
      `INSERT INTO products (name, slug, category_id, short_description, description, ingredients, shelf_life, images, variants, badge, featured, sort)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9::jsonb,$10,$11,$12) ON CONFLICT (slug) DO NOTHING`,
      [
        p.name, p.slug, catIds[p.cat], p.short, p.desc, p.ingredients, p.shelf,
        JSON.stringify([`/sweets/${p.img}.svg`]), JSON.stringify(p.variants), p.badge, p.featured, sort,
      ]
    );
  }

  for (const pg of PAGES) {
    await db.query(
      `INSERT INTO pages (slug, title, content, in_header, sort) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (slug) DO NOTHING`,
      [pg.slug, pg.title, pg.content, !!(pg as any).in_header, pg.sort]
    );
  }

  await db.query(
    `INSERT INTO coupons (code, type, value, min_order, max_discount, description) VALUES
     ('WELCOME10', 'percent', 10, 499, 200, '10% off your first order') ON CONFLICT (code) DO NOTHING`
  );
}
