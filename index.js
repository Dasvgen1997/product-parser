const puppeteer = require('puppeteer-extra');
const fs = require('fs');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

// const url = 'https://www.vprok.ru/product/spmi-svinina-duhovaya-1kg--1131362';

const url =
  'https://www.vprok.ru/product/domik-v-derevne-dom-v-der-moloko-ster-3-2-950g--309202';

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  //установка региона 
  // node puppeteer.js https://www.vprok.ru/product/domik-v-derevne-dom-v-der-moloko-ster-3-2-950g--309202 "Санкт-Петербург и область"

  console.log('Устанавливаем размер окна...');
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  );

  console.log('Открываем страницу...');
  await page.goto(url, { waitUntil: 'networkidle2' });

  console.log('Ждем 10 секунд...');
  await new Promise((resolve) => setTimeout(resolve, 10000)); // Ожидание 10 секунд

  const aboutProduct = await page.evaluate(() => {
    // error
    const defaultPriceClass = '[class*="Price_role_regular"]';
    const discountPriceClass = '[class*="Price_role_discount"]';
    const discountOldPriceClass = '[class*="Price_role_old"]';

    const pathClass =
      '[class^="ProductPage_informationBlock"] [class*="Price_price"]';

    const defaultPriceElement = document.querySelector(
      pathClass + defaultPriceClass
    );

    const resultObj = {};

    // цена без скидки
    if (defaultPriceElement) {
      let elementText = defaultPriceElement?.innerText;

      resultObj.price = Number.parseFloat(
        elementText.replace(/\s+/g, '').replace(',', '.')
      );
    } else {
      const discountPriceElement = document.querySelector(
        pathClass + discountPriceClass
      );
      const discountPriceText = discountPriceElement?.innerText;

      const discountOldPriceElement = document.querySelector(
        pathClass + discountOldPriceClass
      );
      const discountOldPriceText = discountOldPriceElement?.innerText;

      resultObj.price = Number.parseFloat(
        discountPriceText.replace(/\s+/g, '').replace(',', '.')
      );
      resultObj.priceOld = Number.parseFloat(
        discountOldPriceText.replace(/\s+/g, '').replace(',', '.')
      );
    }

    const ratingElement = document.querySelector(
      '[class^="ActionsRow_reviewsWrapper"] [class*="ActionsRow_stars"]'
    );
    const ratingElementText = ratingElement?.innerText;

    resultObj.rating = Number.parseFloat(ratingElementText);

    const reviewsCountElement = document.querySelector(
      '[class^="ActionsRow_reviewsWrapper"] [class*="ActionsRow_reviews"]'
    );
    const reviewsCountElementText = reviewsCountElement?.innerText;

    resultObj.reviews = Number.parseFloat(reviewsCountElementText);

    return resultObj;
  });

  // Логирование результата на стороне Node.js
  //   console.log('Цены:', price);

  console.log('Делаем скриншот...');

  await page.screenshot({ path: 'screenshot.png', fullPage: true });
  //   #__next > div.FeatureAppLayoutBase_layout__0HSBo.FeatureAppLayoutBase_hideBannerMobile__97CUm.FeatureAppLayoutBase_hideBannerTablet__dCMoJ.FeatureAppLayoutBase_hideBannerDesktop__gPdf1 > main > div:nth-child(3) > div > div.ProductPage_informationBlock__vDYCH > div.ProductPage_desktopBuy__cyRrC > div > div > div > div.PriceInfo_root__GX9Xp > span

  console.log('Готово! Скриншот сохранен.');

  await browser.close();
  // Данные, которые мы хотим записать в файл
  const data = `
   price=${aboutProduct.price}
   priceOld=${aboutProduct.priceOld}
   rating=${aboutProduct.rating}
   reviewCount=${aboutProduct.reviews}
`;

  fs.writeFile('product.txt', data, (err) => {
    if (err) {
      console.error('Ошибка при записи файла:', err);
    } else {
      console.log('Файл успешно сохранен!');
    }
  });
})();
