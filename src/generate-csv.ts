import * as fs from "fs";
import * as json2csv from "json2csv";

const path = "./storage/datasets/__CRAWLEE_TEMPORARY_0__/";

let jsonFiles = [];

const files = fs.readdirSync(path);
files.map((file) => jsonFiles.push(`${path}${file}`));

let jsonArray = [];
jsonFiles.forEach((file) => {
  let rawdata = fs.readFileSync(file);
  let json = JSON.parse(rawdata);
  jsonArray.push(json);
});

let csv = json2csv.parse(jsonArray);

fs.writeFileSync(`./output-${new Date().toISOString()}.csv`, csv);
