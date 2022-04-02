import { parse } from "csv-parse";
import fs from "fs";
import as from "async";
import fetch from "node-fetch";

const apiKey = "AIzaSyAk2oDaN7Ffxw4SXjPKETlk-0YjbLSTYVU";
const fileText = fs.readFileSync("util/watchlist.csv", { encoding: "utf8" });
const ids = [];
const count = 50;

parse(fileText, { columns: true }, function (err, records) {
  as.forEachOf(
    records,
    function (record, index, next) {
      if (index < count) {
        const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
          record.Name
        )}+trailer&type=video&key=${apiKey}`;

        fetch(url, {
          headers: { Referer: "https://iangilman.com" },
        }).then((response) => {
          response.json().then((data) => {
            const id = data.items[0].id.videoId;
            ids.push(id);
            next();
          });
        });
      } else {
        next();
      }
    },
    function () {
      // _.chunk(ids, 50)

      console.log(
        `http://www.youtube.com/watch_videos?video_ids=${ids.join(",")}`
      );

      console.log("done");
    }
  );
});
