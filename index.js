// This script ports tracks from the old site to the new site.
// The output files are in the `out` directory.

const yaml = require("yaml-front-matter");
const fs = require("fs");
const { Octokit } = require("@octokit/core");
const axios = require("axios").default;
const path = require("path");

// Variables
const owner = "CodingTrain";
const repoOld = "website-archive";
const folderO = "_beginners/p5js";
const repoNew = "thecodingtrain.com";
const folderN = "content/videos/code";

// init octokit
const gh = new Octokit({});

const template = {
  title: "",
  description: "",
  videoId: "",
  date: "",
  languages: ["p5.js", "JavaScript"],
  topics: ["basics"],
  canContribute: true,
  timestamps: [],
  codeExamples: [
    {
      title: "Random Square Design",
      description: "Using the random() function to draw randomly sized squares",
      image: "GameOfLife.webp",
      urls: {
        p5: "https://editor.p5js.org/codingtrain/sketches/Sl8ml_Lz8",
        other: "https://github.com/CodingTrain/website/tree/main/beginners/p5js/2.4-random/random-square-design",
      },
    },
  ],
  groupLinks: [
    {
      title: "Group of links title",
      links: [
        {
          title: "Link 1 title",
          url: "link 1 url",
          description: "description of content linked",
        },
        {
          title: "Link 2 title",
          url: "link 2 url",
          description: "description of content linked",
        },
      ],
    },
  ],
};

async function main() {
  const { data: files } = await gh.request("GET /repos/{owner}/{repo}/contents/{path}", {
    owner,
    repo: repoOld,
    path: folderO,
  });
  const newVideoFileContent = [];
  const { data: newFiles } = await gh.request("GET /repos/{owner}/{repo}/contents/{path}", {
    owner,
    repo: repoNew,
    path: folderN,
  });
  for (const nf of newFiles) {
    const { data: vids } = await gh.request("GET /repos/{owner}/{repo}/contents/{path}", {
      owner,
      repo: "thecodingtrain.com",
      path: nf.path,
    });
    for (const vid of vids) {
      const { data: videoContent } = await axios.get(
        `https://raw.githubusercontent.com/CodingTrain/thecodingtrain.com/main/${vid.path}/index.json`
      );
      videoContent.__path = vid.path.replace("content/videos/code/", "").split("/").filter(Boolean);
      newVideoFileContent.push(videoContent);
    }
  }
  for (const file of files) {
    if (file.name === "index.md") return;
    const { data } = await axios.get(file.download_url);
    const parsed = yaml.loadFront(data);
    const newData = newVideoFileContent.find(
      (v) => v.videoId === parsed.video_id //|| v.videoNumber == parsed.video_number
    );
    if (!newData) {
      throw new Error(`No video found for ${parsed.video_id}`);
    }

    const videoFile = {
      title: newData.videoNumber ? `${newData.videoNumber} ${newData.title}` : newData.title,
      description: newData.description, //parsed.__content.trim(),
      videoId: parsed.video_id === newData.videoId ? parsed.video_id : `${parsed.video_id}-${newData.videoId}`,
      date: newData.date, //parsed.date.toLocaleDateString(),
      languages: newData.languages,
      topics: newData.topics,
      canContribute: newData.canContribute,
      timestamps: parsed.topics?.map((t) => ({ time: t.time, title: t.title })) || [],
      codeExamples: [
        parsed.web_editor
          ? {
              title: parsed.title,
              description: "Demonstration of " + parsed.title,
              image: "",
              urls: {
                p5: "https://editor.p5js.org/codingtrain/sketches/" + parsed.web_editor,
              },
            }
          : null,
        ...(parsed.variations?.map((ex) => ({
          title: ex.name,
          description: "Demonstration of " + ex.name,
          image: "",
          urls: {
            p5: "https://editor.p5js.org/codingtrain/sketches/" + ex.web_editor,
          },
        })) || []),
      ].filter((ex) => ex),
      groupLinks: [
        parsed.videos
          ? {
              title: "Videos",
              links: parsed.videos.map((v) => ({
                icon: v.author === "The Coding Train" ? "🚂" : "🎥",
                title: v.title,
                url: v.url,
                description:
                  v.author === "The Coding Train" ? `Tutorial on ${v.title}` : `${v.author}'s Tutorial on ${v.title}`,
              })),
            }
          : null,
        parsed.links
          ? {
              title: "References",
              links: parsed.links.map((l) => ({
                icon: "🔗",
                title: l.title,
                url: l.url,
                description: l.title,
              })),
            }
          : null,
      ].filter((g) => g),
    };
    const contributions =
      parsed.contributions?.map((c) => ({
        title: c.title,
        author: {
          name: typeof c.author === "string" ? c.author : c.author.name,
          url: c.author.url || c.author.source,
        },
        url: c.url,
      })) || [];

    // console.log(newData.__path);
    const dirname = path.join("out", ...newData.__path);
    if (!fs.existsSync(path.join(dirname, "/index.json"))) {
      console.log("Writing file - " + dirname);
      writeFileN(path.join(dirname, "index.json"), JSON.stringify(videoFile, null, 2));
      for (const i in contributions) {
        const con = contributions[i];
        console.log("-- Contribution " + (+i + 1));
        writeFileN(path.join(dirname, `contributions/contribution${+i + 1}.json`), JSON.stringify(con, null, 2));
      }
    }
  }
}

main();

function writeFileN(path, contents) {
  fs.mkdirSync(require("path").dirname(path), { recursive: true });
  fs.writeFileSync(path, contents);
}
