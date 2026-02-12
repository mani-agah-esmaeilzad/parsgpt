module.exports = {
  globDirectory: 'out/', // مسیر build شده‌ی next export یا .next/static
  globPatterns: [
    '**/*.{js,css,html,png,svg,json}'
  ],
  swDest: 'public/service-worker.js',
  // maximumFileSizeToCacheInBytes: 10 * 1024 * 1024, // می‌توانی تنظیم کنی
};
