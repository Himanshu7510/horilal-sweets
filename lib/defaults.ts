// Default values for every editable setting. Anything saved in the admin panel
// is merged on top of these, so new fields always have a sensible value.

export const DEFAULT_SETTINGS: Record<string, any> = {
  site: {
    brandName: 'Horilal Sweets',
    tagline: 'Handmade Indian sweets, made fresh every morning',
    logo: '',
    favicon: '',
    primaryColor: '#A3174F',
    accentColor: '#E39B26',
    inkColor: '#2B1534',
    paperColor: '#FCF7F8',
    announcementOn: true,
    announcement: 'Free delivery on orders above ₹999 · Fresh batches packed the same day',
    whatsapp: '',
    showVegMark: true,
    orderPrefix: 'HS',
  },
  home: {
    heroTitle: 'Mithai the way it was made at home',
    heroSubtitle:
      'Slow-roasted besan, pure desi ghee and hand-rolled ladoos, packed fresh and sent to your door.',
    heroCtaText: 'Shop sweets',
    heroCtaLink: '/shop',
    heroSecondaryText: 'Gift boxes',
    heroSecondaryLink: '/shop?category=gift-boxes',
    heroImage: '',
    showCategories: true,
    categoriesTitle: 'Shop by kind',
    featuredTitle: 'Bestsellers this week',
    featuredSubtitle: 'The boxes our regulars reorder most.',
    storyTitle: 'One kitchen, three generations of recipes',
    storyText:
      'We started with a single kadhai and a family recipe for besan ladoo. Today we still roast every batch by hand, sweeten with care, and never use preservatives in our fresh range.\n\nEvery box is packed on the day it ships, so what reaches you tastes the way it does at our counter.',
    storyImage: '',
    features: [
      { title: 'Pure desi ghee', text: 'No vanaspati, no shortcuts. Just ghee, milk, sugar and patience.' },
      { title: 'Made fresh daily', text: 'Small batches every morning, packed the same day they ship.' },
      { title: 'Ships across India', text: 'Sealed, cushioned boxes with tracking on every order.' },
      { title: 'Festive gifting', text: 'Curated boxes with a handwritten note for the people you love.' },
    ],
    festiveOn: true,
    festiveTitle: 'Diwali gift boxes are here',
    festiveText: 'Assorted mithai and dry-fruit boxes for family, friends and corporate gifting. Bulk orders welcome.',
    festiveCtaText: 'See gift boxes',
    festiveCtaLink: '/shop?category=gift-boxes',
    festiveImage: '',
    testimonialsTitle: 'What our customers say',
    testimonials: [
      { name: 'Priya S.', city: 'Bengaluru', text: 'The kaju katli tasted exactly like the one from my nani’s favourite halwai. Arrived perfectly packed.' },
      { name: 'Rahul M.', city: 'Pune', text: 'Ordered gift boxes for the whole office. Everyone asked where they were from.' },
      { name: 'Ananya K.', city: 'Hyderabad', text: 'Soft, fresh motichoor ladoos — you can tell they use real ghee.' },
    ],
  },
  footer: {
    about: 'Handmade mithai and namkeen, prepared fresh in small batches and shipped across India.',
    address: '',
    phone: '',
    email: '',
    hours: 'Mon–Sun, 9:00 am – 9:00 pm',
    instagram: '',
    facebook: '',
    youtube: '',
    fssai: '',
    gstin: '',
    copyright: '',
  },
  seo: {
    title: 'Horilal Sweets — Handmade Indian Sweets Online',
    description:
      'Order fresh, handmade Indian sweets, ladoos, barfi, kaju katli and festive gift boxes online. Pure desi ghee, delivered across India.',
    ogImage: '',
    keywords: 'indian sweets online, mithai, kaju katli, ladoo, gift box',
  },
  payment: {
    razorpayEnabled: false,
    razorpayKeyId: '',
    razorpayKeySecret: '',
    razorpayWebhookSecret: '',
    razorpayThemeColor: '',
    codEnabled: true,
    codMaxOrder: 5000,
    codNote: 'Pay in cash or UPI when your order arrives.',
  },
  delivery: {
    provider: 'manual',
    flatFee: 60,
    freeAbove: 999,
    codFee: 30,
    minOrder: 199,
    serviceablePincodes: '',
    blockedPincodes: '',
    estimate: '3–6 business days',
    sameDayNote: '',
    shiprocketEmail: '',
    shiprocketPassword: '',
    shiprocketPickupLocation: 'Primary',
    shiprocketPickupPincode: '',
    shiprocketAutoAwb: true,
    shiprocketAutoPickup: false,
    shiprocketCheckServiceability: false,
    pkgLength: 20,
    pkgBreadth: 15,
    pkgHeight: 8,
    defaultWeightKg: 0.5,
  },
};

// Fields that hold secrets. They are stored encrypted and never sent to the browser.
export const SECRET_FIELDS: Record<string, string[]> = {
  payment: ['razorpayKeySecret', 'razorpayWebhookSecret'],
  delivery: ['shiprocketPassword'],
};

export const ORDER_STATUSES = [
  { value: 'pending_payment', label: 'Awaiting payment' },
  { value: 'placed', label: 'Placed' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'packed', label: 'Packed' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'out_for_delivery', label: 'Out for delivery' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'returned', label: 'Returned' },
];

export const statusLabel = (s: string) => ORDER_STATUSES.find((x) => x.value === s)?.label ?? s;
