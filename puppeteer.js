const puppeteer = require('puppeteer-extra');
const fs = require('fs');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

const [, , url, region] = process.argv;

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  console.log('Устанавливаем размер окна...');
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  );

  console.log('Открываем страницу...');
  await page.goto(url, { waitUntil: 'networkidle2' });

  console.log('Ждем 10 секунд...');
  await new Promise((resolve) => setTimeout(resolve, 10000)); // Ожидание 10 секунд

  await page.waitForSelector('[class*="Region_region__"]');
  await page.click('[class*="Region_region__"]');

  await new Promise((resolve) => setTimeout(resolve, 5000));

  await page.waitForSelector('[class*="UiRegionListBase_item"]'); // Ждем появления элементов с этим классом
  await page.evaluate(
    (region) => {
      const items = document.querySelectorAll(
        '[class*="UiRegionListBase_item"]'
      );
      for (let item of items) {
        if (item.textContent.includes(region)) {
          item.click();
          break;
        }
      }
    },
    [region]
  );

  await new Promise((resolve) => setTimeout(resolve, 3000));

  const aboutProduct = await page.evaluate(() => {
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

  console.log('Делаем скриншот...');

  await page.screenshot({ path: 'screenshot.png', fullPage: true });

  console.log('Готово! Скриншот сохранен.');

  await browser.close();

  // Данные, которые мы хотим записать в файл
  const data = `
   price=${aboutProduct.price}
   priceOld=${aboutProduct.priceOld || '-'}
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
