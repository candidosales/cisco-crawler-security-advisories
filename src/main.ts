// For more information, see https://crawlee.dev/
import { PlaywrightCrawler, Dataset, log } from "crawlee";

export const TOTAL_ITEMS = 4693;
const MAX_ITEMS = 100;
const PAGES = Math.round(TOTAL_ITEMS / MAX_ITEMS);

log.setLevel(log.LEVELS.DEBUG);

// https://docs.apify.com/academy/advanced-web-scraping/scraping-paginated-sites
const createPaginationUrl = (page = 0) => {
  const offset = page * MAX_ITEMS;
  return `https://sec.cloudapps.cisco.com/security/center/publicationListing.x?product=Cisco&sort=-day_sir&limit=${MAX_ITEMS}&offset=${offset}#~Vulnerabilities`;
};

// Let's create the pivot requests
const initialRequests = [];

log.debug("Creating URLs ...");
for (let index = 0; index < PAGES; index++) {
  initialRequests.push({
    url: createPaginationUrl(index),
    label: "PAGINATION",
  });
}

const crawler = new PlaywrightCrawler({
  headless: true,
  requestHandler: async ({ page, request, parseWithCheerio, enqueueLinks }) => {
    // const title = await page.locator("h1").textContent();

    if (request.label === "DETAIL") {
      // Wait to render.
      await page.waitForSelector("#ud-advisory-identifier");
      const $ = await parseWithCheerio();

      const title = $("h1.headline").text();
      log.debug(`Page: ${title}`);

      // We're not doing anything with the details yet.
      const urlParts = request.url.split("/").slice(-2);
      const results = {
        url: request.url,
        uniqueIdentifier: urlParts[1],
        title: title,
        severity: $("#severitycirclecontent").text(),
        cveList: $(".CVEList").text(),
        cvsScore: $(".ud-CVSSScore .divLabelContent a").text(),
        summary: $("div#summaryfield").text(),
        affectedProducts: $("div#affectfield").text(),
        firstPublished: $("div#ud-published div.divLabelContent").text(),
        details: $("div#detailfield").text(),
        workarounds: $("div#workaroundsfield").text(),
        fixedSoftware: $("div#fixedsoftfield").text(),
        exploitationPublicAnnouncements: $("div#exploitfield").text(),
        source: $("div#sourcefield").text(),
      };
      await Dataset.pushData(results);
    } else {
      // Wait to render.
      await page.waitForSelector("tr.rowRepeat");
      await enqueueLinks({
        selector: "span.advListItem a",
        label: "DETAIL",
      });
    }
  },
});

// Let's start the crawl
await crawler.run(initialRequests);
