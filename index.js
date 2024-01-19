const fs = require("fs");
const yaml = require("js-yaml");
const ejs = require("ejs");
const config = yaml.load(fs.readFileSync("_config.yml"));

const readSPARQL = (config) => {
  let stringData = [];

  const commentRe = /#\+.*/g;

  const dirPath = config["queries_directory"];

  fs.readdirSync(dirPath).forEach((file) => {
    const fileContent = fs.readFileSync(`${dirPath}${file}`).toString();
    const commentMatches = fileContent.match(commentRe);

    const grlcDecorators = commentMatches
      ? yaml.load(
          commentMatches
            .map((el) => el.replace(/#\+\s?/, ""))
            .join("\n")
        )
      : {};

    stringData.push({
      filename: file.split(".")[0],
      query: fileContent,
      encodedQuery: encodeURIComponent(fileContent),
      title: grlcDecorators["summary"],
      main_title: config["title"],
    });
  });
  return stringData;
};


const renderAll = (config) => {
  const queriesArr = readSPARQL(config);
  const allData = {
    queryFiles: queriesArr,
    ...config,
  };

  if (!fs.existsSync(config["output_directory"])) {
    fs.mkdirSync(config["output_directory"]);
    fs.mkdirSync(`${config["output_directory"]}/queries/`);
  }

  queriesArr.forEach((query) => {
    ejs.renderFile(allData["query_template"], query, {}, (err, str) => {
      if (err) throw err;

      fs.writeFile(
        `${config["output_directory"]}/queries/${query.filename}.html`,
        str,
        (err) => {
          if (err) throw err;
        }
      );
    });
  });

  ejs.renderFile(allData["index_template"], allData, {}, (err, str) => {
    if (err) throw err;

    fs.writeFile(`${config["output_directory"]}/index.html`, str, (err) => {
      if (err) throw err;
    });
  });
};

renderAll(config);
