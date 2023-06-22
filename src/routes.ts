import { createPlaywrightRouter, Dataset } from "crawlee";

// createPlaywrightRouter() is only a helper to get better
// intellisense and typings. You can use Router.create() too.
export const router = createPlaywrightRouter();

// This replaces the request.label === DETAIL branch of the if clause.
router.addHandler(
  "DETAIL",
  async ({ request, page, parseWithCheerio, log }) => {
    log.debug(`Extracting data: ${request.url}`);
    // Wait to render.
    await page.waitForSelector("#ud-advisory-identifier");
    const $ = await parseWithCheerio();

    const title = $("h1.headline").text();
    log.debug(`Page: ${title}`);

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
  }
);

// This is a fallback route which will handle the start URL
// as well as the LIST labeled URLs.
router.addDefaultHandler(async ({ request, page, enqueueLinks, log }) => {
  //   log.debug(`Enqueueing pagination: ${request.url}`);
  //   await page.waitForSelector(".ActorStorePagination-buttons a");
  //   await enqueueLinks({
  //     selector: ".ActorStorePagination-buttons a",
  //     label: "LIST",
  //   });
  log.debug(`Enqueueing cisco advisories: ${request.url}`);
  await page.waitForSelector("tr.rowRepeat");
  await enqueueLinks({
    selector: "span.advListItem a",
    label: "DETAIL",
  });
});
