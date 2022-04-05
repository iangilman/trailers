import { parse } from "csv-parse";
import fs from "fs";
import as from "async";
import fetch from "node-fetch";
import _ from "lodash";

const apiKey = "AIzaSyBN6SPRhF1ZOOaQmlAu2cLuk_xYFctLp1A";
const fileText = fs.readFileSync("util/watchlist.csv", { encoding: "utf8" });
const ids = [];
const start = 0;
const end = Infinity;
const failures = [];

parse(fileText, { columns: true }, function (err, records) {
  as.eachOfSeries(
    records,
    function (record, index, next) {
      if (index >= start && index < end) {
        const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
          record.Name
        )}+trailer&type=video&key=${apiKey}`;

        fetch(url, {
          headers: { Referer: "https://www.iangilman.com/" },
        }).then((response) => {
          response.json().then((data) => {
            if (data && data.items && data.items.length) {
              const id = data.items[0].id.videoId;
              console.log(record.Name, id);
              ids.push(id);
            } else {
              console.log(record.Name, "failed", data);
              failures.push(record.Name);
            }

            next();
          });
        });
      } else {
        next();
      }
    },
    function () {
      const sets = _.chunk(ids, 50);

      sets.forEach((idList) => {
        console.log(
          `http://www.youtube.com/watch_videos?video_ids=${idList.join(",")}`
        );
      });

      if (failures.length) {
        console.log("failed: ", failures.join(", "));
      }

      console.log("done");
    }
  );
});
